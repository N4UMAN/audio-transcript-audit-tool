
interface IssueCardProps {
    issue: AuditCorrections;
    isSelected: boolean;
    onClick: () => void;
    onFix: () => void;
    onIgnore: () => void;
}

function getPillColor(type: string): string {
    const colors: Record<string, string> = {
        locale_format: 'bg-slate-50 text-slate-700 border-slate-200',
        inconsistency: 'bg-amber-50 text-amber-800 border-amber-200',
        punctuation: 'bg-orange-50 text-orange-800 border-orange-200',
        spelling: 'bg-blue-50 text-blue-800 border-blue-200',
        guideline: 'bg-purple-50 text-purple-800 border-purple-200'
    };
    return colors[type?.toLowerCase()] || 'bg-gray-50 text-gray-700 border-gray-200';
};


export default function IssueCard({
    issue,
    isSelected,
    onClick,
    onFix,
    onIgnore
}: IssueCardProps) {
    return (
        <div
            onClick={onClick}
            className={`
    bg-white rounded-md border mb-2 shadow-sm transition-all duration-200
    ${isSelected
                    ? 'border-indigo-600 shadow-[0_0_0_1px_rgb(79,70,229)] cursor-default'
                    : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                }
  `}
        >
            {/* Card Summary - Always Visible */}
            <div className="p-2.5">
                <div className="flex justify-between items-center mb-1.5">
                    <span className={`
            text-[9px] font-semibold px-1.5 py-0.5 rounded border
            ${getPillColor(issue.issueType)}
          `}>
                        {issue.issueType.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500 bg-gray-50 px-1 py-0.5 rounded">
                        {issue.cellAddress}
                    </span>
                </div>

                <div className="text-xs font-medium text-gray-900 leading-tight">
                    {issue.issue}
                </div>

                {/* Hint - Only when collapsed */}
                {!isSelected && (
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-500">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                        Click to expand details
                    </div>
                )}
            </div>

            {/* Card Details - Only When Selected */}
            {isSelected && (
                <div className="px-2.5 pb-2.5 border-t border-gray-100 pt-2.5 bg-gray-50">
                    <div className="space-y-2 mb-3">
                        {/* Current Value */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-semibold uppercase text-gray-600">
                                Source Value
                            </span>
                            <div className="font-mono text-[11px] px-2 py-2 rounded border bg-rose-50 text-rose-900 border-rose-200 overflow-x-auto">
                                {issue.originalValue}
                            </div>
                        </div>

                        {/* Fixed Value */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-semibold uppercase text-gray-600">
                                Proposed Resolution
                            </span>
                            <div className="font-mono text-[11px] px-2 py-2 rounded border bg-emerald-50 text-emerald-900 border-emerald-200 overflow-x-auto">
                                {issue.fixedValue}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onFix();
                            }}
                            className="text-[11px] font-semibold px-2 py-2 rounded
                                    bg-indigo-600 text-white border border-indigo-600
                                    hover:bg-indigo-800 hover:border-indigo-800
                                      hover:shadow-md
                                      transform hover:-translate-y-[1px]
                                      transition-all duration-150 ease-out
                                      active:translate-y-0 active:shadow-none
                                      cursor-pointer"
                        >
                            Apply Fix
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onIgnore();
                            }}
                            className="text-[11px] font-medium px-2 py-2 rounded
                                    bg-white text-gray-600 border border-gray-200
                                    hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300
                                      hover:shadow-sm
                                      transform hover:-translate-y-[1px]
                                      transition-all duration-150 ease-out
                                      active:translate-y-0 active:shadow-none
                                      cursor-pointer"
                        >
                            Ignore
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


