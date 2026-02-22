import "@types/google-apps-script"

declare global {
    // const google: typeof google
    var google: any;

    type IssueType = 'inconsistency' | 'guideline' | 'punctuation' | 'spelling';

    type AuditStatus = 'idle' | 'auditing' | 'ready';


    interface SheetContext {
        values: any[][];
        sheetName: string;
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

    interface EnvData {
        API_BASE_URL: string;
        DEBUG_MODE: boolean;
        API_KEY: string,
        VERSION: string;
    }

    interface UndoHistoryItem {
        cellAddress: string,
        previousValue: string;
        newValue: string;
        timestamp: number;
    }

    interface ServerFunctions {
        getSheetContext(): Promise<SheetContext>,
        selectCell(cellAddress: string): Promise<void>;
        applyFix(cellAddress: string, fixedValue: string): Promise<void>;
        applyFixAll(corrections: AuditCorrections[]): Promise<void>;
        highlightCells(corrections: AuditCorrections[]): Promise<void>;
        getCachedAudit(): Promise<string | null>;
        saveAuditToCache(data: string): Promise<void>;
        getClientSideVars(): Promise<EnvData>
    }
}
