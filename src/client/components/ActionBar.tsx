interface ActionBarProps {
    onFixAll: () => void;
    onUndo: () => void;
    onRedo: () => void
    canRedo: boolean
    canUndo: boolean
    issueCount: number;
}

export default function ActionBar({
    onFixAll: onApplyAll,
    onUndo,
    onRedo,
    canRedo,
    canUndo,
    issueCount
}: ActionBarProps) {

    return (
        <footer className="bg-white border-t border-gray-200 p-3 flex flex-col gap-2">
            {/* History Controls */}
            <div className="flex gap-2">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="flex-1 text-[11px] font-medium px-2 py-2 rounded
                            bg-gray-50 border border-gray-200 text-gray-900
                            hover:bg-gray-100 hover:border-gray-300 hover:shadow-sm
                              transform hover:-translate-y-[1px]
                              transition-all duration-150 ease-out
                              cursor-pointer
                              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                    Undo
                </button>
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="flex-1 text-[11px] font-medium px-2 py-2 rounded
                            bg-gray-50 border border-gray-200 text-gray-900
                            hover:bg-gray-100 hover:border-gray-300 hover:shadow-sm
                              transform hover:-translate-y-[1px]
                              transition-all duration-150 ease-out
                              cursor-pointer
                              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                    Redo
                </button>
            </div>

            {/* Apply All */}
            <button
                onClick={onApplyAll}
                disabled={issueCount === 0}
                className="w-full bg-gray-900 hover:bg-black text-white
                         text-[11px] font-semibold px-2 py-2.5 rounded
                         flex items-center justify-center gap-1.5
                         shadow-sm hover:shadow-lg
                         transform hover:-translate-y-[1px]
                         transition-all duration-200 ease-out
                         cursor-pointer
                         active:translate-y-0 active:shadow-md
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
                Resolve All ({issueCount})
            </button>
        </footer>
    );
};