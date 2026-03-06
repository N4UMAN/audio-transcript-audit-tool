import { useState, useCallback, useEffect } from 'react'
import { server } from '../utils/gas-bridge'
import useHistory from './useHistory'


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


export function useAudit(): useAuditReturn {
    const [status, setStatus] = useState<AuditStatus>('idle');
    const [auditData, setAuditData] = useState<AuditData | null>(null);
    const [selectedCell, setSelectedCell] = useState<string | null>(null);


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
            await server.dispatchAction(action.items, action.type, direction);
        }
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

            try {
                const data: AuditData = JSON.parse(cached);

                if (!data) throw new Error();

                setAuditData(data);
                setStatus('ready');

            } catch (error) {
                setStatus('idle');
            }

        };

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


            //Calling API Endpoint
            const response = await server.runSecureAudit(context);
            const data: AuditData = typeof response === 'string' ? JSON.parse(response) : response;

            setAuditData(data);
            setStatus('ready');

            return data?.corrections.length || 0;
        } catch (error) {
            console.error('Audit failed', error);
            setStatus('idle');
            throw error;
        }
    }, []);

    //Select a cell
    const selectCell = useCallback((cellAddress: string): void => {
        setSelectedCell(cellAddress);
        server.selectCell(cellAddress).catch(console.error);
    }, []);

    //Fix currently selected cell
    const fixCurrent = useCallback(async (): Promise<void> => {
        if (!selectedCell || !auditData) throw new Error("Nothing to fix");

        //get correction object for selected cell
        const correction = auditData.corrections.find(
            (c) => c.cellAddress === selectedCell
        );

        if (!correction) throw new Error("Correction not found");

        //Create history action object
        const action: HistoryAction = {
            id: Date.now().toString(),
            type: 'FIX',
            items: [correction]
        }

        //Record history action, remove correction from UI, apply action to sheet.
        try {
            history.record(action);
            removeFromSidebar([correction]);

            await server.dispatchAction([correction], 'FIX', 'redo'); // GAS: applies fix + increments version + updates cache
        } catch (error) {
            restoreToSidebar([correction]);
            throw error;
        }

        setSelectedCell(null);
    }, [selectedCell, auditData])

    //Fix all issues
    const fixAll = useCallback(async (): Promise<void> => {
        if (!auditData || auditData.corrections.length === 0) return;


        const batch = [...auditData.corrections];

        const action: HistoryAction = {
            id: Date.now().toString(),
            type: 'FIX',
            items: batch
        };

        //Cache auditData before nuking it incase of restoration
        const auditCache = auditData;

        try {
            history.record(action);
            //Optimistically clear whole sidebar
            setAuditData(prev => prev ? { ...prev, corrections: [] } : null);

            await server.dispatchAction(batch, 'FIX', 'redo');
        } catch (error) {
            setAuditData(auditCache);
            throw error;
        };


    }, [auditData, history]);


    //Ignore - Removes specific cell from corrections
    const handleIgnore = async (item: AuditCorrections): Promise<void> => {
        const action: HistoryAction = {
            id: Date.now().toString(),
            type: 'IGNORE',
            items: [item]
        }

        try {
            history.record(action);
            removeFromSidebar([item]);
            await server.dispatchAction([item], 'IGNORE', 'redo');
        } catch (error) {
            restoreToSidebar([item]);
            throw error;
        };

    };

    const resetAudit = useCallback(async (): Promise<void> => {
        setStatus('resetting');

        try {
            await server.resetAudit();
        } finally {

            setStatus('idle');
            setAuditData(null);
            history.clearHistory();
            setSelectedCell(null);
        }
    }, [auditData, history]);

    const undo = useCallback(async () => {
        await history.undo();
    }, [history]);

    const redo = useCallback(async () => {
        await history.redo();
    }, [history])

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
