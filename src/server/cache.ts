//Cache and Storage
const CACHE_KEY = 'LAST_AUDIT'

// @ts-ignore
function saveAuditToCache(dataObj): void {
    try {
        PropertiesService.getDocumentProperties().setProperty(CACHE_KEY, JSON.stringify(dataObj));
    } catch (error) {
        console.error("Cache Save Error:", error);
    }
}

// @ts-ignore
function getCachedAudit(): string | null {
    try {
        return PropertiesService.getDocumentProperties().getProperty(CACHE_KEY);
    } catch (error) {
        console.log("Cached audit not found");
        return null;
    }
}