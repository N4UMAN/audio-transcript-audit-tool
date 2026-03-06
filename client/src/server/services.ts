//@ts-ignore
const Services = {
    Sheet: {
        selectCell: function (cellAddress: string) {
            const sheet = SpreadsheetApp.getActiveSheet();
            const range = sheet.getRange(cellAddress);

            sheet.setActiveRange(range);
        },

        highlightCells: function (corrections: AuditCorrections[]) {
            if (!corrections || corrections.length === 0) return;
            const sheet = SpreadsheetApp.getActiveSheet();

            const dataRange = sheet.getDataRange();
            const notes = dataRange.getNotes();

            corrections.forEach((correction) => {
                const { row, col } = this.a1ToIndex(correction.cellAddress);

                if (notes[row] !== undefined && notes[row][col] !== undefined) {
                    notes[row][col] = `ISSUE ${correction.issue}\n\nFIX: ${correction.fixedValue}`;
                }
            });

            dataRange.setNotes(notes);
            const addresses = corrections.map(c => c.cellAddress);
            sheet.getRangeList(addresses).setBackground('#fce8e6');
            SpreadsheetApp.flush();
        },

        removeCellHighlights: function (cellAddresses: string[]) {
            if (!cellAddresses || cellAddresses.length === 0) return;

            const sheet = SpreadsheetApp.getActiveSheet();
            const rangeList = sheet.getRangeList(cellAddresses);

            rangeList.setBackground(null);
            rangeList.clearNote();
        },

        applyHistoryAction: function (items: AuditCorrections[], actionType: string, direction: string) {
            if (!items || items.length === 0) return;
            const sheet = SpreadsheetApp.getActiveSheet();
            const dataRange = sheet.getDataRange();

            const addresses = items.map(item => item.cellAddress);
            const rangeList = sheet.getRangeList(addresses);

            if (actionType === 'FIX') {
                const values = dataRange.getValues();
                items.forEach(item => {

                    const { row, col } = this.a1ToIndex(item.cellAddress);

                    if (values[row] && values[row][col] !== undefined) {
                        values[row][col] = (direction === 'redo') ? item.fixedValue : item.originalValue;
                    }

                });
                dataRange.setValues(values);
            }

            if (direction === 'redo') {

                rangeList.setBackground(null);
                rangeList.clearNote();

            } else if (direction === 'undo') {
                const notes = dataRange.getNotes();
                items.forEach(item => {
                    const { row, col } = this.a1ToIndex(item.cellAddress);
                    if (notes[row] && notes[row][col] !== undefined) {
                        notes[row][col] = `ISSUE ${item.issue}\n\nFIX: ${item.fixedValue}`;
                    }
                });
                dataRange.setNotes(notes);
                rangeList.setBackground('#fce8e6');
            }
            SpreadsheetApp.flush();
        },

        a1ToIndex: function (a1: string) {
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
    },


    Cache: {
        INTERNAL_SHEET_NAME: '_AUDIT_INTERNAL_',

        getInternalSheet: function () {
            const ss = SpreadsheetApp.getActiveSpreadsheet();
            let sheet = ss.getSheetByName(this.INTERNAL_SHEET_NAME);
            if (!sheet) {
                sheet = ss.insertSheet(this.INTERNAL_SHEET_NAME);
                sheet.hideSheet();
                const warningRange = sheet.getRange("A1:B1");
                warningRange.merge();
                warningRange.setValue("⚠️ WARNING: INTERNAL AUDIT SYSTEM DATA - DO NOT MODIFY OR DELETE ⚠️");
                warningRange.setBackground("#990000").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
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
        },

        getSheetVersion: function () {
            try {
                const sheet = this.getInternalSheet();
                const version = sheet.getRange('B2').getValue();
                return (version !== "" && version !== null) ? version.toString() : "0";
            } catch (e) {
                return "0";
            }
        },

        incrementSheetVersion: function () {
            const sheet = this.getInternalSheet();
            const range = sheet.getRange('B2');
            const next = (parseInt(range.getValue() || 0) + 1);
            range.setValue(next);
            SpreadsheetApp.flush();
            return next.toString();
        },

        saveAuditToCache: function (dataObj: AuditData | null, version?: string) {
            const sheet = this.getInternalSheet();
            const cacheRange = sheet.getRange('B3');
            if (!dataObj) {
                cacheRange.clearContent();
                return;
            }
            const cachePayload = {
                data: dataObj,
                versionAtTimeOfAudit: version || this.getSheetVersion()
            };
            try {
                cacheRange.setNumberFormat('@');
                cacheRange.setValue(JSON.stringify(cachePayload));
                SpreadsheetApp.flush();
            } catch (error) {
                console.error("Cache Save Error:", error);
            }
        },

        getCachedAudit: function () {
            try {
                const sheet = this.getInternalSheet();
                const cell = sheet.getRange('B3');
                let cached = cell.getValue();
                return (cached && cached !== "") ? cached.toString() : null;
            } catch (error) {
                return null;
            }
        },

        // Helper to sync version inside JSON string
        updateCachedAuditVersion: function (newVersion: string) {
            const cached = this.getCachedAudit();
            if (cached) {
                const parsed = JSON.parse(cached);
                parsed.versionAtTimeOfAudit = newVersion;
                this.saveAuditToCache(parsed.data, newVersion);
            }
        }
    }
};