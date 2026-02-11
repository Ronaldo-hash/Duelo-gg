import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAppStore } from '../../hooks/useAppStore';
import { HelpButton } from '../shared/HelpButton';

interface Clan {
    id: string;
    name: string;
    tag: string;
    logo_emoji: string;
    owner_id: string;
    created_at: string;
}

interface ClanMember {
    id: string;
    clan_id: string;
    user_id: string;
    role: 'OWNER' | 'CAPTAIN' | 'MEMBER';
    status: 'ACTIVE' | 'PENDING' | 'KICKED';
    joined_at: string;
    // Joined from profiles
    username?: string;
    mlbb_id?: string;
}

export const ClanPage: React.FC = () => {
    const { user, showNotification } = useAppStore();

    const [myClan, setMyClan] = useState<Clan | null>(null);
    const [members, setMembers] = useState<ClanMember[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Clan form
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [clanName, setClanName] = useState('');
    const [clanTag, setClanTag] = useState('');
    const [clanEmoji, setClanEmoji] = useState('🛡️');

    // Invite form
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');

    // Available clans to join
    const [publicClans, setPublicClans] = useState<(Clan & { member_count: number; owner_name: string })[]>([]);
    const [showBrowseModal, setShowBrowseModal] = useState(false);

    const emojis = ['🛡️', '⚔️', '🔥', '💀', '🐉', '🦁', '🦅', '👑', '💎', '🌟', '⭐', '🎯', '🏆', '🎮', '🎲'];

    useEffect(() => {
        if (user) loadClanData();
    }, [user]);

    const loadClanData = async () => {
        setLoading(true);
        try {
            // Check if user is in any clan
            const { data: membership } = await supabase
                .from('clan_members')
                .select('clan_id, role, status')
                .eq('user_id', user.id)
                .eq('status', 'ACTIVE')
                .maybeSingle();

            if (membership) {
                // Load clan details
                const { data: clan } = await supabase
                    .from('clans')
                    .select('*')
                    .eq('id', membership.clan_id)
                    .single();

                if (clan) {
                    setMyClan(clan);

                    // Load members with profiles
                    const { data: memberData } = await supabase
                        .from('clan_members')
                        .select('*')
                        .eq('clan_id', clan.id)
                        .eq('status', 'ACTIVE')
                        .order('role', { ascending: true });

                    if (memberData) {
                        // Enrich with profile data
                        const enriched = await Promise.all(
                            memberData.map(async (m: any) => {
                                const { data: profile } = await supabase
                                    .from('profiles')
                                    .select('mlbb_id')
                                    .eq('id', m.user_id)
                                    .maybeSingle();

                                const { data: authData } = await supabase
                                    .from('profiles')
                                    .select('id')
                                    .eq('id', m.user_id)
                                    .maybeSingle();

                                return {
                                    ...m,
                                    username: profile?.mlbb_id || m.user_id.slice(0, 8),
                                    mlbb_id: profile?.mlbb_id
                                };
                            })
                        );
                        setMembers(enriched);
                    }
                }
            } else {
                setMyClan(null);
                setMembers([]);
            }
        } catch (err) {
            console.error('Error loading clan:', err);
        }
        setLoading(false);
    };

    const handleCreateClan = async () => {
        if (!clanName.trim() || !clanTag.trim()) {
            showNotification('Preencha nome e tag do clã!', 'warning');
            return;
        }
        if (clanTag.length < 2 || clanTag.length > 5) {
            showNotification('A tag deve ter entre 2 e 5 caracteres!', 'warning');
            return;
        }

        setLoading(true);
        try {
            // Create clan
            const { data: newClan, error: clanErr } = await supabase
                .from('clans')
                .insert({
                    name: clanName.trim(),
                    tag: clanTag.trim().toUpperCase(),
                    logo_emoji: clanEmoji,
                    owner_id: user.id
                })
                .select()
                .single();

            if (clanErr) throw clanErr;

            // Add owner as first member
            await supabase
                .from('clan_members')
                .insert({
                    clan_id: newClan.id,
                    user_id: user.id,
                    role: 'OWNER',
                    status: 'ACTIVE'
                });

            showNotification(`Clã [${clanTag.toUpperCase()}] ${clanName} criado com sucesso!`, 'success');
            setShowCreateModal(false);
            setClanName('');
            setClanTag('');
            await loadClanData();
        } catch (err: any) {
            showNotification('Erro ao criar clã: ' + err.message, 'error');
        }
        setLoading(false);
    };

    const handleInviteMember = async () => {
        if (!inviteEmail.trim()) {
            showNotification('Digite o e-mail do jogador!', 'warning');
            return;
        }
        if (!myClan) return;

        setLoading(true);
        try {
            // Find user by email (look in auth via profiles)
            // Since we can't query auth.users directly, we look by email pattern
            // Let's search by mlbb_id or by matching profiles table
            const { data: foundUsers } = await supabase
                .from('profiles')
                .select('id, mlbb_id')
                .ilike('mlbb_id', `%${inviteEmail.trim()}%`);

            if (!foundUsers || foundUsers.length === 0) {
                // Try searching in auth metadata (email)
                showNotification('Jogador não encontrado! Verifique o Nick MLBB.', 'error');
                setLoading(false);
                return;
            }

            const targetUser = foundUsers[0];

            // Check if already in clan
            const { data: existing } = await supabase
                .from('clan_members')
                .select('id')
                .eq('clan_id', myClan.id)
                .eq('user_id', targetUser.id)
                .maybeSingle();

            if (existing) {
                showNotification('Este jogador já está no clã!', 'warning');
                setLoading(false);
                return;
            }

            // Check if user is in another clan
            const { data: otherClan } = await supabase
                .from('clan_members')
                .select('id')
                .eq('user_id', targetUser.id)
                .eq('status', 'ACTIVE')
                .maybeSingle();

            if (otherClan) {
                showNotification('Este jogador já está em outro clã!', 'warning');
                setLoading(false);
                return;
            }

            // Add as member
            const { error } = await supabase
                .from('clan_members')
                .insert({
                    clan_id: myClan.id,
                    user_id: targetUser.id,
                    role: 'MEMBER',
                    status: 'ACTIVE'
                });

            if (error) throw error;

            showNotification(`${targetUser.mlbb_id || 'Jogador'} adicionado ao clã!`, 'success');
            setShowInviteModal(false);
            setInviteEmail('');
            await loadClanData();
        } catch (err: any) {
            showNotification('Erro ao convidar: ' + err.message, 'error');
        }
        setLoading(false);
    };

    const handleKickMember = async (memberId: string, memberName: string) => {
        if (!myClan || myClan.owner_id !== user.id) return;

        const { error } = await supabase
            .from('clan_members')
            .delete()
            .eq('id', memberId);

        if (!error) {
            showNotification(`${memberName} removido do clã.`, 'info');
            await loadClanData();
        }
    };

    const handleLeaveClan = async () => {
        if (!myClan) return;

        if (myClan.owner_id === user.id) {
            // Owner leaving = delete clan
            await supabase.from('clan_members').delete().eq('clan_id', myClan.id);
            await supabase.from('clans').delete().eq('id', myClan.id);
            showNotification('Clã deletado.', 'info');
        } else {
            await supabase
                .from('clan_members')
                .delete()
                .eq('clan_id', myClan.id)
                .eq('user_id', user.id);
            showNotification('Você saiu do clã.', 'info');
        }
        setMyClan(null);
        setMembers([]);
    };

    const handleBrowseClans = async () => {
        const { data: clans } = await supabase
            .from('clans')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (clans) {
            const enriched = await Promise.all(clans.map(async (c: any) => {
                const { count } = await supabase
                    .from('clan_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('clan_id', c.id)
                    .eq('status', 'ACTIVE');

                return {
                    ...c,
                    member_count: count || 0,
                    owner_name: c.owner_id.slice(0, 8)
                };
            }));
            setPublicClans(enriched);
        }
        setShowBrowseModal(true);
    };

    const handleJoinClan = async (clanId: string) => {
        try {
            const { error } = await supabase
                .from('clan_members')
                .insert({
                    clan_id: clanId,
                    user_id: user.id,
                    role: 'MEMBER',
                    status: 'ACTIVE'
                });

            if (error) throw error;

            showNotification('Você entrou no clã!', 'success');
            setShowBrowseModal(false);
            await loadClanData();
        } catch (err: any) {
            showNotification('Erro ao entrar: ' + err.message, 'error');
        }
    };

    const isOwner = myClan?.owner_id === user?.id;
    const myRole = members.find(m => m.user_id === user?.id)?.role || 'MEMBER';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-[#C9A050] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // ========== NO CLAN VIEW ==========
    if (!myClan) {
        return (
            <div className="space-y-8 animate-fade-in relative z-10">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-4xl font-black italic tracking-tighter text-white">MEU <span className="text-[#C9A050]">CLÃ</span></h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Monte seu esquadrão • Domine a Arena</p>
                    </div>
                    <HelpButton
                        title="Sistema de Clã"
                        content={
                            <>
                                <p><strong>Crie um Clã</strong> e convide seus amigos para jogar juntos no modo 5v5!</p>
                                <p><strong>Benefícios:</strong> Time fixo, comunicação rápida, e reputação na plataforma.</p>
                            </>
                        }
                    />
                </div>

                <div className="bg-[#0F1523] p-10 rounded-[3rem] border border-white/5 text-center relative overflow-hidden">
                    {/* Decorative */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-[#C9A050]/5 blur-[100px] -z-0" />
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500/5 blur-[80px] -z-0" />

                    <div className="relative z-10">
                        <div className="text-7xl mb-6">🛡️</div>
                        <h3 className="text-2xl font-black italic text-white mb-2">Você ainda não tem um Clã</h3>
                        <p className="text-slate-500 text-sm mb-10 max-w-sm mx-auto">Crie seu próprio clã e convide jogadores, ou entre em um clã existente!</p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex-1 bg-[#C9A050] text-black font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg shadow-[#C9A050]/20"
                            >
                                🛡️ Criar Meu Clã
                            </button>
                            <button
                                onClick={handleBrowseClans}
                                className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:scale-105 transition-all border border-white/10"
                            >
                                🔍 Buscar Clãs
                            </button>
                        </div>
                    </div>
                </div>

                {/* Create Clan Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
                        <div className="bg-[#0F1523] p-8 rounded-[3rem] border border-white/10 w-full max-w-md relative">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="absolute top-6 right-8 text-slate-500 hover:text-white font-black"
                            >
                                X
                            </button>

                            <h3 className="text-2xl font-black italic text-center mb-8">CRIAR <span className="text-[#C9A050]">CLÃ</span></h3>

                            <div className="space-y-6">
                                {/* Emoji Selector */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Emblema do Clã</label>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {emojis.map(e => (
                                            <button
                                                key={e}
                                                onClick={() => setClanEmoji(e)}
                                                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${clanEmoji === e
                                                    ? 'bg-[#C9A050]/20 border-2 border-[#C9A050] scale-110'
                                                    : 'bg-slate-900 border border-white/5 hover:scale-105'
                                                    }`}
                                            >
                                                {e}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Clan Name */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Nome do Clã</label>
                                    <input
                                        type="text"
                                        value={clanName}
                                        onChange={e => setClanName(e.target.value)}
                                        placeholder="Ex: Guerreiros da Noite"
                                        maxLength={30}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-[#C9A050] outline-none"
                                    />
                                </div>

                                {/* Clan Tag */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Tag (2-5 letras)</label>
                                    <input
                                        type="text"
                                        value={clanTag}
                                        onChange={e => setClanTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                        placeholder="Ex: NTB"
                                        maxLength={5}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-black text-center tracking-[0.3em] focus:border-[#C9A050] outline-none"
                                    />
                                </div>

                                {/* Preview */}
                                <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 text-center">
                                    <p className="text-[9px] text-slate-600 uppercase mb-2">Preview</p>
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="text-3xl">{clanEmoji}</span>
                                        <div>
                                            <p className="text-white font-black">[{clanTag || '???'}] {clanName || 'Meu Clã'}</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCreateClan}
                                    disabled={!clanName.trim() || !clanTag.trim()}
                                    className="w-full bg-[#C9A050] text-black font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    FUNDAR CLÃ 🛡️
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Browse Clans Modal */}
                {showBrowseModal && (
                    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
                        <div className="bg-[#0F1523] p-8 rounded-[3rem] border border-white/10 w-full max-w-lg relative max-h-[80vh] overflow-y-auto">
                            <button
                                onClick={() => setShowBrowseModal(false)}
                                className="absolute top-6 right-8 text-slate-500 hover:text-white font-black"
                            >
                                X
                            </button>

                            <h3 className="text-2xl font-black italic text-center mb-8">CLÃS <span className="text-[#C9A050]">DISPONÍVEIS</span></h3>

                            {publicClans.length === 0 ? (
                                <p className="text-center text-slate-500 py-10">Nenhum clã criado ainda. Seja o primeiro!</p>
                            ) : (
                                <div className="space-y-3">
                                    {publicClans.map(c => (
                                        <div key={c.id} className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex items-center justify-between hover:border-[#C9A050]/30 transition-all">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{c.logo_emoji}</span>
                                                <div>
                                                    <p className="text-white font-black text-sm">[{c.tag}] {c.name}</p>
                                                    <p className="text-[10px] text-slate-500">{c.member_count} membros</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleJoinClan(c.id)}
                                                className="bg-[#C9A050] text-black font-black px-4 py-2 rounded-xl text-[10px] uppercase hover:scale-105 transition-all"
                                            >
                                                ENTRAR
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ========== HAS CLAN VIEW ==========
    return (
        <div className="space-y-6 animate-fade-in relative z-10">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter text-white">MEU <span className="text-[#C9A050]">CLÃ</span></h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Monte seu esquadrão • Domine a Arena</p>
                </div>
                <HelpButton
                    title="Gerenciar Clã"
                    content={
                        <>
                            <p><strong>Dono do Clã:</strong> Pode convidar e remover membros.</p>
                            <p><strong>Membros:</strong> Podem sair do clã a qualquer momento.</p>
                            <p><strong>5v5:</strong> Quando criar uma sala 5v5, o nome do clã será usado automaticamente!</p>
                        </>
                    }
                />
            </div>

            {/* Clan Card */}
            <div className="bg-[#0F1523] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden">
                {/* Decorative BG */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-[#C9A050]/5 blur-[120px] -z-0" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] -z-0" />

                <div className="relative z-10">
                    {/* Clan Identity */}
                    <div className="flex items-center gap-5 mb-8">
                        <div className="w-20 h-20 bg-slate-900 rounded-[1.5rem] border-2 border-[#C9A050] flex items-center justify-center text-4xl shadow-lg shadow-[#C9A050]/10">
                            {myClan.logo_emoji}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-[#C9A050]/10 text-[#C9A050] px-2 py-0.5 rounded text-[10px] font-black">{myClan.tag}</span>
                                {isOwner && <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded text-[10px] font-black">👑 DONO</span>}
                            </div>
                            <h3 className="text-2xl font-black italic text-white">{myClan.name}</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{members.length}/10 Membros</p>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3 mb-8">
                        <div className="bg-black/30 rounded-2xl p-4 text-center border border-white/5">
                            <p className="text-[9px] text-slate-500 uppercase font-black">Membros</p>
                            <p className="text-2xl font-black text-[#C9A050]">{members.length}</p>
                        </div>
                        <div className="bg-black/30 rounded-2xl p-4 text-center border border-white/5">
                            <p className="text-[9px] text-slate-500 uppercase font-black">Rank</p>
                            <p className="text-2xl font-black text-white">--</p>
                        </div>
                        <div className="bg-black/30 rounded-2xl p-4 text-center border border-white/5">
                            <p className="text-[9px] text-slate-500 uppercase font-black">Vitórias</p>
                            <p className="text-2xl font-black text-emerald-400">--</p>
                        </div>
                    </div>

                    {/* Members List */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Membros do Time</h4>
                            {isOwner && (
                                <button
                                    onClick={() => setShowInviteModal(true)}
                                    className="bg-[#C9A050] text-black font-black px-4 py-2 rounded-xl text-[10px] uppercase hover:scale-105 transition-all"
                                >
                                    + Convidar
                                </button>
                            )}
                        </div>

                        <div className="space-y-2">
                            {members.map((m, i) => (
                                <div
                                    key={m.id}
                                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${m.role === 'OWNER'
                                        ? 'bg-[#C9A050]/5 border border-[#C9A050]/20'
                                        : 'bg-slate-900/50 border border-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${m.role === 'OWNER'
                                            ? 'bg-[#C9A050] text-black'
                                            : 'bg-slate-800 text-slate-400'
                                            }`}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">{m.username || m.user_id.slice(0, 8)}</p>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] font-black uppercase ${m.role === 'OWNER' ? 'text-[#C9A050]' : 'text-slate-500'}`}>
                                                    {m.role === 'OWNER' ? '👑 DONO' : m.role === 'CAPTAIN' ? '⚔️ CAPITÃO' : '🎮 MEMBRO'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Kick button (only owner can see, and not for themselves) */}
                                    {isOwner && m.user_id !== user.id && (
                                        <button
                                            onClick={() => handleKickMember(m.id, m.username || 'Jogador')}
                                            className="text-red-500/50 hover:text-red-500 text-xs font-black transition-all"
                                            title="Remover do clã"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}

                            {/* Empty slots */}
                            {Array.from({ length: Math.max(0, 5 - members.length) }).map((_, i) => (
                                <div key={`empty-${i}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/20 border border-dashed border-white/5">
                                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-slate-700 text-xs font-black">
                                        {members.length + i + 1}
                                    </div>
                                    <p className="text-slate-700 text-xs italic">Slot vazio — convide um jogador!</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-8">
                        <button
                            onClick={handleLeaveClan}
                            className="flex-1 bg-red-500/10 text-red-400 font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all border border-red-500/20"
                        >
                            {isOwner ? '🗑️ DELETAR CLÃ' : '🚪 SAIR DO CLÃ'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#0F1523] p-8 rounded-[3rem] border border-white/10 w-full max-w-md relative">
                        <button
                            onClick={() => setShowInviteModal(false)}
                            className="absolute top-6 right-8 text-slate-500 hover:text-white font-black"
                        >
                            X
                        </button>

                        <h3 className="text-2xl font-black italic text-center mb-2">CONVIDAR <span className="text-[#C9A050]">MEMBRO</span></h3>
                        <p className="text-center text-slate-500 text-xs mb-8">Busque pelo Nick MLBB do jogador</p>

                        <div className="space-y-6">
                            <input
                                type="text"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                placeholder="Nick MLBB do jogador..."
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-[#C9A050] outline-none"
                            />

                            <button
                                onClick={handleInviteMember}
                                disabled={!inviteEmail.trim()}
                                className="w-full bg-[#C9A050] text-black font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:scale-105 transition-all disabled:opacity-50"
                            >
                                ADICIONAR AO CLÃ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
