// @ts-ignore
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

//-----------SINGLE OPERATIONS-----------

// @ts-ignore
function selectCell(cellAddress: string): void {

    const sheet = SpreadsheetApp.getActiveSheet();
    const range = sheet.getRange(cellAddress)

    sheet.setActiveRange(range);
}

// @ts-ignore
function applyFix(cellAddress: string, fixedValue: string): void {
    const sheet = SpreadsheetApp.getActiveSheet();
    const range = sheet.getRange(cellAddress);

    range.setValue(fixedValue);
    range.setBackground(null);
    range.clearNote();
    SpreadsheetApp.flush();
}

// @ts-ignore
function applyUndo(cellAddress: string, originalValue: string): void {
    const sheet = SpreadsheetApp.getActiveSheet();
    const range = sheet.getRange(cellAddress);

    range.setValue(originalValue);
    SpreadsheetApp.flush();
}

// -----------BULK OPERATIONS----------- 

// @ts-ignore
function applyFixAll(corrections: AuditCorrections[]) {
    if (!corrections || corrections.length === 0) return;


    const sheet = SpreadsheetApp.getActiveSheet();
    const dataRange = sheet.getDataRange();

    const values = dataRange.getValue();

    corrections.forEach((correction) => {
        const { row, col } = a1ToIndex(correction.cellAddress);

        //Batch all edits into single array for single API call to lower latency
        if (values[row] !== undefined && values[row][col] !== undefined) {
            values[row][col] = correction.fixedValue;
        }

        dataRange.setValues(values);

        const addresses = corrections.map(c => c.cellAddress);
        const rangeList = sheet.getRangeList(addresses);

        rangeList.setBackground(null);
        rangeList.clearNote();

        SpreadsheetApp.flush();
    })
}

// @ts-ignore
function highlightCells(corrections: AuditCorrections[]): void {

    if (!corrections || corrections.length === 0) return;

    const sheet = SpreadsheetApp.getActiveSheet();
    const dataRange = sheet.getDataRange();

    const notes = dataRange.getNotes();


    corrections.forEach((correction) => {
        const { row, col } = a1ToIndex(correction.cellAddress);

        if (notes[row] !== undefined && notes[row][col] !== undefined) {
            notes[row][col] = `ISSUE ${correction.issue}\n\nFIX: ${correction.fixedValue}`;
        }

        dataRange.setNotes(notes);

        const addresses = corrections.map(c => c.cellAddress);
        sheet.getRangeList(addresses).setBackground('#fce8e6');

        SpreadsheetApp.flush();
    })
}

//@ts-ignore
function removeCellHighlights(cellAddresses: string[]): void {
    if (!cellAddresses || cellAddresses.length === 0) return;

    const sheet = SpreadsheetApp.getActiveSheet();

    const rangeList = sheet.getRangeList(cellAddresses);

    rangeList.setBackground(null);
    rangeList.clearNote();
}



//-----------UTILITIES-----------

function a1ToIndex(a1: string) {
    const match = a1.match(/([A-Z]+)(\d+)/);

    if (!match) return { row: 0, col: 0 };

    const colStr = match[1];
    const row = parseInt(match[2], 10) - 1;

    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
        col = col * 26 + colStr.charCodeAt(i) - 64;
    }
    return { row, col: col - 1 };
}

//-----------------------------------------------------------------------------