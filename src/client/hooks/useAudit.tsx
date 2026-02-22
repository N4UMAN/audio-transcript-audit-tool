import { useState, useCallback, useEffect } from 'react'
import { server } from '../utils/gas-bridge'

interface useAuditConfig {
    apiEndpoint: string,
    apiKey: string
}

interface useAuditReturn {
    status: AuditStatus;
    auditData: AuditData | null;
    selectedCell: string | null;
    startAudit: () => Promise<void>;
    selectCell: (cellAddress: string) => void;
    fixCurrent: () => Promise<void>;
    fixAll: () => Promise<void>;
    ignoreCorrection: (cellAddress: string) => void;
    resetAudit: () => void;
    undo: () => Promise<void>;
    canUndo: boolean
}

export function useAudit(config: useAuditConfig): useAuditReturn {
    const [status, setStatus] = useState<AuditStatus>('idle');
    const [auditData, setAuditData] = useState<AuditData | null>(null);
    const [selectedCell, setSelectedCell] = useState<string | null>(null);
    const [undoHistory, setUndoHistory] = useState<UndoHistoryItem[]>([]);

    //Check for cached audit and load it
    useEffect(() => {
        const loadCachedAudit = async (): Promise<void> => {
            try {
                const cached = await server.getCachedAudit();

                if (cached) {
                    const data: AuditData = JSON.parse(cached);
                    setAuditData(data);
                    setStatus('ready');
                }
            } catch (error) {
                console.warn("No cached audit found");
            }
        }

        loadCachedAudit();
    }, []);

    //Perform a new audit
    const startAudit = useCallback(async (): Promise<void> => {
        setStatus('auditing');

        try {
            //1: Get sheet context from App script and preprocess to check if can perform audit
            const context: SheetContext = await server.getSheetContext();

            if (!context || context.values.length < 2) {
                throw new Error('Sheet is empty or invalid');
            }

            //2: Calling API Endpoint

            const response = await fetch(config.apiEndpoint, {
                method: 'POST',
                headers: {
                    "X-API-KEY": config.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(context)
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data: AuditData = await response.json();

            //3: Apply highlights and cache data
            await server.highlightCells(data.corrections);
            await server.saveAuditToCache(JSON.stringify(data));

            setAuditData(data);
            setStatus('ready');
        } catch (error) {
            console.error('Audit failed', error);
            setStatus('idle');
            throw error;
        }
    }, [config.apiEndpoint])

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

        const histoyItem: UndoHistoryItem = {
            cellAddress: correction.cellAddress,
            previousValue: correction.originalValue,
            newValue: correction.fixedValue,
            timestamp: Date.now()
        };

        setUndoHistory(prev => [...prev, histoyItem])
        await server.applyFix(correction.cellAddress, correction.fixedValue);

        //Remove cell from local state
        setAuditData((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                corrections: prev.corrections.filter(
                    (c) => c.cellAddress !== selectedCell
                )
            };
        });

        setSelectedCell(null);
    }, [selectedCell, auditData])

    //Fix all issues
    const fixAll = useCallback(async (): Promise<void> => {
        if (!auditData || auditData.corrections.length === 0) {
            return;
        }

        await server.applyFixAll(auditData.corrections);

        setAuditData((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                corrections: []
            };
        });
    }, [auditData])


    //Ignore - Removes specific cell from corrections
    const ignoreCorrection = useCallback((cellAddress: string): void => {
        setAuditData((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                corrections: prev.corrections.filter(
                    (c) => c.cellAddress !== cellAddress
                )
            };
        });

        if (selectedCell === cellAddress) {
            setSelectedCell(null);
        }
    }, [selectedCell])

    const undo = useCallback(async (): Promise<void> => {
        if (undoHistory.length === 0) {
            throw new Error('Nothing to undo');
        }

        const lastAction = undoHistory[undoHistory.length - 1];

        await server.applyFix(lastAction.cellAddress, lastAction.previousValue);
        setUndoHistory(prev => prev.slice(0, -1));
    }, [undoHistory]);

    const resetAudit = useCallback((): void => {
        setStatus('idle');
        setSelectedCell(null);
    }, []);

    return {
        status,
        auditData,
        selectedCell,
        startAudit,
        selectCell,
        fixCurrent,
        fixAll,
        ignoreCorrection,
        resetAudit,
        undo,
        canUndo: undoHistory.length > 0
    }
}
