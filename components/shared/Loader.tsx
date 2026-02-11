import React from 'react';

export const Loader: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 border-8 border-[#C9A050] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-[#C9A050] uppercase tracking-[0.6em] animate-pulse">Sincronizando Servidores...</p>
        </div>
    );
};
