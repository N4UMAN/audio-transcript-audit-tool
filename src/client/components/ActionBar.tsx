interface ActionBarProps {
    selectedCell: string | null;
    onFixCurrent: () => void;
    onFixAll: () => void;
    onUndo: () => void;
    canUndo: boolean
    hasIssues: boolean;
}

export default function ActionBar({
    selectedCell,
    onFixCurrent,
    onFixAll,
    onUndo,
    canUndo,
    hasIssues
}: ActionBarProps) {

    return (
        <div className="fixed bottom-0 left-0 w-[300px] bg-white border-t p-3 space-y-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <div className="flex gap-2">
                <button
                    onClick={onFixCurrent}
                    className="flex-[2] bg-blue-600 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedCell}
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                    >
                        <path d="M20 6 9 17 4 12" />
                    </svg>
                    {selectedCell ? `Fix ${selectedCell}` : 'Select an Issue'}
                </button>

                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="flex-1 bg-gray-100 text-gray-700 text-xs font-bold py-2.5 rounded-lg hover:bg-gray-200"
                >
                    Undo
                </button>
            </div>

            <button
                onClick={onFixAll}
                className="w-full bg-green-50 text-green-700 border border-green-200 text-[11px] font-bold py-2 rounded-lg hover:bg-green-100 uppercase tracking-tight disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!hasIssues}
            >
                Apply All Recommended Fixes
            </button>
        </div>
    );
};