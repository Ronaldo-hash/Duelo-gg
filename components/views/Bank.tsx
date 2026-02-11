import React from 'react';
import { useAppStore } from '../../hooks/useAppStore';

import { HelpButton } from '../shared/HelpButton';

export const Bank: React.FC = () => {
    const { balance, history, addToBalance, addHistoryItem, showNotification } = useAppStore();
    const [loading, setLoading] = React.useState(false);
    const [showDepositModal, setShowDepositModal] = React.useState(false);
    const [depositAmount, setDepositAmount] = React.useState('');
    const [pixData, setPixData] = React.useState<{ id?: string | number, copyPaste: string, qrCodeBase64?: string } | null>(null);

    return (
        <div className="space-y-10 animate-fade-in relative z-10">
            <div className="bg-[#0F1523] p-12 rounded-[3.5rem] border border-white/5 text-center shadow-2xl relative">
                <div className="absolute top-8 right-8">
                    <HelpButton
                        title="Sistema Bancário & Integração"
                        content={
                            <>
                                <p><strong>Lógica:</strong> O dinheiro entra aqui via <em>Gateway de Pagamento</em> (Stripe). O saldo é virtual até o usuário sacar.</p>
                                <p><strong>Segurança:</strong> O código conecta em uma API segura. Nenhuma chave fica exposta.</p>
                                <p><strong>Taxas:</strong> O App cobra uma taxa (10%) apenas sobre o prêmio da aposta.</p>
                            </>
                        }
                    />
                </div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-4">Saldo DueloBank</p>
                <h3 className="text-7xl font-black text-white italic tracking-tighter mb-10">R$ {balance.toFixed(2)}</h3>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowDepositModal(true)}
                        className="flex-1 bg-[#635BFF] text-white font-black py-5 rounded-2xl text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#635BFF]/20"
                    >
                        Depositar
                    </button>
                    <button className="flex-1 bg-white/5 border border-white/10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-50 cursor-not-allowed">Sacar</button>
                </div>
            </div>

            {/* Modal de Depósito */}
            {showDepositModal && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#0F1523] p-8 rounded-[3rem] border border-white/10 w-full max-w-md relative">
                        <button
                            onClick={() => { setShowDepositModal(false); setPixData(null); }}
                            className="absolute top-6 right-8 text-slate-500 hover:text-white font-black w-10 h-10 flex items-center justify-center"
                        >
                            X
                        </button>

                        {!pixData ? (
                            <>
                                <h3 className="text-2xl font-black italic text-center mb-8">RECARGA <span className="text-[#635BFF]">STRIPE</span></h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Valor (R$)</label>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(e.target.value)}
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl p-5 text-white font-black text-lg focus:border-[#635BFF] outline-none transition-colors"
                                            placeholder="Ex: 50.00"
                                        />
                                    </div>
                                    <div className="bg-[#635BFF]/10 p-4 rounded-xl border border-[#635BFF]/30">
                                        <p className="text-[10px] text-[#635BFF] font-bold text-center leading-relaxed">
                                            🔒 Pagamento Seguro via Stripe<br />
                                            (Pix, Cartão de Crédito, Apple Pay)
                                        </p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (!depositAmount) return showNotification("Digite um valor!", "warning");
                                            setLoading(true);

                                            // Call Stripe Service
                                            const { createStripeCheckout } = await import('../../services/stripeService');
                                            const session = await createStripeCheckout(parseFloat(depositAmount), 'user@test.com');

                                            if (session) {
                                                setPixData({
                                                    id: session.id,
                                                    copyPaste: session.url,
                                                    qrCodeBase64: undefined
                                                });
                                            }
                                            setLoading(false);
                                        }}
                                        disabled={loading}
                                        className="w-full bg-[#635BFF] text-white font-black py-5 rounded-2xl uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-[#635BFF]/20 touch-manipulation"
                                    >
                                        {loading ? 'CRIANDO SESSÃO...' : 'IR PARA PAGAMENTO'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center space-y-8">
                                <h3 className="text-xl font-black italic text-white text-[#635BFF]">CONFIRME O PAGAMENTO</h3>
                                <div className="bg-white p-6 rounded-2xl inline-block shadow-xl">
                                    {/* Mock Stripe Page Preview */}
                                    <div className="w-56 h-36 bg-[#F1F5F9] flex flex-col items-center justify-center rounded-xl border border-slate-200">
                                        <p className="text-slate-400 font-black text-xs mb-3">Stripe Checkout</p>
                                        <div className="w-32 h-10 bg-[#635BFF] rounded-lg animate-pulse"></div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                                    Estamos simulando que você foi para o site do Stripe e pagou.
                                </p>

                                <button
                                    onClick={async () => {
                                        setLoading(true);
                                        const { checkStripePayment } = await import('../../services/stripeService');
                                        const status = await checkStripePayment(pixData.id as string);

                                        if (status === 'paid') {
                                            addToBalance(parseFloat(depositAmount));
                                            addHistoryItem({
                                                id: Date.now(),
                                                type: 'DEPOSITO',
                                                amount: parseFloat(depositAmount),
                                                date: new Date().toLocaleDateString('pt-BR'),
                                                status: 'CONCLUÍDO'
                                            });
                                            setPixData(null);
                                            setShowDepositModal(false);
                                            setDepositAmount('');
                                            showNotification("Pagamento Stripe Confirmado! Saldo liberado.", "success");
                                        } else {
                                            showNotification("Pagamento ainda pendente.", "info");
                                        }
                                        setLoading(false);
                                    }}
                                    disabled={loading}
                                    className="w-full bg-emerald-500 text-black font-black py-5 rounded-2xl uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 touch-manipulation shadow-lg shadow-emerald-500/20"
                                >
                                    {loading ? 'VERIFICANDO...' : 'CONFIRMAR PAGAMENTO'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Histórico Recente</h4>
                {history.length === 0 ? (
                    <p className="text-center text-xs text-slate-600 py-8">Nenhuma transação recente.</p>
                ) : (
                    history.map(h => (
                        <div key={h.id} className="bg-[#0F1523] p-6 rounded-3xl border border-white/5 flex justify-between items-center">
                            <div className="flex gap-4 items-center">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${h.amount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{h.amount > 0 ? '+' : '-'}</div>
                                <div>
                                    <p className="text-xs font-black italic">{h.type === 'DEPOSITO' ? 'Depósito Pix' : h.type === 'DUELO_WIN' ? 'Vitória em Duelo' : 'Saque Realizado'}</p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase">{h.date} • {h.status}</p>
                                </div>
                            </div>
                            <p className={`text-sm font-black italic ${h.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>R$ {Math.abs(h.amount).toFixed(2)}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
