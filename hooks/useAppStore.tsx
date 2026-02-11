import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { FoundationFile, Match, MatchPlayer } from '../types';

export interface Transaction {
    id: number;
    type: 'DEPOSITO' | 'SAQUE' | 'DUELO_WIN' | 'DUELO_LOSS' | 'DUELO_ENTRY';
    amount: number;
    date: string;
    status: string;
}

// Interfaces moved to types.ts

export interface AppContextType {
    balance: number;
    escrow: number;
    activeMatches: Match[];
    history: Transaction[];
    foundationFiles: FoundationFile[];
    setEscrow: React.Dispatch<React.SetStateAction<number>>;
    setFoundationFiles: React.Dispatch<React.SetStateAction<FoundationFile[]>>;
    addToBalance: (amount: number) => void;
    subtractBalance: (amount: number) => void;
    addMatch: (match: Omit<Match, 'id'>) => Promise<void>;
    joinMatch: (matchId: number, stake: number, password?: string) => Promise<boolean>;
    joinTeam5v5: (matchId: number, teamSide: 'A' | 'B', stake: number) => Promise<boolean>;
    uploadProof: (matchId: number, file: File) => Promise<boolean>;
    approveMatch: (matchId: number, winnerId: string) => Promise<boolean>;
    removeMatch: (id: number) => void;
    addHistoryItem: (item: Transaction) => void;
    user: any;
    isAdmin: boolean;
    resetMatches: () => Promise<void>;
    cancelMatch: (matchId: number) => Promise<void>;
    notification: { message: string, type: 'success' | 'error' | 'info' | 'warning' } | null;
    showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [balance, setBalance] = useState(0);
    const [escrow, setEscrow] = useState(0);
    const [activeMatches, setActiveMatches] = useState<Match[]>([]);
    const [history, setHistory] = useState<Transaction[]>([]);
    const [foundationFiles, setFoundationFiles] = useState<FoundationFile[]>([]);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    // Initialize Auth and Data Fetching
    useEffect(() => {
        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserData(session.user.id);
                fetchMatches(session.user.id);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserData(session.user.id);
                fetchMatches(session.user.id);
            } else {
                setBalance(0);
                setActiveMatches([]);
            }
        });

        // Listen for Realtime Match Updates
        const matchDetails = supabase
            .channel('public:matches')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, (payload) => {
                console.log('Realtime Match Update:', payload);
                if (user?.id) fetchMatches(user.id); // Refresh list
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
            supabase.removeChannel(matchDetails);
        };
    }, [user?.id]);

    const fetchUserData = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('balance, verification_status, mlbb_id')
                .eq('id', userId)
                .single();

            if (data) {
                setBalance(data.balance || 0);
                // We can add verificationStatus to the user object or a separate state if needed.
                // For now, let's update the user object with this profile info.
                setUser((prev: any) => ({ ...prev, ...data }));
            }
            if (error) console.error('Error fetching profile:', error);

            // Fetch history
            const { data: txData } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (txData) {
                setHistory(txData.map((tx: any) => ({
                    id: tx.id,
                    type: tx.type,
                    amount: tx.amount,
                    date: new Date(tx.created_at).toLocaleDateString('pt-BR'),
                    status: tx.status
                })));
            }

        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchMatches = async (currentUserId?: string) => {
        try {
            const targetId = currentUserId || user?.id;

            // 1. Fetch Matches first (without join to avoid FK errors)
            const { data: matchesData, error: matchError } = await supabase
                .from('matches')
                .select('*, match_players(*)')
                .in('status', ['ABERTO', 'EM_ANDAMENTO', 'ANALISANDO_IA', 'EM_ANALISE'])
                .order('created_at', { ascending: false });

            if (matchError) {
                console.error("Error fetching matches:", matchError);
                return;
            }

            if (matchesData) {
                // 2. Fetch Creator AND Opponent Profiles manually
                const creatorIds = matchesData.map((m: any) => m.creator_id).filter(Boolean);
                const opponentIds = matchesData.map((m: any) => m.opponent_id).filter(Boolean);
                const allUserIds = Array.from(new Set([...creatorIds, ...opponentIds]));

                let profilesMap: Record<string, any> = {};

                if (allUserIds.length > 0) {
                    const { data: profilesData } = await supabase
                        .from('profiles')
                        .select('id, mlbb_id, email')
                        .in('id', allUserIds);

                    if (profilesData) {
                        profilesData.forEach((p: any) => {
                            profilesMap[p.id] = p;
                        });
                    }
                }

                // 3. Merge Data
                const formattedMatches: Match[] = matchesData.map((m: any) => {
                    let displayName = 'Desafiante';
                    let gameId = '';

                    // Resolve Creator Name
                    const creatorProfile = profilesMap[m.creator_id];
                    if (m.creator_id === targetId) {
                        displayName = 'Você';
                        gameId = creatorProfile?.mlbb_id || '';
                    } else if (creatorProfile?.mlbb_id) {
                        displayName = creatorProfile.mlbb_id;
                        gameId = creatorProfile.mlbb_id;
                    } else if (creatorProfile?.email) {
                        displayName = creatorProfile.email.split('@')[0];
                    }

                    // Resolve Opponent Name
                    let opponentName = 'Aguardando...';
                    let opponentGameId = '';
                    const opponentProfile = profilesMap[m.opponent_id];
                    if (m.opponent_id) {
                        if (m.opponent_id === targetId) {
                            opponentName = 'Você';
                            opponentGameId = opponentProfile?.mlbb_id || '';
                        } else if (opponentProfile?.mlbb_id) {
                            opponentName = opponentProfile.mlbb_id;
                            opponentGameId = opponentProfile.mlbb_id;
                        } else if (opponentProfile?.email) {
                            opponentName = opponentProfile.email.split('@')[0];
                        }
                    }

                    return {
                        id: m.id,
                        player: displayName,
                        game_id: gameId,
                        opponent_name: opponentName,
                        opponent_game_id: opponentGameId,
                        rank: 'Mítico',
                        stake: m.stake,
                        reward: m.stake * 1.8,
                        winRate: '50%',
                        mode: m.mode ? (m.mode === '5v5' ? '5v5 PERSONALIZADA' : (m.mode === '1v1' ? '1v1 SOLO' : m.mode)) : 'SOLO 1V1',
                        status: m.status,
                        creator_id: m.creator_id,
                        opponent_id: m.opponent_id,
                        password: m.password
                    };
                });
                setActiveMatches(formattedMatches);
            }
        } catch (error) {
            console.error('Error fetching matches:', error);
        }
    };

    const addToBalance = async (amount: number) => {
        if (!user) return;
        setBalance(prev => prev + amount); // Optimistic update

        // Update DB
        const { error } = await supabase.from('profiles').update({ balance: balance + amount }).eq('id', user.id);
        if (error) console.error("Error updating balance:", error);
    };

    const subtractBalance = async (amount: number) => {
        if (!user) return;
        setBalance(prev => prev - amount); // Optimistic update

        // Update DB
        const { error } = await supabase.from('profiles').update({ balance: balance - amount }).eq('id', user.id);
        if (error) console.error("Error updating balance:", error);
    };

    const hasActiveMatch = (userId: string) => {
        return activeMatches.some(m =>
            (m.creator_id === userId || (m as any).opponent_id === userId) &&
            ['ABERTO', 'EM_ANDAMENTO', 'ANALISANDO_IA', 'EM_ANALISE'].includes(m.status)
        );
    };

    const addMatch = async (match: Omit<Match, 'id'>): Promise<number | null> => {
        if (!user) return null;
        if (hasActiveMatch(user.id)) {
            showNotification("Você já tem uma partida ativa!", "error");
            return null;
        }

        // VALIDATION: User MUST have MLBB ID set
        if (!user.mlbb_id) {
            showNotification("ATENÇÃO: Você precisa definir seu Nick do Mobile Legends no Perfil antes de criar!", "warning");
            return null;
        }

        try {
            // Create in DB
            const { data, error } = await supabase.from('matches').insert([{
                creator_id: user.id,
                stake: match.stake,
                mode: match.mode,
                status: 'ABERTO',
                password: match.password || null,
                team_name: match.team_name || null,
                opponent_name: match.opponent_name || null // Persist target opponent
            }]).select();

            if (error) {
                console.error("Supabase Error:", error);
                showNotification(`Erro ao criar desafio: ${error.message}`, "error");
                return null;
            }

            if (data) {
                const matchId = data[0].id;

                // 2. AUTO-ADD CREATOR TO ROSTER (If 5v5 or even 1v1 to track participants unifiedly?)
                // For now, specifically for 5v5 to fix the "Empty Slot" bug
                if (match.mode.includes('5v5')) {
                    await supabase.from('match_players').insert([{
                        match_id: matchId,
                        user_id: user.id,
                        username: user.mlbb_id, // Use actual MLBB nick
                        team_side: 'A',
                        role: 'CAPTAIN',
                        status: 'PAID'
                    }]);
                } else {
                    // 1v1 Logic - Also add to roster for consistency if desired, or relying on legacy columns
                    // For 1v1, legacy columns (creator_id) are main source, but roster is good for unified view.
                    // IMPORTANT: If we add to roster for 1v1, we must ensure UI doesn't duplicate.
                    // Current MatchCard logic uses 'match_players' if present. 
                    // Let's add for 1v1 too so 'My Matches' filter works perfectly for created 1v1s too via roster check.
                    await supabase.from('match_players').insert([{
                        match_id: matchId,
                        user_id: user.id,
                        username: user.mlbb_id,
                        team_side: 'A',
                        role: 'CAPTAIN',
                        status: 'PAID'
                    }]);
                }

                // Refresh Matches
                await fetchMatches();
                return matchId;
            }
        } catch (error) {
            console.error("Error creating match:", error);
            showNotification("Erro interno ao criar partida.", "error");
        }
        return null;
    };

    const joinMatch = async (matchId: number, stake: number, password?: string) => {
        if (!user) return false;
        if (hasActiveMatch(user.id)) {
            alert("Você já tem uma partida em andamento!");
            return false;
        }

        // Password Validation (Client-side for MVP)
        const match = activeMatches.find(m => m.id === matchId);
        if (match?.password) {
            if (match.password !== password) {
                alert("Senha da sala incorreta!");
                return false;
            }
        }

        // Optimistic update
        setBalance(prev => prev - stake);

        // Update Match in DB
        const { data, error } = await supabase
            .from('matches')
            .update({ opponent_id: user.id, status: 'EM_ANDAMENTO' })
            .eq('id', matchId)
            .select();

        if (error || !data || data.length === 0) {
            console.error("Error joining match (DB):", error || "No rows updated");
            alert("Erro ao entrar na partida. Verifique se ela ainda está disponível.");
            setBalance(prev => prev + stake); // Revert on error
            return false;
        }

        // Update Balance in DB
        await supabase.from('profiles').update({ balance: balance - stake }).eq('id', user.id);

        // Refresh matches
        await fetchMatches();
        return true;
    };

    const joinTeam5v5 = async (matchId: number, teamSide: 'A' | 'B', stake: number): Promise<boolean> => {
        if (!user) return false;
        if (balance < stake) {
            showNotification("Saldo insuficiente para entrar no time.", "error");
            return false;
        }

        // VALIDATION: User MUST have MLBB ID set
        if (!user.mlbb_id) {
            showNotification("ATENÇÃO: Você precisa definir seu Nick do Mobile Legends no Perfil antes de jogar!", "warning");
            // Optionally redirect to profile? For now just warning.
            return false;
        }

        // Check if already joined
        const match = activeMatches.find(m => m.id === matchId);
        if (match?.match_players?.some(p => p.user_id === user.id)) {
            showNotification("Você já está nesta partida!", "warning");
            return false;
        }

        try {
            setBalance(prev => prev - stake); // Optimistic

            // Insert into match_players
            const { error: joinError } = await supabase.from('match_players').insert([{
                match_id: matchId,
                user_id: user.id,
                username: user.mlbb_id, // USE EXACT MLBB NICK
                team_side: teamSide,
                role: 'MEMBER',
                status: 'PAID'
            }]);

            if (joinError) throw joinError;

            // Deduct Balance
            await supabase.from('profiles').update({ balance: balance - stake }).eq('id', user.id);

            showNotification(`Entrou com o nick: ${user.mlbb_id}`, "success");
            await fetchMatches();
            return true;
        } catch (error) {
            console.error("Error joining team:", error);
            setBalance(prev => prev + stake); // Revert
            showNotification("Erro ao entrar no time.", "error");
            return false;
        }
    };

    const uploadProof = async (matchId: number, file: File) => {
        if (!user) return false;

        try {
            const fileName = `${matchId}_${user.id}_${Date.now()}`;
            const { data, error } = await supabase.storage
                .from('match-proofs')
                .upload(fileName, file);

            if (error) throw error;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage.from('match-proofs').getPublicUrl(fileName);

            // Update Match with Proof
            await supabase
                .from('matches')
                .update({
                    proof_url: publicUrl,
                    winner_id: user.id,
                    status: 'ANALISANDO_IA' // New Status for AI
                })
                .eq('id', matchId);

            // Optimistic UI Update
            setActiveMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'ANALISANDO_IA' } : m));

            // REAL AI OCR PROCESSING
            try {
                // Convert File to Base64 for Gemini
                const fileToBase64 = (file: File): Promise<string> => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = error => reject(error);
                    });
                };

                const base64Image = await fileToBase64(file);

                // Import dynamically to avoid circular dependencies
                const { validateMatchResult } = await import('../services/geminiService');

                console.log("🤖 IA: Analisando imagem com Gemini...");
                const result = await validateMatchResult(base64Image);
                console.log("🤖 IA Resultado:", result);

                if (result.victory) {
                    console.log("🤖 IA: Vitória confirmada! Aprovando...");
                    await approveMatch(matchId, user.id);
                } else {
                    console.log("🤖 IA: Inconclusivo ou Derrota. Enviando para Admin.");
                    await supabase.from('matches').update({ status: 'EM_ANALISE' }).eq('id', matchId);
                    // Update local state
                    setActiveMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'EM_ANALISE' } : m));
                }

            } catch (err) {
                console.error("AI Error", err);
                await supabase.from('matches').update({ status: 'EM_ANALISE' }).eq('id', matchId);
                setActiveMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'EM_ANALISE' } : m));
            }


            return true;
        } catch (error) {
            console.error("Error uploading proof:", error);
            return false;
        }
    };

    const approveMatch = async (matchId: number, winnerId: string) => {
        // Admin Function
        const { error } = await supabase
            .from('matches')
            .update({ status: 'FINALIZADO' })
            .eq('id', matchId);

        if (error) {
            console.error("Error approving match:", error);
            return false;
        }

        // Transfer funds to winner
        const match = activeMatches.find(m => m.id === matchId);
        if (match) {
            // In a real transactional system, we would move form Escrow -> User.
            // Here we optimize: simply add reward to winner user.
            // (Assuming 'balance' in database was already deducted on entry)

            // We need to fetch current winner balance first or use RPC increment.
            // Client-side increment is risky but fine for MVP.
            const { data: winnerProfile } = await supabase.from('profiles').select('balance').eq('id', winnerId).single();
            if (winnerProfile) {
                await supabase.from('profiles').update({ balance: winnerProfile.balance + match.reward }).eq('id', winnerId);
            }
        }

        // Refresh
        fetchMatches();
        return true;
    };

    const removeMatch = (id: number) => {
        setActiveMatches(prev => prev.filter(m => m.id !== id));
    };

    const addHistoryItem = async (item: Transaction) => {
        // Save to Supabase first
        const { error } = await supabase.from('transactions').insert({
            user_id: user?.id,
            type: item.type,
            amount: item.amount,
            status: item.status
        });

        if (error) {
            console.error("Error saving transaction:", error);
            return;
        }

        // Update local state
        setHistory(prev => [item, ...prev]);
    };

    const resetMatches = async () => {
        if (!user) return;

        // Update all matches to CANCELADO
        const { error } = await supabase
            .from('matches')
            .update({ status: 'CANCELADO' })
            .in('status', ['ABERTO', 'EM_ANDAMENTO', 'ANALISANDO_IA', 'EM_ANALISE']);

        if (error) {
            console.error("Error resetting matches:", error);
            showNotification("Erro ao limpar partidas.", "error");
        } else {
            console.log("All matches cancelled.");
            setActiveMatches([]);
        }
    };

    const cancelMatch = async (matchId: number) => {
        if (!user) return showNotification("Erro: Usuário não logado.", "error");

        // Optimistic UI: Notify immediately
        showNotification(`Cancelando aposta #${matchId}...`, "info");

        try {
            // Optimistic Refund (Fast feedback)
            const match = activeMatches.find(m => m.id === matchId);
            if (match) setBalance(prev => prev + match.stake);

            // DB Update
            const { error } = await supabase
                .from('matches')
                .update({ status: 'CANCELADO' })
                .eq('id', matchId);

            if (error) {
                showNotification(`Erro no Banco: ${error.message}`, "error");
                // Revert
                if (match) setBalance(prev => prev - match.stake);
            } else {
                await supabase.from('profiles').update({ balance: balance + (match?.stake || 0) }).eq('id', user.id);
                setActiveMatches(prev => prev.filter(m => m.id !== matchId));
                showNotification("Aposta cancelada e valor estornado!", "success");
            }
        } catch (e) {
            showNotification("Erro inesperado ao cancelar.", "error");
        }
    };

    // Simple Admin Check (For MVP)
    // In production, this should check a column in the 'profiles' table (e.g., is_admin)
    // For now, we allow the specific dev email OR run in 'dev mode' (always true for this user session if we want)
    // Let's protect it slightly:
    // Simple Admin Check (Locked to specific email)
    const isAdmin = user?.email === 'admin@duelo.gg';

    return (
        <AppContext.Provider value={{
            balance, escrow, setEscrow, activeMatches, history, foundationFiles, setFoundationFiles,
            addToBalance, subtractBalance, addMatch, joinMatch, joinTeam5v5, uploadProof, approveMatch, removeMatch, addHistoryItem, user,
            isAdmin, resetMatches, cancelMatch, notification, showNotification
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppStore = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppStore must be used within an AppProvider');
    return context;
};
