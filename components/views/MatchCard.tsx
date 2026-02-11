import React, { useState } from 'react';
import { useAppStore } from '../../hooks/useAppStore';
import { Match } from '../../types';
// If types are not in a shared file, I'll define a local interface matches the Store one for now

interface MatchCardProps {
    match: Match;
    user: any;
    onJoin: (matchId: number, teamSide: 'A' | 'B', stake: number) => void;
    onCancel: (matchId: number) => void;
    onUpload: (matchId: number, file: File) => void;
    uploadingId: number | null;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match: m, user, onJoin, onCancel, onUpload, uploadingId }) => {
    const { showNotification } = useAppStore();

    // Determine Layout based on Mode
    const is5v5 = m.mode.includes('5v5');
    const slotCount = is5v5 ? 5 : 1;

    // Helper to check if I am in this match
    const myPlayer = m.match_players?.find((p: any) => p.user_id === user?.id);
    const iAmCaptain = myPlayer?.role === 'CAPTAIN';
    const iAmInTeamA = myPlayer?.team_side === 'A';
    const iAmInTeamB = myPlayer?.team_side === 'B';

    const handleCopyInvite = () => {
        const link = `duelogg.app/match/${m.id}`; // Mock link
        navigator.clipboard.writeText(`🛡️ BORA PRO DUELO! \n\nSala: #${m.id} \nAposta: R$${m.stake} \nPosição: ${m.mode}\n\nEntra aí: ${link}`);
        showNotification("Link de Convite Copiado!", "success");
    };

    return (
        <div className="bg-[#0F1523] rounded-[2.5rem] border border-white/5 overflow-hidden relative group">
            {/* BACKGROUND GLOW */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-${m.status === 'ABERTO' ? 'yellow' : 'emerald'}-500/50 blur-xl`}></div>

            {/* HEADER: STATUS & ID */}
            <div className="bg-black/20 p-4 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-3">
                    <span className="bg-white/5 text-slate-400 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest">
                        #{m.id}
                    </span>
                    <span className="text-[10px] font-black text-white uppercase italic">
                        {m.mode}
                    </span>
                    {m.password && (
                        <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/20 font-black" title="Sala Privada">🔒</span>
                    )}
                </div>

                {m.status === 'ABERTO' ? (
                    <div className="flex items-center gap-2 text-[9px] font-black text-yellow-500 uppercase animate-pulse">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                        Aguardando {is5v5 ? 'Times' : 'Oponente'}
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        Em Andamento
                    </div>
                )}
            </div>

            {/* MAIN ARENA: TEAM A vs TEAM B */}
            <div className="p-6">
                <div className="flex justify-between items-stretch gap-4">

                    {/* TEAM A (HOST) */}
                    <div className="flex-1 space-y-3">
                        <div className="text-left">
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">TIME A</p>
                            <h3 className="text-sm font-black text-white italic truncate text-[#C9A050]">
                                {m.team_name || (is5v5 ? 'Time Anfitrião' : m.player)}
                            </h3>
                        </div>

                        {/* ROSTER A */}
                        <div className="space-y-1.5">
                            {Array.from({ length: slotCount }).map((_, i) => {
                                // For 1v1, Team A is just the creator.
                                // For 5v5, we look at match_players.
                                // If 1v1 match_players might be empty if we rely on m.player/creator_id ??
                                // Let's try to map m.player to slot 0 if match_players is missing.

                                let p = m.match_players?.filter((mp: any) => mp.team_side === 'A')[i];

                                // Fallback for 1v1 if match_players not populated yet (using legacy m.player)
                                if (!is5v5 && i === 0 && !p && m.creator_id) {
                                    p = { username: m.player, user_id: m.creator_id };
                                }

                                const isMe = p?.user_id === user?.id;
                                return (
                                    <div key={`A-${i}`} className={`p-2 rounded-xl flex items-center justify-between border ${isMe ? 'bg-[#C9A050]/10 border-[#C9A050]/50' : 'bg-black/20 border-white/5'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                                {p ? '👤' : i + 1}
                                            </div>
                                            <span className={`text-[9px] font-bold ${p ? 'text-white' : 'text-slate-600 italic'}`}>
                                                {p ? p.username : 'Vazio'}
                                            </span>
                                        </div>
                                        {p ? (
                                            <span className="text-[7px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-black uppercase">PAGO</span>
                                        ) : (
                                            !myPlayer && m.status === 'ABERTO' && (
                                                <button
                                                    onClick={() => onJoin(m.id, 'A', m.stake)}
                                                    className="text-[7px] bg-white/10 text-white px-2 py-1 rounded hover:bg-emerald-500 transition-colors uppercase font-bold"
                                                >
                                                    Entrar
                                                </button>
                                            )
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* VS / POT CENTER */}
                    <div className="w-20 flex flex-col items-center justify-center relative">
                        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                            <span className="text-6xl font-black italic">VS</span>
                        </div>

                        <div className="z-10 text-center space-y-1">
                            <p className="text-[8px] text-slate-500 font-bold uppercase">Premiação</p>
                            <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                                <p className="text-lg font-black text-emerald-400 italic">
                                    R${(m.stake * 2 * 0.9).toFixed(0)}
                                </p>
                            </div>
                            <div className="flex flex-col items-center gap-1 mt-2">
                                <span className="text-[14px]">🔒</span>
                                <span className="text-[6px] text-slate-500 uppercase font-bold max-w-[60px] leading-tight">
                                    Garantido pela Plataforma
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* TEAM B (CHALLENGER) */}
                    <div className="flex-1 space-y-3">
                        <div className="text-right">
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">TIME B</p>
                            <h3 className="text-sm font-black text-white italic truncate text-red-400">
                                {m.opponent_name || (is5v5 ? 'Desafiante' : 'Aguardando')}
                            </h3>
                        </div>

                        {/* ROSTER B */}
                        <div className="space-y-1.5">
                            {Array.from({ length: slotCount }).map((_, i) => {
                                let p = m.match_players?.filter((mp: any) => mp.team_side === 'B')[i];

                                // Fallback for 1v1
                                if (!is5v5 && i === 0 && !p && m.opponent_id) {
                                    p = { username: m.opponent_name, user_id: m.opponent_id };
                                }

                                const isMe = p?.user_id === user?.id;
                                return (
                                    <div key={`B-${i}`} className={`p-2 rounded-xl flex items-center justify-between border flex-row-reverse ${isMe ? 'bg-red-500/10 border-red-500/50' : 'bg-black/20 border-white/5'}`}>
                                        <div className="flex items-center gap-2 flex-row-reverse">
                                            <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                                {p ? '👤' : i + 1}
                                            </div>
                                            <span className={`text-[9px] font-bold ${p ? 'text-white' : 'text-slate-600 italic'}`}>
                                                {p ? p.username : 'Vazio'}
                                            </span>
                                        </div>
                                        {p ? (
                                            <span className="text-[7px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-black uppercase">PAGO</span>
                                        ) : (
                                            !myPlayer && m.status === 'ABERTO' && (
                                                <button
                                                    onClick={() => onJoin(m.id, 'B', m.stake)}
                                                    className="text-[7px] bg-white/10 text-white px-2 py-1 rounded hover:bg-emerald-500 transition-colors uppercase font-bold"
                                                >
                                                    Entrar
                                                </button>
                                            )
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="bg-black/20 p-4 border-t border-white/5 flex gap-3">
                {m.status === 'ABERTO' && myPlayer && (
                    <button
                        onClick={handleCopyInvite}
                        className="flex-1 bg-[#C9A050] text-black font-black py-3 rounded-xl uppercase text-[10px] tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"
                    >
                        <span>📢</span> Convidar Time
                    </button>
                )}

                {m.status === 'ABERTO' && myPlayer && (
                    <button
                        onClick={() => onCancel(m.id)}
                        className="px-4 bg-red-500/10 text-red-500 border border-red-500/20 font-black rounded-xl uppercase text-[10px] tracking-widest hover:bg-red-500/20 transition-all"
                    >
                        Sair
                    </button>
                )}

                {/* FILE UPLOAD FOR RESULT */}
                {(m.status === 'EM_ANDAMENTO' || m.status === 'ABERTO') && myPlayer && ( // ALLOW UPLOAD IN OPEN FOR TESTING IF NEEDED, BUT USUALLY IN PROGRESS
                    <label className="flex-1 cursor-pointer bg-slate-800 text-white font-black py-3 rounded-xl uppercase text-[10px] tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-2 text-center">
                        <span>📸</span> {uploadingId === m.id ? 'Enviando...' : 'Enviar Print da Vitória'}
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onUpload(m.id, file);
                            }}
                            disabled={uploadingId === m.id}
                        />
                    </label>
                )}
            </div>
        </div>
    );
};
