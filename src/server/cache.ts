//Cache and Storage
const CACHE_KEY = 'LAST_AUDIT'


function saveAuditToCache(data: string): void {
    try {
        PropertiesService.getDocumentProperties().setProperty(CACHE_KEY, data);
    } catch (error) {
        console.error("Failed to save cache");
    }
}

function getCachedAudit(): string | null {
    try {
        return PropertiesService.getDocumentProperties().getProperty(CACHE_KEY);
    } catch (error) {
        console.log("Cached audit not found");
        return null;
    }
}