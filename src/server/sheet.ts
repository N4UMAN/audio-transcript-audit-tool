// @ts-ignore
function getSheetContext(): string {
    try {
        const sheet = SpreadsheetApp.getActiveSheet();
        const range = sheet.getDataRange();
        const values = range.getValues();

        const payload: SheetContext = {
            values: values,
            sheetName: sheet.getName(),
            headers: values[0] || [],
            rowCount: range.getLastRow(),
            id: SpreadsheetApp.getActiveSpreadsheet().getId()
        }

        return JSON.stringify(payload);

    } catch (error: any) {
        return JSON.stringify({ error: error.toString() });
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
    });
    
    dataRange.setNotes(notes);

    const addresses = corrections.map(c => c.cellAddress);
    sheet.getRangeList(addresses).setBackground('#fce8e6');

    SpreadsheetApp.flush();
}

//@ts-ignore
function removeCellHighlights(cellAddresses: string[]): void {
    if (!cellAddresses || cellAddresses.length === 0) return;

    const sheet = SpreadsheetApp.getActiveSheet();

    const rangeList = sheet.getRangeList(cellAddresses);

    rangeList.setBackground(null);
    rangeList.clearNote();
}

//@ts-ignore
function applyHistoryAction(items: AuditCorrections[], actionType: string, direction: string) {
    if (!items || items.length === 0) return;

    const sheet = SpreadsheetApp.getActiveSheet();
    const dataRange = sheet.getDataRange();

    const addresses = items.map(item => item.cellAddress);
    const rangeList = sheet.getRangeList(addresses);

    //FIX CASE
    if (actionType === 'FIX') {
        const values = dataRange.getValues();

        items.forEach(item => {
            const { row, col } = a1ToIndex(item.cellAddress);
            if (values[row] && values[row][col] !== undefined) {
                // REDO moves forward to fixedValue. UNDO moves backward to originalValue.
                values[row][col] = (direction === 'redo') ? item.fixedValue : item.originalValue;
            }
        });

        dataRange.setValues(values);
    }

    //HANDLE FORMATTING AND NOTES
    if (direction === 'redo') {
        rangeList.setBackground(null);
        rangeList.clearNote();
    } else if (direction === 'undo') {
        const notes = dataRange.getNotes();

        items.forEach(item => {
            const { row, col } = a1ToIndex(item.cellAddress);
            if (notes[row] && notes[row][col] !== undefined) {
                notes[row][col] = `ISSUE ${item.issue}\n\nFIX: ${item.fixedValue}`;
            }
        });

        dataRange.setNotes(notes);
        rangeList.setBackground('#fce8e6')
    }

    SpreadsheetApp.flush();
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

//---------------------------------