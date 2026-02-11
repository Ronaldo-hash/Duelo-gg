import React from 'react';
import { useAppStore } from '../../hooks/useAppStore';
import { supabase } from '../../services/supabaseClient';

interface SidebarProps {
    activeTab: 'arena' | 'matches' | 'bank' | 'profile' | 'dev' | 'admin' | 'clan';
    setActiveTab: (tab: 'arena' | 'matches' | 'bank' | 'profile' | 'dev' | 'admin' | 'clan') => void;
}

const AdminLink = ({ activeTab, setActiveTab }: { activeTab: any, setActiveTab: any }) => {
    const { isAdmin } = useAppStore();

    if (!isAdmin) return null;

    return (
        <div className="pt-8 border-t border-white/5 mt-auto">
            <button
                onClick={() => setActiveTab('admin')}
                className={`w-full group relative flex items-center gap-4 p-4 transition-all uppercase text-xs font-bold tracking-[0.2em] overflow-hidden ${activeTab === 'admin'
                    ? 'text-red-500 border-r-2 border-red-500 bg-gradient-to-l from-red-500/10 to-transparent'
                    : 'text-red-900/50 hover:text-red-500 hover:bg-red-500/5'
                    }`}
            >
                <div className="absolute inset-0 bg-red-500/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />

                <span className="w-6 h-6 flex items-center justify-center drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </span>
                <span className="relative z-10 font-mono">PAINEL ADMIN</span>
            </button>
        </div>
    );
};

const LogoutButton = () => {
    const handleLogout = async () => {
        await supabase.auth.signOut();
        // window.location.reload(); 
    };

    return (
        <div className="mt-8 pt-8 border-t border-white/5">
            <button
                onClick={handleLogout}
                className="w-full group relative flex items-center gap-4 p-4 transition-all uppercase text-xs font-bold tracking-[0.2em] text-slate-600 hover:text-white hover:bg-white/5 overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />

                <span className="w-6 h-6 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </span>
                <span className="relative z-10 font-mono">SAIR</span>
            </button>
        </div>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
    return (
        <aside className="fixed left-0 top-0 bottom-0 w-72 bg-[#0F1523] border-r border-white/5 hidden lg:flex flex-col p-10 z-50">
            <div className="text-3xl font-black italic mb-16">DUELO<span className="text-[#C9A050]">GG</span></div>
            <nav className="space-y-4">
                {['arena', 'clan', 'matches', 'bank', 'profile'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`w-full group relative flex items-center gap-4 p-4 transition-all uppercase text-xs font-bold tracking-[0.2em] overflow-hidden ${activeTab === tab
                            ? 'text-[#C9A050] border-r-2 border-[#C9A050] bg-gradient-to-l from-[#C9A050]/10 to-transparent'
                            : 'text-slate-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {/* Hover Glitch Effect Line */}
                        <div className="absolute inset-0 bg-[#C9A050]/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />

                        <span className={`w-6 h-6 flex items-center justify-center transition-all ${activeTab === tab ? 'drop-shadow-[0_0_8px_rgba(201,160,80,0.8)]' : ''}`}>
                            {tab === 'arena' && (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            )}
                            {tab === 'clan' && (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            )}
                            {tab === 'matches' && (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            {tab === 'bank' && (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M2 10h20M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            )}
                            {tab === 'profile' && (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            )}
                        </span>
                        <span className="relative z-10 font-mono">{tab}</span>
                    </button>
                ))}

                <AdminLink activeTab={activeTab} setActiveTab={setActiveTab} />
            </nav>

            <LogoutButton />
        </aside>
    );
};
