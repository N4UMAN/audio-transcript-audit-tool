
import { mockServer } from "./mock-server";

// interface ServerFunctions {
//     getSheetContext(): Promise<SheetContext>,
//     selectCell(cellAddress: string): Promise<void>;
//     applyFix(cellAddress: string, fixedValue: string): Promise<void>;
//     applyFixAll(corrections: AuditCorrections[]): Promise<void>;
//     highlightCells(corrections: AuditCorrections[]): Promise<void>;
//     getCachedAudit(): Promise<string | null>;
//     saveAuditToCache(data: string): Promise<void>;
//     getClientSideVars(): Promise<EnvData>
// }

const isGASEnvironment = typeof google !== 'undefined' && google?.script?.run;

const realServer = isGASEnvironment ? new Proxy({} as ServerFunctions, {
    get(_, prop: string) {
        return (...args: unknown[]) => {
            return new Promise((resolve, reject) => {
                google.script.run
                    .withSuccessHandler(resolve)
                    .withFailureHandler(reject)
                [prop](...args);
            });
        };
    },
}) : null;

export const server = (realServer || mockServer) as ServerFunctions;