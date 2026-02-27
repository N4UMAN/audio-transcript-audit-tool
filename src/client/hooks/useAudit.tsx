import { useState, useCallback, useEffect } from 'react'
import { server } from '../utils/gas-bridge'
import useHistory from './useHistory'
import useVersioning from './useVersioning'
import { useToast } from './useToast'


interface useAuditReturn {
    status: AuditStatus;
    auditData: AuditData | null;
    selectedCell: string | null;
    startAudit: () => Promise<number>;
    selectCell: (cellAddress: string) => void;
    fixCurrent: () => Promise<void>;
    fixAll: () => Promise<void>;
    handleIgnore: (item: AuditCorrections) => Promise<void>;
    resetAudit: () => Promise<void>;
    undo: () => Promise<void>;
    redo: () => Promise<void>;
    canRedo: boolean;
    canUndo: boolean;
}

const REQUIRED_HEADERS = [
    "segment",
    "speaker",
    "start time",
    "end time",
    "transcript",
    "non-speech events",
    "emotions",
    "language",
    "locale",
    "accent"
]
const MIN_DATA_ROWS = 2

export function useAudit(): useAuditReturn {
    const [status, setStatus] = useState<AuditStatus>('idle');
    const [auditData, setAuditData] = useState<AuditData | null>(null);
    const [selectedCell, setSelectedCell] = useState<string | null>(null);


    const { showToast } = useToast();

    //Helpers
    const removeFromSidebar = useCallback((itemsToRemove: AuditCorrections[]) => {
        const addressesToRemove = new Set(itemsToRemove.map(i => i.cellAddress));
        setAuditData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                corrections: prev.corrections.filter(c => !addressesToRemove.has(c.cellAddress))
            };
        });
    }, []);

    const restoreToSidebar = useCallback((itemsToRestore: AuditCorrections[]) => {
        setAuditData(prev => {
            if (!prev) return prev;
            return { ...prev, corrections: [...prev.corrections, ...itemsToRestore] }
        });
    }, []);


    const history = useHistory({
        onRemoveFromActiveList: removeFromSidebar,
        onRestoreToActiveList: restoreToSidebar,

        syncToSheet: async (action, direction) => {
            await server.applyHistoryAction(action.items, action.type, direction);
        }
    });

    const { performAuthorizedChange } = useVersioning({
        onInvalidate: useCallback(async () => {
            await resetAudit();
            showToast("Sheet edited manually, Audit data cleared to prevent errors.");
        }, [showToast])
    });

    //Check for cached audit and load it
    useEffect(() => {
        const init = async () => {
            setStatus('restoring');
            const cached = await server.getCachedAudit();

            if (!cached) {
                setStatus('idle');
                return;
            }

            let parsed;

            try {
                parsed = JSON.parse(cached);

                if (!parsed)
                    throw Error
            } catch (error) {
                setStatus('idle');
                return;
            }

            const cloudVersion = await server.getSheetVersion();
            const { data, versionAtTimeOfAudit } = parsed;

            if (cloudVersion === versionAtTimeOfAudit) {
                setAuditData(data);
                setStatus('ready');
            } else {
                console.warn("Sheet version mismatch. Purging stale cache.");
                await resetAudit();
                showToast("Sheet was modified since last audit. Please re-audit.");
            }

        }


        init();
    }, []);

    //Perform a new audit
    const startAudit = useCallback(async (): Promise<number> => {
        setStatus('auditing');

        try {
            //Get sheet context from App script and preprocess to check if can perform audit
            const rawResponse = await server.getSheetContext();

            const context: SheetContext = typeof rawResponse === 'string' ?
                JSON.parse(rawResponse) : rawResponse;

            if (!context || !context.values) {
                throw new Error(`Sheet is empty. Recieved: ${context}`);
            }

            const sheetHeaders = context.headers.map((h: any) => String(h).toLowerCase().trim());
            const missingHeaders = REQUIRED_HEADERS.filter((req: any) => !sheetHeaders.includes(req.toLowerCase()));

            if (missingHeaders.length > 0) {
                throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
            }

            const dataRowCount = context.values.length - 1

            if (dataRowCount < MIN_DATA_ROWS) {
                throw new Error(`Sheet needs at least ${MIN_DATA_ROWS} row(s) of data below the header.`);
            }


            //Calling API Endpoint
            const response = await server.runSecureAudit(context);
            const data: AuditData = typeof response === 'string' ? JSON.parse(response) : response;


            //Apply highlights and cache data
            await performAuthorizedChange(async () => {
                await server.highlightCells(data.corrections);
            });

            await server.saveAuditToCache(data);
            setAuditData(data);
            setStatus('ready');

            return data?.corrections.length || 0;
        } catch (error) {
            console.error('Audit failed', error);
            setStatus('idle');
            throw error;
        }
    }, [performAuthorizedChange]);

    //Select a cell
    const selectCell = useCallback((cellAddress: string): void => {
        setSelectedCell(cellAddress);
        server.selectCell(cellAddress).catch(console.error);
    }, []);

    //Fix currently selected cell
    const fixCurrent = useCallback(async (): Promise<void> => {
        if (!selectedCell || !auditData) {
            throw new Error("Nothing to fix");
        }

        //get correction object for selected cell
        const correction = auditData.corrections.find(
            (c) => c.cellAddress === selectedCell
        );

        if (!correction) {
            throw new Error("Correction not found");
        }

        //Create history action object
        const action: HistoryAction = {
            id: Date.now().toString(),
            type: 'FIX',
            items: [correction]
        }

        //Record history action, remove correction from UI, apply action to sheet.
        await performAuthorizedChange(async () => {
            history.record(action);
            removeFromSidebar([correction]);
            await server.applyHistoryAction([correction], 'FIX', 'redo');

        }).catch(error => {
            restoreToSidebar([correction]);
            throw error;
        })

        setSelectedCell(null);
    }, [selectedCell, auditData])

    //Fix all issues
    const fixAll = useCallback(async (): Promise<void> => {
        if (!auditData || auditData.corrections.length === 0) {
            return;
        }

        const batch = [...auditData.corrections];

        const action: HistoryAction = {
            id: Date.now().toString(),
            type: 'FIX',
            items: batch
        };

        //Cache auditData before nuking it incase of restoration
        const auditCache = auditData;

        await performAuthorizedChange(async () => {
            history.record(action);
            //Optimistically clear whole sidebar
            setAuditData(prev => prev ? { ...prev, corrections: [] } : null);
            await server.applyHistoryAction(batch, 'FIX', 'redo');

        }).catch(error => {
            setAuditData(auditCache);
            throw error;
        });

    }, [auditData, performAuthorizedChange, history]);


    //Ignore - Removes specific cell from corrections
    const handleIgnore = async (item: AuditCorrections): Promise<void> => {
        const action: HistoryAction = {
            id: Date.now().toString(),
            type: 'IGNORE',
            items: [item]
        }
        performAuthorizedChange(async () => {
            history.record(action);
            removeFromSidebar([item]);
            await server.applyHistoryAction([item], 'IGNORE', 'redo');
        }).catch(error => {
            restoreToSidebar([item]);
            throw error;
        });

    };

    const resetAudit = useCallback(async (): Promise<void> => {
        setStatus('resetting');

        await performAuthorizedChange(async () => {
            if (auditData?.corrections.length) {
                await server.removeCellHighlights(auditData.corrections.map(c => c.cellAddress));
            }
            //Clear cache
            await server.saveAuditToCache(null);
        });

        setStatus('idle');
        setAuditData(null);
        history.clearHistory();
        setSelectedCell(null);
    }, [auditData, history, performAuthorizedChange]);

    const undo = useCallback(async () => {
        await performAuthorizedChange(async () => await history.undo())
    }, [history, performAuthorizedChange]);

    const redo = useCallback(async () => {
        await performAuthorizedChange(async () => await history.redo())
    }, [history, performAuthorizedChange])

    return {
        status,
        auditData,
        selectedCell,
        startAudit,
        selectCell,
        fixCurrent,
        fixAll,
        handleIgnore,
        resetAudit,
        undo: undo,
        redo: redo,
        canRedo: history.canRedo && !history.isHistoryBusy,
        canUndo: history.canUndo && !history.isHistoryBusy
    }
}
