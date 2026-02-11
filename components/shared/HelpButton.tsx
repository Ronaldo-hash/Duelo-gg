import React, { useState } from 'react';

interface HelpButtonProps {
    title: string;
    content: React.ReactNode;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ title, content }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-6 h-6 rounded-full border border-[#C9A050]/50 flex items-center justify-center text-[12px] text-[#C9A050] hover:text-white hover:bg-[#C9A050] hover:border-[#C9A050] transition-all font-bold shadow-[0_0_10px_rgba(201,160,80,0.2)]"
                title="Ajuda"
            >
                ?
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0F1523] border border-white/10 p-8 rounded-[2rem] max-w-md w-full relative shadow-2xl">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-6 right-6 text-slate-500 hover:text-white"
                >
                    ✕
                </button>

                <h3 className="text-xl font-black italic text-[#C9A050] mb-4 uppercase">{title}</h3>
                <div className="text-sm text-slate-300 space-y-4 leading-relaxed font-light">
                    {content}
                </div>
            </div>
        </div>
    );
};
