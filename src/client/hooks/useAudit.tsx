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
    ignoreCorrection: (cellAddress: string) => Promise<void>;
    resetAudit: () => Promise<void>;
    undo: () => Promise<void>;
    redo: () => Promise<void>;
    canRedo: boolean;
    canUndo: boolean;
}

export function useAudit(config: useAuditConfig): useAuditReturn {
    const [status, setStatus] = useState<AuditStatus>('idle');
    const [auditData, setAuditData] = useState<AuditData | null>(null);
    const [selectedCell, setSelectedCell] = useState<string | null>(null);
    const [undoHistory, setUndoHistory] = useState<AuditCorrections[][]>([]);
    const [redoHistory, setRedoHistory] = useState<AuditCorrections[][]>([]);

    //Check for cached audit and load it
    useEffect(() => {
        const loadCachedAudit = async (): Promise<void> => {
            setStatus('restoring')
            try {
                const cached = await server.getCachedAudit();

                if (cached) {
                    const data: AuditData = JSON.parse(cached);
                    setAuditData(data);
                    setStatus('ready');
                } else {
                    setStatus('idle');
                }
            } catch (error) {
                console.error("Cache recovery failed:", error);
                setStatus('idle');
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
            await server.saveAuditToCache(data);

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

        const histoyItem: AuditCorrections = correction;

        //update undo history
        setUndoHistory(prev => [...prev, [histoyItem]])
        setRedoHistory([]); //clear redo history since it is out of date

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

        const batch = [...auditData.corrections];

        await server.applyFixAll(batch);

        setUndoHistory((prev) => [...prev, batch]);
        setAuditData((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                corrections: []
            };
        });
    }, [auditData])


    //Ignore - Removes specific cell from corrections
    const ignoreCorrection = useCallback(async (cellAddress: string): Promise<void> => {
        const correction = auditData?.corrections.find(c => c.cellAddress === cellAddress);
        if (!correction) return;


        await server.removeCellHighlights([cellAddress]);

        setAuditData((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                corrections: prev.corrections.filter(
                    (c) => c.cellAddress !== cellAddress
                )
            };
        });

        //Add to undo history
        setUndoHistory(prev => [...prev, [correction]]);

        if (selectedCell === cellAddress) {
            setSelectedCell(null);
        }
    }, [selectedCell])

    const undo = useCallback(async (): Promise<void> => {
        if (undoHistory.length === 0) {
            throw new Error('Nothing to undo');
        }

        //Get the last item from history
        const lastBatch = undoHistory[undoHistory.length - 1];

        try {

            Promise.all(lastBatch.map(item =>
                server.applyUndo(item.cellAddress, item.originalValue)
            ));

            //Apply highlight
            await server.highlightCells(lastBatch);

            //Update local audit data to put item back
            setAuditData(prev => prev ? {
                ...prev,
                corrections: [...prev.corrections, ...lastBatch]
            } : null);

        } catch (error) {
            console.error("Undo failed:", error);
        }

        //Remove from undo history
        setUndoHistory(prev => prev.slice(0, -1));
        setRedoHistory(prev => [...prev, lastBatch]);

    }, [undoHistory]);

    const redo = useCallback(async (): Promise<void> => {
        if (redoHistory.length === 0) return;

        //Get last batch of changes from Redo
        const lastRedoBatch = redoHistory[redoHistory.length - 1];

        try {

            await Promise.all(lastRedoBatch.map(item =>
                server.applyFix(item.cellAddress, item.fixedValue)
            ));

            setUndoHistory(prev => [...prev, lastRedoBatch]);

            setRedoHistory(prev => prev.slice(0, -1));

            setAuditData(prev => {
                if (!prev) return null;
                const addressToRemove = lastRedoBatch.map(c => c.cellAddress);
                return {
                    ...prev,
                    corrections: prev.corrections.filter(c => !addressToRemove.includes(c.cellAddress))
                };
            });

        } catch (error) {
            console.error("Redo failed:", error);
        }
    }, [redoHistory]);

    const resetAudit = useCallback(async (): Promise<void> => {
        if (auditData?.corrections.length) {
            const addresses = auditData.corrections.map(c => c.cellAddress);

            await server.removeCellHighlights(addresses);
        }
        setStatus('idle');
        setAuditData(null);
        setUndoHistory([]);
        setRedoHistory([]);
        setSelectedCell(null);
        setSelectedCell(null);

        //Clear cache
        await server.saveAuditToCache(null);
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
        redo,
        canRedo: redoHistory.length > 0,
        canUndo: undoHistory.length > 0
    }
}
