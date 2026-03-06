/* eslint-disable */
// @ts-nocheck
declare const highlightCells: any;
declare const incrementSheetVersion: any;
declare const saveAuditToCache: any;

// ─── getSheetContext ───────────────────────────────────────────────────────────
function getSheetContext() {
    try {
        const sheet = SpreadsheetApp.getActiveSheet();
        const range = sheet.getDataRange();
        const values = range.getValues();

        const payload = {
            values: values,
            sheetName: sheet.getName(),
            headers: values[0] || [],
            rowCount: range.getLastRow(),
            id: SpreadsheetApp.getActiveSpreadsheet().getId()
        };

        return JSON.stringify(payload);
    } catch (error) {
        return JSON.stringify({ error: (error as Error).toString() });
    }
}
// ──────────────────────────────────────────────────────────────────────────────


// ─── dispatchAction ───────────────────────────────────────────────────────────
// Called by: React's useHistory syncToSheet, fixCurrent, fixAll, handleIgnore
// @ts-ignore
function dispatchAction(
    item: AuditCorrections[],
    type: string,
    direction: 'undo' | 'redo'
): { success: boolean, newVersion: string } {
    const lock = LockService.getScriptLock();

    try {
        // lock for 30 seconds
        lock.waitLock(30000)

        Services.Sheet.applyHistoryAction(item, type, direction);

        const newVersion = Services.Cache.incrementSheetVersion();

        //updateCachedAuditVersion: fetch cache, bump version 👆, re-save
        const cached = Services.Cache.getCachedAudit();

        if (cached) {
            const parsed = JSON.parse(cached) as AuditCache;
            parsed.versionAtTimeOfAudit = newVersion;
            Services.Cache.saveAuditToCache(parsed.data, newVersion);
        }

        return { success: true, newVersion };
    } catch (error) {
        console.error("dispatchAction failed:", error);
        throw new Error(`Transaction failed: ${(error as Error).message}`);
    } finally {
        lock.releaseLock();
    }
}
// ──────────────────────────────────────────────────────────────────────────────

// ─── runSecureAudit ───────────────────────────────────────────────────────────
// Called by: React's startAudit
// @ts-ignore
function runSecureAudit(context: SheetContext): string {
    const REQUIRED_HEADERS = [
        "segment", "speaker", "start time", "end time", "transcript",
        "non-speech events", "emotions", "language", "locale", "accent"
    ];
    const MIN_DATA_ROWS = 2;

    const sheetHeaders = (context.headers as any[]).map((h: any) => String(h).toLowerCase().trim());
    const missingHeaders = REQUIRED_HEADERS.filter(req => !sheetHeaders.includes(req));

    if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    if (context.values.length - 1 < MIN_DATA_ROWS) {
        throw new Error(`Sheet needs at least ${MIN_DATA_ROWS} row(s) of data below the header.`);
    }

    //API call
    const props = PropertiesService.getScriptProperties().getProperties();
    if (!props['API_BASE_URL'] || !props['API_KEY']) {
        throw new Error("Missing properties in Script Properties.");
    }

    const response = UrlFetchApp.fetch(`${props['API_BASE_URL']}/audit`, {
        method: 'post',
        contentType: 'application/json',
        headers: { 'X-API-KEY': props['API_KEY'] },
        payload: JSON.stringify(context),
    });

    const data: AuditData = JSON.parse(response.getContentText());

    //Highlight + cache
    if (data.corrections && data.corrections.length > 0) {
        Services.Sheet.highlightCells(data.corrections);
        const version = Services.Cache.incrementSheetVersion();
        Services.Cache.saveAuditToCache(data, version);
    }

    return response.getContentText();
}
// ──────────────────────────────────────────────────────────────────────────────



// ─── getCachedAudit ───────────────────────────────────────────────────────────
// Returns null if stale — React treats null as "no valid cache".
// @ts-ignore
function getCachedAudit(): string | null {
    try {
        const cached = Services.Cache.getCachedAudit();
        if (!cached) return null;

        const parsed: AuditCache = JSON.parse(cached);
        const cloudVersion = Services.Cache.getSheetVersion();

        if (parsed.versionAtTimeOfAudit !== cloudVersion) {
            console.warn("Stale cache detected, returning null.");
            return null;
        }

        return JSON.stringify(parsed.data);
    } catch (error) {
        return null;
    }
}
// ──────────────────────────────────────────────────────────────────────────────


// ─── resetAudit ───────────────────────────────────────────────────────────────
// @ts-ignore
function resetAudit(): void {
    // Grab current corrections from cache to know which cells to un-highlight
    const cached = Services.Cache.getCachedAudit();

    if (cached) {
        try {
            const parsed: AuditCache = JSON.parse(cached);
            const addresses = parsed.data.corrections.map((c: AuditCorrections) => c.cellAddress);

            if (addresses.length > 0) {
                Services.Sheet.removeCellHighlights(addresses);
            }
        } catch {

        }
        Services.Cache.saveAuditToCache(null);
    }
}
// ──────────────────────────────────────────────────────────────────────────────
