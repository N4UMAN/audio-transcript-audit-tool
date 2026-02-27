
const INTERNAL_SHEET_NAME = '_AUDIT_INTERNAL_';

function getInternalSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(INTERNAL_SHEET_NAME);
    if (!sheet) {
        sheet = ss.insertSheet(INTERNAL_SHEET_NAME);
        sheet.hideSheet();


        const warningRange = sheet.getRange("A1:B1");
        warningRange.merge();
        warningRange.setValue("⚠️ WARNING: INTERNAL AUDIT SYSTEM DATA - DO NOT MODIFY OR DELETE ⚠️");
        warningRange.setBackground("#990000");
        warningRange.setFontColor("#ffffff");
        warningRange.setFontWeight("bold");
        warningRange.setHorizontalAlignment("center");


        sheet.getRange("A2").setValue("SHEET_VERSION:");
        sheet.getRange("A3").setValue("AUDIT_CACHE:");
        sheet.getRange("A2:A3").setFontWeight("bold").setBackground("#f3f3f3");


        sheet.getRange("B2").setValue(0);

        sheet.setColumnWidth(1, 150);
        sheet.setColumnWidth(2, 600);
        sheet.setFrozenRows(1);

        const protection = sheet.protect().setDescription('Protect SheetScan Internal Storage Data');
        protection.setWarningOnly(true);
    }
    return sheet;
}

//@ts-ignore
function getSheetVersion(): string {
    try {
        const sheet = getInternalSheet();
        const version = sheet.getRange('B2').getValue();

        return (version !== "" && version !== null) ? version.toString() : "0";
    } catch (e) {
        return "0";
    }
}

//@ts-ignore
function incrementSheetVersion(): string {
    const sheet = getInternalSheet();
    const range = sheet.getRange('B2');

    const next = (parseInt(range.getValue() || 0) + 1);

    range.setValue(next);

    SpreadsheetApp.flush();
    return next.toString();
}

//@ts-ignore
function saveAuditToCache(dataObj: AuditData | null, version?: string): void {
    const sheet = getInternalSheet();
    const cacheRange = sheet.getRange('B3');

    if (!dataObj) {
        cacheRange.clearContent();
        return;
    }

    const cachePayload: AuditCache = {
        data: dataObj,
        versionAtTimeOfAudit: version || getSheetVersion()
    };

    try {
        cacheRange.setNumberFormat('@');

        cacheRange.setValue(JSON.stringify(cachePayload));
        SpreadsheetApp.flush();
    } catch (error) {
        console.error("Cache Save Error:", error);
    }
}

//@ts-ignore
function getCachedAudit(): string | null {
    try {
        const sheet = getInternalSheet();
        const cell = sheet.getRange('B3');

        let cached = cell.getValue();

        if (!cached || cached === "") {
            return null;
        }

        return cached ? cached.toString() : null;
    } catch (error) {
        return null;
    }
}

//@ts-ignore
function onEdit(event: GoogleAppsScript.Events.SheetsOnEdit) {
    if (event.range.getSheet().getName() !== INTERNAL_SHEET_NAME) {
        incrementSheetVersion();
    }
}