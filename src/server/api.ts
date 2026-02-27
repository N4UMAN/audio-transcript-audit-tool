
//@ts-ignore
function runSecureAudit(context: SheetContext) {
    const props = PropertiesService.getScriptProperties().getProperties();

    if (!props.API_BASE_URL || !props.API_KEY) {
        throw new Error("Missing properties in Script Properties.");
    }

    const url = `${props.API_BASE_URL}/audit`;

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        "method": "post",
        "contentType": "application/json",
        "headers": {
            "X-API-KEY": props.API_KEY,
        },
        "payload": JSON.stringify(context),
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
        throw new Error(`Backend Error (${responseCode}): ${response.getContentText()}`);
    }

    return response.getContentText();
}