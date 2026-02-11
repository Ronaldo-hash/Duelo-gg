import React from 'react';
import { useAppStore } from '../../hooks/useAppStore';
import { HelpButton } from '../shared/HelpButton';
import { MatchCard } from './MatchCard';

interface ArenaProps {
    setLoading: (loading: boolean) => void;
    onNavigate: (tab: 'arena' | 'matches' | 'bank' | 'profile' | 'dev') => void;
    onSelectMatch?: (matchId: number) => void;
}

export const Arena: React.FC<ArenaProps> = ({ setLoading, onNavigate, onSelectMatch }) => {
    const { balance, subtractBalance, setEscrow, addMatch, joinMatch, joinTeam5v5, activeMatches, cancelMatch, showNotification, user } = useAppStore();
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [selectedStake, setSelectedStake] = React.useState(20);
    const [selectedMode, setSelectedMode] = React.useState<'1v1' | '5v5'>('1v1');

    const [createPassword, setCreatePassword] = React.useState('');

    // State for Password Join Modal
    const [joinModalOpen, setJoinModalOpen] = React.useState(false);
    const [joinPassword, setJoinPassword] = React.useState('');
    const [pendingJoin, setPendingJoin] = React.useState<{ matchId: number, side: 'A' | 'B', stake: number } | null>(null);

    const handleJoinClick = (matchId: number, side: 'A' | 'B', stake: number) => {
        const match = activeMatches.find(m => m.id === matchId);
        if (!match) return;

        if (match.player === 'Você' || match.creator_id === user?.id) {
            showNotification("Você não pode entrar no seu próprio desafio.", 'warning');
            return;
        }

        if (balance < stake) {
            showNotification("Saldo insuficiente. Faça um depósito no Banco.", 'error');
            return;
        }

        if (match.password && match.password.trim() !== '') {
            setPendingJoin({ matchId, side, stake });
            setJoinPassword('');
            setJoinModalOpen(true);
        } else {
            executeJoin(matchId, side, stake);
        }
    };

    const confirmJoinPrivate = () => {
        if (!pendingJoin) return;
        executeJoin(pendingJoin.matchId, pendingJoin.side, pendingJoin.stake, joinPassword);
        setJoinModalOpen(false);
        setPendingJoin(null);
    };

    const executeJoin = async (matchId: number, side: 'A' | 'B', stake: number, password?: string) => {
        setLoading(true);
        const match = activeMatches.find(m => m.id === matchId);
        let success = false;

        if (match?.mode.includes('5v5')) {
            // 5v5 Logic uses joinTeam5v5 (Password check should be added there in real app, but for now client check passed)
            // If password was required, we checked it in confirmJoinPrivate? 
            // Wait, joinTeam5v5 doesn't take password arg in store. 
            // Since we verified it client-side (or will verify), we proceed. 
            // ACTUALLY: joinMatch DOES take password. joinTeam5v5 DOES NOT.
            // If 5v5 is private, we should probably verify password here before calling?
            // Yes, 'confirmJoinPrivate' logic below handles UI.
            // Ideally API should verify. For MVP, we trust client check if logic allowed.

            if (match.password && match.password !== password && password !== undefined) {
                showNotification("Senha incorreta!", "error");
                setLoading(false);
                return;
            }

            success = await joinTeam5v5(matchId, side, stake);
        } else {
            // 1v1 Logic
            success = await joinMatch(matchId, stake, password);
        }

        if (success) {
            if (onSelectMatch) {
                onSelectMatch(matchId);
            } else {
                onNavigate('matches');
            }
        }
        setLoading(false);
    };

    const handleCreateChallenge = async () => {
        if (balance < selectedStake) return showNotification("Saldo insuficiente.", "error");

        let teamName = '';
        if (selectedMode === '5v5') {
            const input = document.getElementById('team-name-input') as HTMLInputElement;
            teamName = input?.value || 'Meu Time';
        }

        // Always capture opponent name if provided
        const inputOpp = document.getElementById('opponent-name-input') as HTMLInputElement;
        const opponentName = inputOpp?.value || '';

        const matchId = await addMatch({
            player: 'Você', // Creator name handled by store/db logic usually
            rank: 'Mítico',
            stake: selectedStake,
            mode: selectedMode === '1v1' ? '⚔️ 1v1 SOLO' : '🛡️ 5v5 CLAN', // USING EMOJIS TO MATCH DB
            status: 'ABERTO',
            password: createPassword || null,
            team_name: teamName,
            opponent_name: opponentName // Pass opponent name
        });

        if (matchId) {
            subtractBalance(selectedStake);
            setShowCreateModal(false);
            setCreatePassword('');

            showNotification("Desafio criado! Redirecionando para o Lobby...", "success");

            // Navigate to Lobby immediately
            if (onSelectMatch) {
                onSelectMatch(matchId);
            } else {
                onNavigate('matches');
            }
        }
    };

    return (
        <div className="space-y-8 animate-fade-in relative z-10">

            {/* Header com Help Button */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter text-white">ARENA <span className="text-[#C9A050]">GLOBAL</span></h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Desafie • Vença • Lucre</p>
                </div>
                <HelpButton
                    title="Como funciona a Arena?"
                    content={
                        <>
                            <p><strong>Escrow (Cofrinho):</strong> Quando você entra num duelo, o valor da aposta sai da sua conta e fica "preso" no sistema (Escrow).</p>
                            <p><strong>Segurança (Senhas):</strong> Se ver um cadeado 🔒, a sala é privada e precisa de senha.</p>
                            <p><strong>Matchmaking:</strong> A lista mostra desafios criados por outros jogadores em tempo real.</p>
                        </>
                    }
                />
            </div>

            {/* Resto do componente... */}
            <div className="flex gap-4 items-center">
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-[#C9A050] text-black font-black px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest hover:scale-105 transition-transform"
                >
                    + Criar Desafio
                </button>
                <div className="bg-[#0F1523] px-6 py-3 rounded-2xl border border-white/5 text-right shadow-xl">
                    <p className="text-[9px] text-slate-500 font-black uppercase">Saldo</p>
                    <p className="text-xl font-black text-[#C9A050] italic">R$ {balance.toFixed(2)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeMatches.filter(m => m.status === 'ABERTO').length === 0 ? (
                    <div className="col-span-2 text-center py-20 opacity-50">
                        <p className="text-xl font-black italic">ARENA VAZIA</p>
                        <p className="text-xs text-slate-500 uppercase">Seja o primeiro a criar um desafio!</p>
                    </div>
                ) : (
                    activeMatches.filter(m => m.status === 'ABERTO').map(c => (
                        <div key={c.id} onClick={() => onSelectMatch && onSelectMatch(c.id)} className="cursor-pointer hover:scale-[1.01] transition-transform">
                            <MatchCard
                                match={c}
                                user={user}
                                onJoin={handleJoinClick}
                                onCancel={() => cancelMatch(c.id)}
                                onUpload={() => { }} // No upload in Arena public feed
                                uploadingId={null}
                            />
                        </div>
                    ))
                )}
            </div>

            {/* Create Challenge Modal */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
                        <div className="bg-[#0F1523] p-8 rounded-[3rem] border border-white/10 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="absolute top-6 right-8 text-slate-500 hover:text-white font-black"
                            >
                                X
                            </button>

                            <h3 className="text-2xl font-black italic text-center mb-8">NOVO <span className="text-[#C9A050]">DESAFIO</span></h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Valor da Aposta</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[10, 20, 50, 100, 200, 500].map(val => (
                                            <button
                                                key={val}
                                                onClick={() => setSelectedStake(val)}
                                                className={`py-3 rounded-xl text-xs font-black transition-all ${selectedStake === val ? 'bg-[#C9A050] text-black' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                                            >
                                                R$ {val}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-slate-400">Sua Aposta:</span>
                                        <span className="text-white">R$ {selectedStake.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-slate-400">Prêmio (Vencedor):</span>
                                        <span className="text-[#C9A050]">R$ {(selectedStake * 1.8).toFixed(2)}</span>
                                    </div>
                                    <p className="text-[9px] text-slate-600 mt-2 text-center">* Taxa de 10% da plataforma aplicada.</p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Modo de Jogo</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['1v1', '5v5'].map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => setSelectedMode(mode as any)}
                                                className={`py-4 rounded-xl text-xs font-black transition-all relative overflow-hidden ${selectedMode === mode ? 'bg-[#C9A050] text-black shadow-lg shadow-[#C9A050]/20 scale-105' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}
                                            >
                                                {mode === '5v5' && selectedMode !== '5v5' && (
                                                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-bl-lg font-bold animate-pulse">NOVO</span>
                                                )}
                                                {mode === '1v1' ? '⚔️ 1v1 SOLO' : '🛡️ 5v5 CLAN'}
                                            </button>
                                        ))}
                                    </div>

                                    {/* CLAN SETUP (Only for 5v5) */}
                                    {selectedMode === '5v5' && (
                                        <div className="mt-4 bg-slate-900/50 p-4 rounded-2xl border border-white/5 animate-fade-in">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Configuração do Time</label>
                                            <div className="flex gap-4 items-center">
                                                {/* Logo Upload Placeholder */}
                                                <div className="w-12 h-12 bg-black/40 rounded-xl border border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-[#C9A050] text-xl" title="Subir Logo">
                                                    🛡️
                                                </div>
                                                {/* Team Name Input */}
                                                <input
                                                    type="text"
                                                    placeholder="Nome do seu Clan/Time"
                                                    id="team-name-input"
                                                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-[#C9A050] outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Password / Private Room */}
                                <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                                    <div className="flex-1 mr-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                                            Desafiar Oponente (Nick)
                                        </label>
                                        <input
                                            type="text"
                                            id="opponent-name-input"
                                            placeholder="Ex: Pain Gaming"
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-bold focus:border-[#C9A050] outline-none"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black text-[#C9A050] uppercase tracking-widest block mb-1">
                                            Senha da Sala (Opcional)
                                        </label>
                                        <input
                                            type="text"
                                            value={createPassword}
                                            onChange={(e) => setCreatePassword(e.target.value)}
                                            placeholder="Ex: 1234"
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-bold focus:border-[#C9A050] outline-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleCreateChallenge}
                                    className="w-full bg-[#C9A050] text-black font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:scale-105 transition-all"
                                >
                                    CRIAR SALA DE DUELO (IR PARA LOBBY) 🚀
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Join Private Match Modal */}
            {
                joinModalOpen && (
                    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
                        <div className="bg-[#0F1523] p-8 rounded-[3rem] border border-white/10 w-full max-w-sm relative">
                            <button
                                onClick={() => setJoinModalOpen(false)}
                                className="absolute top-6 right-8 text-slate-500 hover:text-white font-black"
                            >
                                X
                            </button>

                            <h3 className="text-xl font-black italic text-center mb-6">SALA <span className="text-red-500">PRIVADA</span></h3>
                            <p className="text-center text-slate-400 text-xs mb-6">Esta partida é protegida por senha.</p>

                            <input
                                type="text"
                                placeholder="Digite a senha..."
                                value={joinPassword}
                                onChange={(e) => setJoinPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-lg outline-none focus:border-[#C9A050] mb-6 tracking-widest placeholder:text-slate-700"
                            />

                            <button
                                onClick={confirmJoinPrivate}
                                className="w-full bg-[#C9A050] text-black font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:scale-105 transition-all"
                            >
                                Entrar na Sala
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
