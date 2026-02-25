import { useEffect, useState } from 'react'
import { server } from './utils/gas-bridge'
import { useToast } from './hooks/useToast'
import { useAudit } from './hooks/useAudit'
import Toast from './components/Toast'
import ActionBar from './components/ActionBar'
import IssueCard from './components/IssueCard'
import { Header } from './components/Header'
import Loader from './components/Loader'
import FileCheckIcon from './components/icons/FileCheckIcon'
const App = () => {
    const [config, setConfig] = useState<EnvData | null>(null);

    useEffect(() => {
        server.getClientSideVars()
            .then((data) => setConfig(data))
            .catch((error) => console.log("Failed to load environment variables:", error));
    }, []);

    if (!config) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <Loader message='Initializing...' />
            </div>
        )
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
        redo,
        canRedo,
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
            showToast('All issues resolved!');
        } catch (error) {
            showToast(`Failed to apply fixes`);
        }
    }

    const handleUndo = async (): Promise<void> => {
        try {
            await undo()
            showToast('Undo applied')
        } catch (error) {
            showToast(String(error));
        }
    }

    const handleRedo = async (): Promise<void> => {
        try {
            await redo()
            showToast('Redo applied')
        } catch (error) {
            showToast(String(error));
        }
    }

    if (status === 'restoring') {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <Loader message='Just a moment...' />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden w-[300px]">
            {/* Header */}
            <Header onRefresh={resetAudit} />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-3">
                {/* Idle State - Final Monotone Utility */}
                {status === 'idle' && (
                    <div className="relative flex flex-col h-full bg-white overflow-hidden border border-gray-100">

                        {/* Monotone Structural Accents */}
                        <div className="absolute top-[-5%] right-[-5%] w-40 h-40 rounded-full border border-gray-50 animate-[spin_60s_linear_infinite]" />
                        <div className="absolute top-[12%] left-[-15px] w-12 h-12 bg-gray-900 rotate-12 opacity-[0.05]" />
                        <div className="absolute bottom-[25%] right-[-10px] w-16 h-16 border-2 border-gray-100 rotate-45" />

                        <div className="relative z-10 flex flex-col h-full p-6">

                            {/* 1. Status Header */}
                            <header className="mb-14">
                                <div className="flex items-center gap-2 mb-2">
                                    {/* <div className="w-1 h-3 bg-gray-900" /> */}
                                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-[0.3em]">
                                        System // Ready
                                    </span>
                                </div>
                                <h1 className="text-3xl font-black text-gray-900 leading-[0.85] tracking-tighter uppercase flex flex-col">
                                    <span>Sheet</span>
                                    <span className="flex items-center gap-2">
                                        <FileCheckIcon className="w-8 h-8 text-gray-500" strokeWidth="2.5" />
                                        Scan
                                    </span>
                                </h1>
                            </header>

                            {/* 2. Functional Description */}
                            <div className="flex-1 border-l border-gray-100 pl-5 ml-1">
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Process</p>
                                        <p className="text-sm text-gray-500 leading-relaxed font-medium">
                                            Automatically parses the active Google Sheet to identify structural inconsistencies, formatting anomalies, and empty data nodes.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-900 font-mono text-xs font-bold">//</span>
                                            <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Execution</p>
                                        </div>
                                        <p className="text-xs text-gray-400 leading-snug">
                                            Click start to begin the global diagnostic. Issues will be compiled into a fixable queue.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Rounded Bottom Button */}
                            <div className="mt-auto">
                                <button
                                    onClick={handleStartAudit}
                                    className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-full font-bold text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.97] flex items-center justify-center gap-3 shadow-2xl shadow-gray-200"
                                >
                                    Start Audit
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Technical Grid Overlay */}
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                            style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                    </div>
                )}

                {/* Auditing State */}
                {status === 'auditing' && (
                    <div className="flex items-center justify-center h-full">
                        <Loader message='Transcript analysis in progress...' />
                    </div>
                )}

                {/* Ready State - Show Issues */}
                {status === 'ready' && auditData && (
                    <div className="space-y-0 pb-40">
                        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5 px-0.5">
                            Audit Queue ({auditData.corrections.length} {auditData.corrections.length === 1 ? 'Issue' : 'Issues'})
                        </div>

                        {auditData.corrections.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-sm text-gray-400 font-medium">No issues found</p>
                            </div>
                        ) : (
                            auditData.corrections.map((issue, idx) => (
                                <IssueCard
                                    key={`${issue.cellAddress}-${idx}`}
                                    issue={issue}
                                    isSelected={selectedCell === issue.cellAddress}
                                    onFix={handleFixCurrent}
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
                    onFixAll={handleFixAll}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    issueCount={auditData?.corrections.length || 0}
                />
            )}

            {/* Toast Notification */}
            <Toast toast={toast} />
        </div>
    );
};

export default App