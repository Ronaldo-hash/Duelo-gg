import React from 'react';

interface MobileNavProps {
    activeTab: 'arena' | 'matches' | 'bank' | 'profile' | 'dev';
    setActiveTab: (tab: 'arena' | 'matches' | 'bank' | 'profile' | 'dev') => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
    const NavItem = ({ id, icon, label }: { id: any, icon: string, label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center justify-center gap-1 w-full py-3 transition-all ${activeTab === id ? 'text-[#C9A050]' : 'text-slate-500'}`}
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
            <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
        </button>
    );

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#0F1523]/95 backdrop-blur-md border-t border-white/5 flex lg:hidden z-50">
            <NavItem id="arena" icon="M13 10V3L4 14h7v7l9-11h-7z" label="Arena" />
            <NavItem id="matches" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" label="Duelos" />
            <NavItem id="bank" icon="M12 8c-1.657 0-3 .895-3 2" label="Banco" />
            <NavItem id="profile" icon="M16 7a4 4 0 11-8 0" label="Perfil" />
        </nav>
    );
};
