import React from 'react';
import { useAppStore } from '../../hooks/useAppStore';
import { MatchCard } from './MatchCard';

interface LobbyProps {
    matchId: number | null;
    onBack: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ matchId, onBack }) => {
    const { activeMatches, user, joinTeam5v5, cancelMatch, showNotification, uploadProof } = useAppStore();
    const [uploadingId, setUploadingId] = React.useState<number | null>(null);

    const match = activeMatches.find(m => m.id === matchId);

    if (!match) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-fade-in">
                <p className="text-xl font-black italic mb-4">PARTIDA NÃO ENCONTRADA</p>
                <button onClick={onBack} className="text-[#C9A050] hover:underline font-bold">Voltar para Arena</button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6 pb-20">
            {/* Navigation Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="bg-slate-800/50 hover:bg-slate-700 text-white p-3 rounded-xl transition-colors"
                >
                    ⬅ Voltar
                </button>
                <div>
                    <h2 className="text-2xl font-black italic text-white flex items-center gap-2">
                        SALA DE DUELO <span className="text-[#C9A050]">#{match.id}</span>
                        {match.password && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/20">PRIVADA</span>}
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                        {match.mode} • APOSTA: R$ {match.stake.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Main Stage - Reusing MatchCard logic but potentially expanded */}
            <div className="max-w-4xl mx-auto">
                {/* 
                    We reuse MatchCard here because it already contains the complex "Didactic" logic 
                    (Slots, Teams, Pot, Roles). 
                    In a full Lobby, this Card is the centerpiece.
                    We can wrap it in a "Stage" container.
                */}
                <div className="transform scale-110 origin-top bg-[#0F1523] p-1 rounded-[3rem] border border-white/5 shadow-2xl shadow-black/50">
                    <MatchCard
                        match={match}
                        user={user}
                        onJoin={joinTeam5v5}
                        onCancel={(id) => {
                            cancelMatch(id);
                            onBack(); // Go back after cancel
                        }}
                        onUpload={async (id, file) => {
                            setUploadingId(id);
                            const success = await uploadProof(id, file);
                            if (success) showNotification("Print enviado!", "success");
                            setUploadingId(null);
                        }}
                        uploadingId={uploadingId}
                    />
                </div>

                {/* Additional Lobby Instructions / Chat Placeholder */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#0F1523] p-6 rounded-3xl border border-white/5">
                        <h3 className="text-white font-black italic uppercase mb-4 text-sm">📜 Regras da Sala</h3>
                        <ul className="space-y-2 text-xs text-slate-400 font-bold">
                            <li className="flex gap-2">
                                <span className="text-[#C9A050]">1.</span>
                                <span>O Capitão do Time A (Dono) deve criar a sala no jogo.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-[#C9A050]">2.</span>
                                <span>Todos os membros deve entrar usando os IDs listados acima.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-[#C9A050]">3.</span>
                                <span>Após a partida, o Vencedor envia o print aqui.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-[#C9A050]">4.</span>
                                <span>A IA valida o resultado e paga automaticamente.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-[#0F1523] p-6 rounded-3xl border border-white/5 opacity-50 relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] z-10">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-black/50 px-3 py-1 rounded text-white">Chat em Breve</span>
                        </div>
                        <h3 className="text-white font-black italic uppercase mb-4 text-sm">💬 Chat do Lobby</h3>
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <span className="text-[#C9A050] font-black text-xs">Sistema:</span>
                                <span className="text-slate-400 text-xs">Bem-vindo à sala #{match.id}!</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
