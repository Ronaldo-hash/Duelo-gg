import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';

interface AuthProps {
    onLogin: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [mlbbId, setMlbbId] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            mlbb_id: mlbbId // Save to metadata
                        }
                    }
                });
                if (error) throw error;

                // Manually update profile just in case trigger fails or doesn't exist for metadata
                if (data.user) {
                    await supabase.from('profiles').upsert({
                        id: data.user.id,
                        email: email,
                        mlbb_id: mlbbId,
                        balance: 0 // Default
                    });
                }

                setSuccessMsg('Cadastro realizado! Verifique seu e-mail ou faça login.');
                console.log('Signup response:', data);
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                console.log('Login response:', data);
                onLogin();
            }
        } catch (error: any) {
            let msg = error.error_description || error.message || JSON.stringify(error);

            // Translate common errors
            if (msg.includes("Invalid login credentials")) msg = "E-mail ou senha incorretos.";
            if (msg.includes("Email not confirmed")) msg = "Confirme seu e-mail antes de entrar (veja spam).";
            if (msg.includes("User already registered")) msg = "E-mail já cadastrado.";
            if (msg.includes("weak_password")) msg = "A senha deve ter pelo menos 6 caracteres.";

            setErrorMsg(msg);
            console.error('Auth error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-8 bg-cover bg-center relative" style={{ backgroundImage: "url('/cyberpunk_bg.png')" }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-0"></div>
            <div className="relative z-10 w-full flex flex-col items-center">
                <div className="w-24 h-24 bg-[#C9A050] rounded-[2rem] flex items-center justify-center mb-8 shadow-[0_20px_50px_rgba(201,160,80,0.2)]">
                    <svg className="w-12 h-12 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h1 className="text-5xl font-black text-white italic tracking-tighter mb-8">DUELO<span className="text-[#C9A050]">GG</span></h1>

                <div className="w-full max-w-sm bg-[#0F1523] p-8 rounded-[2rem] border border-white/5">
                    <h2 className="text-2xl font-black italic mb-6 text-center">{isSignUp ? 'CRIAR CONTA' : 'LOGIN'}</h2>

                    <form onSubmit={handleAuth} className="space-y-4">
                        {isSignUp && (
                            <div>
                                <input
                                    type="text"
                                    placeholder="Seu Nick no Mobile Legends (Ex: KingSlayer)"
                                    value={mlbbId}
                                    onChange={(e) => setMlbbId(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 text-white text-xs font-bold focus:border-[#C9A050] outline-none transition-all"
                                    required
                                />
                            </div>
                        )}
                        <div>
                            <input
                                type="email"
                                placeholder="Seu melhor e-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 text-white text-xs font-bold focus:border-[#C9A050] outline-none transition-all"
                                required
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                placeholder="Sua senha secreta"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 text-white text-xs font-bold focus:border-[#C9A050] outline-none transition-all"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#C9A050] text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:scale-105 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Processando...' : (isSignUp ? 'Cadastrar' : 'Entrar')}
                        </button>

                        {errorMsg && (
                            <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-xl text-red-300 text-xs">
                                <strong>Erro:</strong> {errorMsg}
                            </div>
                        )}

                        {successMsg && (
                            <div className="mt-4 p-3 bg-green-900/50 border border-green-500 rounded-xl text-green-300 text-xs">
                                {successMsg}
                            </div>
                        )}
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-[#C9A050] transition-all"
                        >
                            {isSignUp ? 'Já tem conta? Fazer Login' : 'Não tem conta? Cadastre-se'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

