import "@types/google-apps-script"

declare global {
    // const google: typeof google
    var google: any;

    type IssueType = 'inconsistency' | 'guideline' | 'punctuation' | 'spelling';

    type AuditStatus = 'idle' | 'restoring' | 'auditing' | 'resetting' | 'ready';
    type BtnStates = 'ready' | 'undo' | 'redo' | 'fixing'


    interface SheetContext {
        values: any[][];
        sheetName: string;
        headers: any;
        rowCount: number
        id: string;
    }

    interface AuditCorrections {
        cellAddress: string;
        issue: string;
        fixedValue: string;
        issueType: IssueType;
        originalValue: string;
    }

    interface AuditData {
        corrections: AuditCorrections[];
        sheetName: string;
        timestamp: string;
    }

    interface ToastData {
        show: boolean;
        message: string;
    }


    interface HistoryAction {
        id: string;
        type: 'FIX' | 'IGNORE';
        items: AuditCorrections[];
    }

    interface AuditCache {
        data: AuditData;
        versionAtTimeOfAudit: string
    }

    // interface ServerFunctions {
    //     getSheetContext(): Promise<string>;
    //     getSheetVersion(): Promise<string>;
    //     incrementSheetVersion(): Promise<string>
    //     selectCell(cellAddress: string): Promise<void>;
    //     applyFix(cellAddress: string, fixedValue: string): Promise<void>;
    //     applyFixAll(corrections: AuditCorrections[]): Promise<void>;
    //     highlightCells(corrections: AuditCorrections[]): Promise<void>;
    //     removeCellHighlights(cellAddresses: string[]): Promise<void>;
    //     getCachedAudit(): Promise<string | null>;
    //     saveAuditToCache(data: AuditData | null, version?: string): Promise<void>;
    //     applyUndo(cellAddress: string, originalValue: string): Promise<void>;
    //     applyHistoryAction(items: AuditCorrections[], actionType: string, direction: string): Promise<void>
    //     runSecureAudit(context: SheetContext): Promise<string>
    // }

    interface ServerFunctions {
        getSheetContext(): Promise<string>;
        selectCell(cellAddress: string): Promise<void>;
        runSecureAudit(context: SheetContext): Promise<string>;
        getCachedAudit(): Promise<string | null>;
        dispatchAction(items: AuditCorrections[], type: string, direction: 'undo' | 'redo'): Promise<{ success: boolean; newVersion: string }>;
        resetAudit(): Promise<void>;
    }
}
