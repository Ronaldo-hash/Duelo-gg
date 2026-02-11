import React from 'react';

interface MobileNavProps {
    activeTab: 'arena' | 'matches' | 'bank' | 'profile' | 'dev' | 'clan';
    setActiveTab: (tab: 'arena' | 'matches' | 'bank' | 'profile' | 'dev' | 'clan') => void;
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
            <NavItem id="clan" icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" label="Clã" />
            <NavItem id="matches" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" label="Duelos" />
            <NavItem id="bank" icon="M12 8c-1.657 0-3 .895-3 2" label="Banco" />
            <NavItem id="profile" icon="M16 7a4 4 0 11-8 0" label="Perfil" />
        </nav>
    );
};
