import { useEffect, useState } from 'react'
import { server } from './utils/gas-bridge'
import { useToast } from './hooks/useToast'
import { useAudit } from './hooks/useAudit'
import Toast from './components/Toast'
import ActionBar from './components/ActionBar'
import IssueCard from './components/IssueCard'
import AuditReportIcon from './components/icons/AuditReportIcon'
import Loader from './components/Loader'

const App = () => {
    const [config, setConfig] = useState<EnvData | null>(null);

    useEffect(() => {
        server.getClientSideVars()
            .then((data) => setConfig(data))
            .catch((error) => console.log("Failed to load environment  variables:", error));
    }, []);

    if (!config) {
        return <Loader message='Initializing...' />
    }

    return <AuditManager config={config} />
}

const AuditManager = ({ config }: { config: EnvData }) => {
    const {
        status,
        auditData,
        selectedCell,
        startAudit,
        selectCell,
        fixCurrent,
        fixAll,
        ignoreCorrection,
        resetAudit,
        undo,
        canUndo
    } = useAudit({ apiEndpoint: config.API_BASE_URL, apiKey: config.API_KEY });

    const { toast, showToast } = useToast();



    const handleStartAudit = async (): Promise<void> => {
        try {
            await startAudit();
            showToast(`Audit Complete: ${auditData?.corrections.length ?? 0} issues found`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            showToast(`Error: ${message}`);
        }
    }


    const handleFixCurrent = async (): Promise<void> => {
        try {
            await fixCurrent();
            showToast(`Fixed cell ${selectedCell}`);
        } catch (error) {
            showToast('Failed to apply fix');
        }
    }

    const handleFixAll = async (): Promise<void> => {
        try {
            showToast('Applying all fixes...');
            await fixAll();
        } catch (error) {
            showToast('Failed to apply fixes');
        }
    }


    const handleUndo = async (): Promise<void> => {
        try {
            await undo()
            showToast('Undo changes')
        } catch (error) {
            showToast(String(error));
        }
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50 text-gray-800 overflow-hidden w-[300px]">
            {/* Header */}
            <header className="bg-white border-b px-4 py-3 flex justify-between items-center shrink-0">
                <h1 className="font-bold text-lg flex items-center gap-2">

                    <AuditReportIcon />
                    SheetScan
                </h1>

                <button
                    onClick={resetAudit}
                    className="text-gray-400 hover:text-gray-600"
                    title="Reset"
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                    </svg>
                </button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-4 pb-32">
                {/* Idle State */}
                {status === 'idle' && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                        <div className="bg-blue-50 p-6 rounded-full">
                            <svg
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#2563eb"
                                strokeWidth="1.5"
                            >
                                <rect width="18" height="18" x="3" y="3" rx="2" />
                                <path d="M3 9h18" />
                                <path d="M9 3v18" />
                            </svg>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold">Ready to Audit</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Analyze your transcript for inconsistencies.
                            </p>
                        </div>

                        <button
                            onClick={handleStartAudit}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg shadow-sm transition-all"
                        >
                            Audit Current Sheet
                        </button>
                    </div>
                )}

                {/* Auditing State */}
                {status === 'auditing' && (
                    <Loader message='Transcript analysis in progress...' />
                )}

                {/* Ready State - Show Issues */}
                {status === 'ready' && auditData && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Issues ({auditData.corrections.length})
                            </span>
                        </div>

                        {auditData.corrections.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 text-sm">
                                No issues found!
                            </div>
                        ) : (
                            auditData.corrections.map((issue, idx) => (
                                <IssueCard
                                    key={`${issue.cellAddress}-${idx}`}
                                    issue={issue}
                                    isSelected={selectedCell === issue.cellAddress}
                                    onClick={() => selectCell(issue.cellAddress)}
                                    onIgnore={() => ignoreCorrection(issue.cellAddress)}
                                />
                            ))
                        )}
                    </div>
                )}
            </main>

            {/* Action Bar - Only show when ready */}
            {status === 'ready' && (
                <ActionBar
                    selectedCell={selectedCell}
                    onFixCurrent={handleFixCurrent}
                    onFixAll={handleFixAll}
                    onUndo={handleUndo}
                    canUndo={canUndo}
                    hasIssues={(auditData?.corrections.length ?? 0) > 0}
                />
            )}

            {/* Toast Notification */}
            <Toast toast={toast} />
        </div>
    );
};


export default App
