import React from 'react';
import { useAppStore } from '../../hooks/useAppStore';
import { HelpButton } from '../shared/HelpButton';
import { MatchCard } from './MatchCard';

interface MatchesProps {
    onRequestCamera: (matchId: number) => void;
    onSelectMatch?: (matchId: number) => void;
}

// Mock User for Matches display
const user = {
    name: "DueloPlayer_01",
    rank: "Mítico",
};

export const Matches: React.FC<MatchesProps> = ({ onRequestCamera, onSelectMatch }) => {
    const { activeMatches, user, uploadProof, cancelMatch, showNotification, joinTeam5v5 } = useAppStore();
    const [uploadingId, setUploadingId] = React.useState<number | null>(null);
    const [showCancelModal, setShowCancelModal] = React.useState(false);
    const [selectedMatchId, setSelectedMatchId] = React.useState<number | null>(null);

    // Filter matches where user is involved
    const myMatches = activeMatches.filter(m => {
        const isCreator = m.creator_id === user?.id;
        const isOpponent = m.opponent_id === user?.id;
        const isInRoster = m.match_players?.some((p: any) => p.user_id === user?.id);

        const isMyMatch = isCreator || isOpponent || isInRoster;
        const isInProgress = m.status === 'EM_ANDAMENTO' || m.status === 'ANALISANDO_IA' || m.status === 'EM_ANALISE';
        const isMyOpenMatch = m.status === 'ABERTO' && isMyMatch; // If I am in roster, I want to see usage

        return isMyMatch && (isInProgress || isMyOpenMatch);
    });

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, matchId: number) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadingId(matchId);
        const success = await uploadProof(matchId, file);
        if (success) {
            showNotification("Print enviado com sucesso! Vitória reivindicada.", "success");
        } else {
            showNotification("Erro ao enviar print.", "error");
        }
        setUploadingId(null);
    };

    return (
        <div className="space-y-6 animate-fade-in relative z-10">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black italic uppercase">Meus <span className="text-[#C9A050]">Duelos</span></h2>
                <HelpButton
                    title="Validação de Vitória"
                    content={
                        <div className="space-y-2">
                            <p><strong>1. Adicione no Jogo:</strong> Copie o ID do seu oponente aqui no app e adicione-o como amigo no Mobile Legends.</p>
                            <p><strong>2. Jogue a Partida:</strong> Criem o lobby no jogo e disputem a partida valendo!</p>
                            <p><strong>3. Tire Print:</strong> O VENCEDOR deve tirar um print da tela de vitória.</p>
                            <p><strong>4. Envie o Print:</strong> Clique em "Submeter Print" aqui no app. A IA validará o resultado e liberará o prêmio.</p>
                            <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mt-2">
                                <p className="text-[9px] text-yellow-500 font-bold">⚠️ Importante: Não existe conexão automática. Vocês devem se adicionar e jogar manualmente!</p>
                            </div>
                        </div>
                    }
                />
            </div>

            {
                myMatches.length === 0 ? (
                    <div className="bg-[#0F1523] p-20 rounded-[3rem] border border-white/5 text-center">
                        <p className="text-slate-500 font-black text-xs uppercase italic tracking-widest">Nenhuma batalha ativa no momento.</p>
                        <p className="text-[10px] text-slate-600 mt-2">Vá para a Arena e crie ou aceite um desafio.</p>
                    </div>
                ) : (
                    myMatches.map(m => (
                        <div key={m.id} onClick={() => onSelectMatch && onSelectMatch(m.id)} className="cursor-pointer hover:scale-[1.01] transition-transform">
                            <MatchCard
                                match={m}
                                user={user}
                                onJoin={joinTeam5v5}
                                onCancel={(id) => {
                                    setSelectedMatchId(id);
                                    setShowCancelModal(true);
                                }}
                                onUpload={async (id, file) => {
                                    setUploadingId(id);
                                    const success = await uploadProof(id, file);
                                    if (success) showNotification("Print enviado com sucesso!", "success");
                                    else showNotification("Erro ao enviar.", "error");
                                    setUploadingId(null);
                                }}
                                uploadingId={uploadingId}
                            />
                        </div>
                    ))
                )
            }
            {/* CUSTOM CANCEL MODAL */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#0F1523] border border-red-500/30 rounded-3xl p-6 w-full max-w-sm relative overflow-hidden shadow-2xl shadow-red-900/20">
                        {/* Background Effects */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                        <div className="relative z-10 text-center space-y-4">
                            <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-2 border border-red-500/20">
                                <span className="text-3xl">⚠️</span>
                            </div>

                            <div>
                                <h3 className="text-xl font-black text-white italic uppercase">Cancelar Partida?</h3>
                                <p className="text-xs text-slate-400 mt-2">
                                    Tem certeza que deseja cancelar este duelo? <br />
                                    <span className="text-red-400 font-bold">Essa ação não pode ser desfeita.</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-4">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-all uppercase"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={() => {
                                        if (selectedMatchId) cancelMatch(selectedMatchId);
                                        setShowCancelModal(false);
                                    }}
                                    className="py-3 rounded-xl bg-red-500 text-white font-black text-xs hover:bg-red-600 transition-all uppercase shadow-lg shadow-red-500/20"
                                >
                                    Confirmar Cancelamento
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};
