import React from 'react';
import { useAppStore } from '../../hooks/useAppStore';
import { HelpButton } from '../shared/HelpButton';

export const Admin: React.FC = () => {
    const { activeMatches, approveMatch, user, resetMatches } = useAppStore();
    const [loadingId, setLoadingId] = React.useState<number | null>(null);

    // Filter for matches needing review
    const pendingMatches = activeMatches.filter(m => m.status === 'EM_ANALISE');

    const handleApprove = async (matchId: number, winnerId: string | undefined) => {
        if (!winnerId) return alert("Erro: Vencedor não identificado");
        setLoadingId(matchId);

        const success = await approveMatch(matchId, winnerId);
        if (success) {
            alert("Vitória Confirmada com Sucesso!");
        } else {
            alert("Erro ao confirmar.");
        }
        setLoadingId(null);
    };

    return (
        <div className="space-y-8 animate-fade-in relative z-10">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter text-red-500">PAINEL <span className="text-white">ADMIN</span></h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Validação de Resultados • Segurança</p>
                </div>
                <HelpButton
                    title="Seu Papel como Admin (Juiz)"
                    content={
                        <>
                            <p><strong>Por que Aprovar?</strong> Para evitar fraudes (ex: fotos falsas). No início, é mais seguro um humano verificar.</p>
                            <p><strong>O Fluxo:</strong> Usuário envia print -&gt; Cai aqui -&gt; Você confere o Nick e o Resultado -&gt; Aprova.</p>
                            <p><strong>Futuro (Escalável):</strong> Podemos trocar isso por uma Inteligência Artificial (OCR) que lê a imagem sozinha e aprova em segundos. Mas o Admin humano sempre existirá para recursos/disputas.</p>
                        </>
                    }
                />
            </div>

            <div className="bg-[#0F1523] p-8 rounded-[2.5rem] border border-red-500/20 mb-8">
                <h3 className="text-xl font-black italic mb-6">Verificações Pendentes (KYC)</h3>

                {/* This would need a real fetch from a 'profiles' list, but for now we simulate or use a simple query if we had a function */}
                <p className="text-slate-500 text-xs italic">
                    (Em Desenvolvimento: Aqui aparecerá a lista de usuários que enviaram documentos.)
                    <br />
                    Por enquanto, use o SQL Editor para aprovar: <code className="text-[#C9A050]">UPDATE profiles SET verification_status = 'aprovado' WHERE email = '...';</code>
                </p>
            </div>

            <div className="bg-[#0F1523] p-8 rounded-[2.5rem] border border-red-500/20">
                <h3 className="text-xl font-black italic mb-6">Partidas em Análise ({pendingMatches.length})</h3>

                {pendingMatches.length === 0 ? (
                    <p className="text-slate-500 text-xs italic">Nenhuma partida pendente de análise.</p>
                ) : (
                    <div className="space-y-4">
                        {pendingMatches.map(m => (
                            <div key={m.id} className="bg-black/20 p-6 rounded-2xl border border-white/5">
                                <div className="flex justify-between mb-4">
                                    <span className="text-xs font-bold text-slate-400">ID: #{m.id}</span>
                                    <span className="text-xs font-bold text-[#C9A050]">Prêmio: R$ {m.reward.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex-1 text-center bg-slate-900 p-2 rounded-lg">
                                        <p className="text-[10px] text-slate-500 uppercase">Vencedor Declarado</p>
                                        <p className="font-bold italic text-white">{(m as any).winner_id === user?.id ? "Você (Dev)" : (m as any).winner_id?.substring(0, 8)}</p>
                                    </div>
                                </div>

                                {/* Proof Image Preview (If strictly available in object, need to ensure fetchMatches includes it or we deduce it) */}
                                {(m as any).proof_url && (
                                    <div className="mb-4">
                                        <p className="text-[10px] text-slate-500 uppercase mb-2">Prova (Print)</p>
                                        <a href={(m as any).proof_url} target="_blank" rel="noopener noreferrer">
                                            <img src={(m as any).proof_url} alt="Prova" className="w-full h-32 object-cover rounded-xl border border-white/10 hover:opacity-80 transition-opacity" />
                                        </a>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleApprove(m.id, (m as any).winner_id)}
                                        disabled={loadingId === m.id}
                                        className="flex-1 bg-emerald-500 text-black font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
                                    >
                                        {loadingId === m.id ? 'Processando...' : 'Aprovar Pagamento'}
                                    </button>
                                    <button className="flex-1 bg-red-500/10 text-red-500 border border-red-500/20 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all">
                                        Reprovar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
