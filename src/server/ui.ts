//Initialization and UI

// @ts-ignore
function onOpen() {
    var ui = SpreadsheetApp.getUi();

    ui.createMenu('Audit')
        .addItem('Audit Sheet', 'openAuditSidebar')
        .addToUi();
}

// @ts-ignore
function openAuditSidebar() {
    const html = HtmlService.createHtmlOutputFromFile('index')
        .setTitle("Transcript Audit")
        .setWidth(350);

    SpreadsheetApp.getUi().showSidebar(html);
}


/*
Cache invalidation, will add a more robust cache invalidation system later, 
currently it deletes all cached audit data on any manual edits to the sheet.
*/
//@ts-ignore
function installEditTrigger() {
    const sheet = SpreadsheetApp.getActive();
    ScriptApp.newTrigger('onEdit')
        .forSpreadsheet(sheet)
        .onEdit()
        .create();
}

//@ts-ignore
function onEdit(event: GoogleAppsScript.Events.SheetsOnEdit) {
    PropertiesService.getDocumentProperties().deleteProperty('LAST_AUDIT')
}