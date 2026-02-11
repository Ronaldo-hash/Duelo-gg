import React from 'react';

export const Profile: React.FC = () => {
    const { user, showNotification } = useAppStore();
    const [gameId, setGameId] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [savedId, setSavedId] = React.useState('');

    // Load existing profile data
    React.useEffect(() => {
        if (user) {
            loadProfile();
        }
    }, [user]);

    const loadProfile = async () => {
        const { data } = await supabase.from('profiles').select('mlbb_id').eq('id', user.id).single();
        if (data?.mlbb_id) {
            setSavedId(data.mlbb_id);
            setGameId(data.mlbb_id);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setLoading(true);

        const { error } = await supabase
            .from('profiles')
            .update({ mlbb_id: gameId })
            .eq('id', user.id);

        if (error) {
            showNotification("Erro ao salvar perfil. Tente novamente.", "error");
            console.error(error);
        } else {
            setSavedId(gameId);
            showNotification("Nick do Jogo salvo com sucesso!", "success");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div className="bg-[#0F1523] p-10 rounded-[3rem] border border-white/5 text-center relative overflow-hidden">
                <div className="w-24 h-24 bg-slate-900 rounded-[2rem] border-2 border-[#C9A050] mx-auto mb-6 flex items-center justify-center text-4xl font-black italic text-[#C9A050] uppercase">
                    {user?.email?.[0] || '?'}
                </div>

                <h3 className="text-2xl font-black italic text-white">{user?.email?.split('@')[0]}</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-8">{user?.email}</p>

                <div className="bg-black/40 p-6 rounded-3xl border border-white/5 max-w-md mx-auto relative overflow-hidden group">
                    {/* DECORATIVE BG */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A050]/10 blur-3xl -z-10"></div>

                    <label className="text-[10px] font-black text-[#C9A050] uppercase tracking-widest block mb-4 text-left flex justify-between items-center">
                        <span>CONTA DE JOGO (MOBILE LEGENDS)</span>
                        {savedId && <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[8px]">● ONLINE</span>}
                    </label>

                    {!savedId ? (
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={gameId}
                                onChange={(e) => setGameId(e.target.value)}
                                placeholder="Nick ou ID do Jogo"
                                className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-[#C9A050] outline-none transition-all placeholder:text-slate-600"
                            />
                            <button
                                onClick={handleSaveProfile}
                                disabled={loading || !gameId}
                                className="bg-[#C9A050] text-black font-black px-6 rounded-xl uppercase text-[10px] tracking-widest hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-lg shadow-[#C9A050]/20"
                            >
                                {loading ? 'Validando...' : 'Vincular'}
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 bg-slate-800/30 p-4 rounded-2xl border border-white/5 relative">
                            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-[#C9A050]/30 flex items-center justify-center text-2xl">
                                ⚔️
                            </div>
                            <div className="text-left flex-1">
                                <p className="text-[10px] text-slate-500 font-bold uppercase">CONTA VINCULADA</p>
                                <p className="text-lg font-black text-white italic tracking-wide">{savedId}</p>
                            </div>
                            <button
                                onClick={() => { setSavedId(''); setGameId(''); }}
                                className="text-[9px] text-red-500 hover:text-red-400 font-bold uppercase underline"
                            >
                                Desvincular
                            </button>

                            {/* VERIFIED BADGE */}
                            <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                                <span>✓</span> VERIFICADO
                            </div>
                        </div>
                    )}

                    <p className="text-[9px] text-slate-600 branch-balance mt-4 text-left leading-relaxed">
                        ⚠️ Certifique-se de que este Nick é <b>exatamente igual</b> ao do jogo para que a IA possa validar suas vitórias automaticamente.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-10">
                    <div className="p-4 bg-white/5 rounded-2xl"><p className="text-[8px] text-slate-500 font-black uppercase">Win Rate</p><p className="text-lg font-black text-white italic">--%</p></div>
                    <div className="p-4 bg-white/5 rounded-2xl"><p className="text-[8px] text-slate-500 font-black uppercase">Partidas</p><p className="text-lg font-black text-white italic">0</p></div>
                    <div className="p-4 bg-white/5 rounded-2xl"><p className="text-[8px] text-slate-500 font-black uppercase">Rank</p><p className="text-lg font-black text-white italic">--</p></div>
                </div>
            </div>

            {/* KYC SECTION */}
            <div className="bg-black/20 p-6 rounded-2xl border border-white/5 max-w-md mx-auto mt-8">
                <label className="text-[10px] font-black text-[#C9A050] uppercase tracking-widest block mb-4 text-left">
                    Verificação de Identidade (KYC)
                </label>

                {(user?.verification_status === 'aprovado') ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/50 p-4 rounded-xl flex items-center gap-3">
                        <span className="text-2xl">✅</span>
                        <div>
                            <p className="text-emerald-500 font-black text-sm uppercase">Conta Verificada</p>
                            <p className="text-[9px] text-emerald-400">Você pode realizar saques e criar desafios.</p>
                        </div>
                    </div>
                ) : (user?.verification_status === 'pendente') ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/50 p-4 rounded-xl flex items-center gap-3">
                        <span className="text-2xl">⏳</span>
                        <div>
                            <p className="text-yellow-500 font-black text-sm uppercase">Em Análise</p>
                            <p className="text-[9px] text-yellow-400">Seus documentos estão sendo analisados.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-[9px] text-slate-400 text-left">
                            Para sua segurança e conformidade legal, precisamos verificar sua identidade.
                            Envie uma foto do seu CPF e uma Selfie segurando o documento.
                        </p>

                        {/* CPF INPUT */}
                        <input
                            type="text"
                            placeholder="Seu CPF (Somente Números)"
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-xs focus:border-[#C9A050] outline-none"
                        />

                        {/* DOCUMENT UPLOAD */}
                        <div className="grid grid-cols-2 gap-4">
                            <label className="cursor-pointer bg-slate-900 border border-white/10 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-800 transition-all group">
                                <span className="text-2xl group-hover:scale-110 transition-transform">📄</span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase">Foto do CPF</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => showNotification("Upload (Simulação): Arquivo selecionado!", "info")} />
                            </label>

                            <label className="cursor-pointer bg-slate-900 border border-white/10 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-800 transition-all group">
                                <span className="text-2xl group-hover:scale-110 transition-transform">🤳</span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase">Selfie com CPF</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => showNotification("Upload (Simulação): Arquivo selecionado!", "info")} />
                            </label>
                        </div>

                        <button className="w-full bg-[#C9A050] text-black font-black py-3 rounded-xl uppercase text-[10px] tracking-widest hover:brightness-110 transition-all">
                            Enviar para Análise
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Add imports needed
import { useAppStore } from '../../hooks/useAppStore';
import { supabase } from '../../services/supabaseClient';
