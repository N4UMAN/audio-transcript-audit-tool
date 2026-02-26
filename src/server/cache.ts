//Cache and Storage
const CACHE_KEY = 'LAST_AUDIT'

//@ts-ignore
function saveAuditToCache(dataObj: AuditData, version?: string): void {
    const cache = {
        data: dataObj,
        versionAtTimeOfAudit: version || getSheetVersion()
    };

    try {
        PropertiesService.getDocumentProperties().setProperty(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.error("Cache Save Error:", error);
    }
}
//@ts-ignore
function getCachedAudit(): string | null {
    try {
        return PropertiesService.getDocumentProperties().getProperty(CACHE_KEY);
    } catch (error) {
        console.log("Cached audit not found");
        return null;
    }
}

//@ts-ignore
function onEdit(event: GoogleAppsScript.Events.SheetsOnEdit) {
    incrementSheetVersion();
}

//@ts-ignore
function getSheetVersion() {
    return PropertiesService.getScriptProperties().getProperty('SHEET_VERSION') || "0";
}

//@ts-ignore
function incrementSheetVersion() {
    const props = PropertiesService.getScriptProperties();
    const next = (parseInt(props.getProperty('SHEET_VERSION') || "0") + 1).toString();

    props.setProperty('SHEET_VERSION', next);

    return next;
}
