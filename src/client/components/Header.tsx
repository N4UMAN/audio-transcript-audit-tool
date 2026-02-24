import AuditReportIcon from "./icons/AuditReportIcon";

interface HeaderProps {
    onRefresh: () => void;
}


export const Header = ({ onRefresh }: HeaderProps) => {
    return (
        <header className="bg-white h-12 px-3 flex items-center justify-between border-b border-gray-200">
            <div className="flex items-center gap-2 font-bold text-[13px] text-gray-900">
                <AuditReportIcon />
                SheetScan
            </div>

            <button
                onClick={onRefresh}
                className="p-1.5 rounded text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                title="Refresh Audit"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>
        </header>
    );
};