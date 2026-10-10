"use client";

import { useState, useEffect } from "react";
import {
    Bug,
    X,
    ChevronRight,
    Database,
    Cpu,
    BrainCircuit,
    Network,
    Terminal,
    Activity,
    Zap,
    RefreshCw,
    Search,
    Code2,
    Share2,
    Trash2,
    ShieldCheck,
    ShieldAlert,
    RotateCcw,
    FileJson,
    Layers,
    Sparkles,
    PenTool,
    CheckCircle2,
    Save,
    MessageSquare,
    ArrowRight,
    Globe,
    HardDrive
} from "lucide-react";

type AgentStatus = "idle" | "running" | "completed" | "error";

interface OrchestrationStep {
    id: number;
    name: string;
    agent: string;
    status: AgentStatus;
    description: string;
    timestamp?: string;
    output?: string;
}

export function AIDebugPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [isDevMode, setIsDevMode] = useState(false);
    const [activeTab, setActiveTab] = useState<"orchestration" | "state" | "validation" | "context" | "memories">("orchestration");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const orchestrationSteps: OrchestrationStep[] = [
        { id: 1, name: "Load State Snapshot", agent: "System", status: "completed", description: "Serializing external state container for agent delivery.", timestamp: "21:18:50" },
        { id: 2, name: "Retrieve Memory", agent: "VectorStore", status: "completed", description: "Stateless retrieval based on snapshot keys.", timestamp: "21:18:51" },
        { id: 3, name: "Planner Agent", agent: "Stateless-Planner", status: "completed", description: "Generating plan using input snapshot (No internal state).", timestamp: "21:18:52" },
        { id: 4, name: "Writer Agent", agent: "Stateless-Writer", status: "running", description: "Streaming structured output response...", output: "Implementing Stateless Architecture UI..." },
        { id: 5, name: "Critic Agent", agent: "Stateless-Critic", status: "idle", description: "Validating output against external constraints." },
        { id: 6, name: "Summarizer Agent", agent: "Stateless-Summarizer", status: "idle", description: "Creating state update blob." },
        { id: 7, name: "Persist State + Embeddings", agent: "External-Store", status: "idle", description: "Writing results to external state container." }
    ];

    // External State Representation
    const externalState = {
        sessionId: "sess_x92817_alpha",
        globalVersion: "1.2.9",
        agentExecution: "isolated",
        sharedMemory: {
            activeTokens: 1024,
            lastInteraction: "21:18:45",
            contextKeys: ["stateless", "external_state", "orchestration"]
        },
        uiState: {
            activeComponent: "AIDebugPanel",
            visibleTabs: ["flow", "state", "schema"],
            isDevMode: isDevMode
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 800);
    };


    return (
        <div className={`fixed inset-y-0 right-0 z-[100] w-full border-l border-white/5 bg-[#050816]/90 backdrop-blur-2xl transition-all duration-500 ease-in-out sm:w-[500px] shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex h-full flex-col relative overflow-hidden">

                {/* Animated Background Glow */}
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-[100px]" />
                <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-500/10 blur-[100px]" />

                {/* Header */}
                <div className="relative flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-400 border border-emerald-500/20">
                            <BrainCircuit className="h-5 w-5 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white tracking-tight uppercase italic">Stateless AI Hub</h2>
                            <div className="flex items-center gap-2">
                                <Globe className="h-3 w-3 text-emerald-500" />
                                <p className="text-[10px] text-emerald-500/70 uppercase tracking-widest font-bold">External State Active</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            className={`rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-all ${isRefreshing ? 'rotate-180' : ''}`}
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'text-emerald-400' : ''}`} />
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Architecture Banner */}
                <div className="px-5 pt-4 pb-2">
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 border border-emerald-500/20">
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Stateless Protocol Enforced</span>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-white/10 bg-black/40 px-3 overflow-x-auto no-scrollbar">
                    {[
                        { id: "orchestration", icon: Layers, label: "Flow" },
                        { id: "state", icon: HardDrive, label: "State" },
                        { id: "validation", icon: ShieldCheck, label: "Schema" },
                        { id: "context", icon: Code2, label: "Ctx" },
                        { id: "memories", icon: Database, label: "Mem" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`relative flex min-w-[70px] flex-1 flex-col items-center gap-1.5 py-4 text-[10px] font-bold uppercase tracking-tighter transition-all ${activeTab === tab.id
                                    ? "text-emerald-400"
                                    : "text-slate-500 hover:text-slate-300"
                                }`}
                        >
                            <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? "text-emerald-400" : ""}`} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 h-1 w-full bg-emerald-500 rounded-t-full shadow-[0_-4px_10px_rgba(16,185,129,0.5)]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-black/10">

                    {activeTab === "orchestration" && (
                        <div className="space-y-4 animate-in fade-in duration-500">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-emerald-500" />
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Orchestration Chain</h3>
                                </div>
                            </div>

                            <div className="relative space-y-4 before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-white/5">
                                {orchestrationSteps.map((step, idx) => {
                                    const Icon = idx === 0 ? Save : idx === 1 ? Database : idx === 2 ? Sparkles : idx === 3 ? PenTool : idx === 4 ? MessageSquare : idx === 5 ? CheckCircle2 : ArrowRight;

                                    return (
                                        <div key={step.id} className="relative pl-10 group">
                                            <div className={`absolute left-0 p-2.5 rounded-full border transition-all duration-300 z-10 ${step.status === 'completed' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' :
                                                    step.status === 'running' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]' :
                                                        'bg-slate-900 border-white/10 text-slate-600'
                                                }`}>
                                                <Icon className={`h-4 w-4 ${step.status === 'running' ? 'animate-pulse' : ''}`} />
                                            </div>

                                            <div className={`rounded-2xl border p-4 transition-all duration-300 ${step.status === 'completed' ? 'bg-white/[0.04] border-white/5 opacity-80' :
                                                    step.status === 'running' ? 'bg-amber-500/5 border-amber-500/20 shadow-[0_4px_20px_-10px_rgba(245,158,11,0.2)]' :
                                                        'bg-transparent border-white/[0.03] opacity-40'
                                                }`}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-[11px] font-black uppercase tracking-wider ${step.status === 'running' ? 'text-amber-400' : 'text-slate-200'
                                                        }`}>{step.name}</span>
                                                    {step.timestamp && <span className="text-[9px] font-mono text-slate-600">{step.timestamp}</span>}
                                                </div>
                                                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{step.description}</p>

                                                <div className="mt-2 flex items-center justify-between">
                                                    <span className="text-[9px] font-bold text-slate-600 uppercase bg-black/30 px-2 py-0.5 rounded">AGENT: {step.agent}</span>
                                                    {step.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === "state" && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <HardDrive className="h-4 w-4 text-emerald-500" />
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">External State Snapshot</h3>
                                </div>
                                <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 border border-blue-500/20">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Isolated Environment</span>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-[#030612] p-5 text-[11px] font-mono leading-relaxed border border-white/10 shadow-inner overflow-hidden relative group">
                                <div className="absolute top-4 right-4 text-[9px] font-bold text-slate-700 select-none">READ_ONLY_VIEW</div>
                                <code className="text-emerald-400/90 whitespace-pre">
                                    {JSON.stringify(externalState, null, 2)}
                                </code>
                            </div>

                            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Activity className="h-3 w-3 text-slate-500" />
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">State Mutations</h4>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-[10px] text-slate-500 font-medium italic">21:18:30 — Initial State Load</span>
                                        <span className="text-[9px] font-bold text-emerald-500">SUCCESS</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-t border-white/5 pt-2">
                                        <span className="text-[10px] text-slate-500 font-medium italic">21:18:48 — Agent:Planner.RequestState()</span>
                                        <span className="text-[9px] font-bold text-blue-400">GRANTED</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Other tabs simplified for space */}
                    {activeTab === "validation" && <div className="p-4 text-center text-slate-500 italic text-xs">Validator Data Active in Schema View</div>}
                    {activeTab === "context" && <div className="p-4 text-center text-slate-500 italic text-xs">Isolated Context Locked</div>}
                    {activeTab === "memories" && <div className="p-4 text-center text-slate-500 italic text-xs">Vector Memory Injected via State</div>}

                </div>

                {/* Console Footer */}
                <div className="border-t border-white/10 bg-black/60 p-5">
                    <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-slate-500">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                                <span className="font-black tracking-tight uppercase">Stateless Agent Protocol Active</span>
                            </div>
                        </div>
                        <span className="font-mono text-emerald-500/30 font-bold uppercase">v8_iso_9</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
