import React from 'react';
import { useAppStore } from '../../hooks/useAppStore';
import { generateFoundationFiles } from '../../services/geminiService';

interface DevToolsProps {
    setLoading: (loading: boolean) => void;
}

export const DevTools: React.FC<DevToolsProps> = ({ setLoading }) => {
    const { foundationFiles, setFoundationFiles } = useAppStore();

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const files = await generateFoundationFiles();
            setFoundationFiles(files);
        } catch (e) {
            console.error(e);
            alert('Erro ao gerar arquivos');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-blue-600/10 border border-blue-600/20 p-10 rounded-[3rem] text-center">
                <h3 className="text-xl font-black italic mb-4">SISTEMA DE <span className="text-blue-500">ARQUITETURA</span></h3>
                <p className="text-xs text-slate-400 font-medium max-w-md mx-auto mb-8">Aqui você gera os arquivos necessários para configurar o backend real (Stark Bank, OCR, Python) no seu IDE Antigravity.</p>
                <button
                    onClick={handleGenerate}
                    className="bg-blue-600 text-white font-black px-12 py-5 rounded-3xl text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20"
                >
                    Gerar Arquivos Foundation
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {foundationFiles.map(f => (
                    <div key={f.name} className="bg-[#0F1523] border border-white/5 p-6 rounded-3xl group">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase">{f.name}</span>
                            <button onClick={() => navigator.clipboard.writeText(f.content)} className="text-[9px] font-black text-blue-400 uppercase">Copiar</button>
                        </div>
                        <div className="h-32 overflow-y-auto bg-slate-950/50 p-4 rounded-xl text-[9px] font-mono text-slate-600 whitespace-pre-wrap">{f.content}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
