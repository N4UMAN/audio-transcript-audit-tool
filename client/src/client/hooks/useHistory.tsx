import { useState, useCallback } from "react"

interface useHistoryProps {
    onRestoreToActiveList: (items: AuditCorrections[]) => void;
    onRemoveFromActiveList: (items: AuditCorrections[]) => void;

    syncToSheet: (action: HistoryAction, direction: 'undo' | 'redo') => Promise<void>;
}

const useHistory = ({
    onRestoreToActiveList,
    onRemoveFromActiveList,
    syncToSheet
}: useHistoryProps) => {

    const [past, setPast] = useState<HistoryAction[]>([]);
    const [future, setFuture] = useState<HistoryAction[]>([]);
    const [isHistoryBusy, setIsHistoryBusy] = useState(false);

    // ENTRY POINT: ALL NEW ACTIONS MUST ENTER HERE
    const record = useCallback((action: HistoryAction) => {
        setPast(prev => [...prev, action]);
        setFuture([]); //WIPE FUTURE (REDO STACK) TO PREVENT ISSUES
    }, []);

    //UNDO: Move from Past -> Future, Restore UI, sync with sheet
    const undo = useCallback(async () => {
        if (past.length === 0 || isHistoryBusy) return;

        setIsHistoryBusy(true);
        const actionToUndo = past[past.length - 1]; //Newest element in stack (LIFO)

        try {
            onRestoreToActiveList(actionToUndo.items);

            await syncToSheet(actionToUndo, 'undo');

            setPast(prev => prev.slice(0, -1));
            setFuture(prev => [...prev, actionToUndo]);

        } catch (error) {
            onRemoveFromActiveList(actionToUndo.items);
            console.error("Undo failed", error);
            throw error;
        } finally {
            setIsHistoryBusy(false);
        }
    }, [past, onRestoreToActiveList, syncToSheet, onRemoveFromActiveList]);

    //REDO: Move from FUTURE -> PAST. Reverse of Undo
    const redo = useCallback(async () => {
        if (future.length === 0 || isHistoryBusy) return;

        setIsHistoryBusy(true);
        const actionToRedo = future[future.length - 1];

        try {
            onRemoveFromActiveList(actionToRedo.items);

            await syncToSheet(actionToRedo, 'redo');

            setFuture(prev => prev.slice(0, -1));
            setPast(prev => [...prev, actionToRedo]);
        } catch (error) {
            onRestoreToActiveList(actionToRedo.items);
            console.error("Redo failed", error);
            throw error;
        } finally {
            setIsHistoryBusy(false);
        }
    }, [future, onRestoreToActiveList, syncToSheet, onRemoveFromActiveList]);

    //Clear history: used on refresh
    const clearHistory = useCallback(() => {
        setPast([]);
        setFuture([]);
    }, [])
    return {
        record,
        undo,
        redo,
        clearHistory,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
        isHistoryBusy
    }
}

export default useHistory
