//Initialization and UI
function onOpen() {
    var ui = SpreadsheetApp.getUi();

    ui.createMenu('Audit')
        .addItem('Audit Sheet', 'openAuditSidebar')
        .addToUi();
}

function openAuditSidebar() {
    const html = HtmlService.createHtmlOutputFromFile('index')
        .setTitle("Transcript Audit")
        .setWidth(350);

    SpreadsheetApp.getUi().showSidebar(html);
}