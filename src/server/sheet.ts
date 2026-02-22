function getSheetContext(): SheetContext {
    const sheet = SpreadsheetApp.getActiveSheet();
    const range = sheet.getDataRange();
    const values = range.getValues();

    return {
        values: values,
        sheetName: sheet.getName(),
        id: SpreadsheetApp.getActiveSpreadsheet().getId()
    }
}



function selectCell(cellAddress: string): void {

    const sheet = SpreadsheetApp.getActiveSheet();
    const range = sheet.getRange(cellAddress)

    sheet.setActiveRange(range);
}

function applyFix(cellAddress: string, fixedValue: string): void {
    const sheet = SpreadsheetApp.getActiveSheet();
    const range = sheet.getRange(cellAddress);

    range.setValue(fixedValue);
    range.setBackground(null);
    range.clearNote();
}

function applyFixAll(corrections: AuditCorrections[]) {
    const sheet = SpreadsheetApp.getActiveSheet();

    corrections.forEach((correction) => {
        const range = sheet.getRange(correction.cellAddress);

        range.setValue(correction.fixedValue);
        range.setBackground(null);
        range.clearNote();
    })
}


function highlightCells(corrections: AuditCorrections[]): void {
    const sheet = SpreadsheetApp.getActiveSheet();

    corrections.forEach((correction) => {
        const range = sheet.getRange(correction.cellAddress);

        range.setBackground('#fce8e6')

        const note = `ISSUE ${correction.issue}\n\nFIX: ${correction.fixedValue}`
        range.setNote(note);
    })

}