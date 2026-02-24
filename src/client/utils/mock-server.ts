

// Mock implementation of server functions
export const mockServer: ServerFunctions = {
    async getSheetContext() {
        return {
            values: [
                ['Name', 'Email', 'Status'],
                ['Alice', 'alice@example.com', 'Active'],
                ['Bob', 'bob@example.com', 'Inactive']
            ],
            sheetName: 'Mock Sheet',
            id: 'mock-spreadsheet-id'
        };
    },

    async selectCell(cellAddress: string) {
        console.log('Mock: Selected cell', cellAddress);
    },

    async applyFix(cellAddress: string, fixedValue: string) {
        console.log('Mock: Applied fix', { cellAddress, fixedValue });
    },

    async applyFixAll(corrections: AuditCorrections[]) {
        console.log('Mock: Applied all fixes', corrections);
    },

    async highlightCells(corrections: AuditCorrections[]) {
        console.log('Mock: Highlighted cells', corrections);
    },

    async getCachedAudit() {
        // Return some mock audit data
        return JSON.stringify({
            corrections: [
                {
                    cellAddress: 'A2',
                    issue: 'Spelling error',
                    fixedValue: 'Alice',
                    issueType: 'spelling',
                    originalValue: 'Alise'
                }
            ]
        });
    },

    async saveAuditToCache(data: string) {
        console.log('Mock: Saved to cache', data);
    },

    async applyUndo(cellAddress: string, originalValue: string) {
        console.log('Mock: Undo Applied ', 'background: #fce8e6; color: #b91c1c; font-weight: bold;', {
            cellAddress,
            restoredValue: originalValue
        });
        return new Promise((resolve) => setTimeout(resolve, 400));
    },

    async removeCellHighlights(cellAddresses: string[]) {
        console.log('Mock: Highlights Removed ', 'background: #f3f4f6; color: #374151; font-weight: bold;', {
            clearedCells: cellAddresses
        });
        return new Promise((resolve) => setTimeout(resolve, 200));
    },
    async getClientSideVars() {
        return {
            API_BASE_URL: 'http://127.0.0.1:8000/audit',
            DEBUG_MODE: true,
            API_KEY: '',
            VERSION: '0.0.0'
        }
    }
};