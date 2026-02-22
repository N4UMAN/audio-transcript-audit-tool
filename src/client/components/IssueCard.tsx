
interface IssueCardProps {
    issue: AuditCorrections;
    isSelected: boolean;
    onClick: () => void;
}

function getPillColor(type: string): string {
    const colors: Record<string, string> = {
        inconsistency: 'bg-yellow-100 text-yellow-700',
        guideline: 'bg-red-100 text-red-700',
        punctuation: 'bg-orange-100 text-orange-700',
        spelling: 'bg-blue-100 text-blue-700'
    };

    return colors[type.toLowerCase()] || 'bg-gray-100 text-gray-700';
}


export default function IssueCard({
    issue,
    isSelected,
    onClick
}: IssueCardProps) {
    return (
        <div
            onClick={onClick}
            className={`
        border-l-4 bg-white p-3 rounded-r-lg border shadow-sm 
        cursor-pointer transition-all
        ${isSelected
                    ? 'border-red-600 bg-red-50 translate-x-1'
                    : 'border-red-400 border-y-gray-200 border-r-gray-200'
                }
      `}
        >
            {/* Header: Type badge and cell address */}
            <div className="flex justify-between items-start mb-1">
                <span
                    className={`
            text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
            ${getPillColor(issue.issueType)}
          `}
                >
                    {issue.issueType || 'Issue'}
                </span>
                <span className="text-[10px] font-mono font-bold text-gray-400">
                    {issue.cellAddress}
                </span>
            </div>

            {/* Issue description */}
            <p className="text-sm font-semibold leading-tight">
                {issue.issue}
            </p>

            {/* Original value */}
            <p className="text-xs text-gray-500 mt-1 line-clamp-1 italic">
                "{issue.originalValue}"
            </p>

            {/* Fix suggestion */}
            <div className="mt-2 bg-blue-50 p-2 rounded text-[11px] text-blue-800 border border-blue-100">
                <strong>Fix:</strong> {issue.fixedValue}
            </div>
        </div>
    );
};


