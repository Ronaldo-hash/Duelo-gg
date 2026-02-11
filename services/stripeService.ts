// Em produção, isso viria do .env (VITE_STRIPE_PUBLIC_KEY)
// e a criação da sessão seria feita no Backend (Edge Function).
// Para o MVP (Test Mode sem Backend), faremos uma simulação robusta.
const STRIPE_TEST_MODE = true;
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

console.log("💳 Stripe Service Initialized with Key:", STRIPE_KEY ? "FOUND" : "MISSING");

interface CheckoutSession {
    id: string;
    url: string;
}

export const createStripeCheckout = async (amount: number, userEmail: string): Promise<CheckoutSession | null> => {
    console.log(`🔒 Stripe: Criando sessão de checkout para R$ ${amount.toFixed(2)} (${userEmail})`);

    // SIMULAÇÃO DE BACKEND (Responde como se fosse o servidor do Stripe)
    if (STRIPE_TEST_MODE) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockSessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                resolve({
                    id: mockSessionId,
                    url: `https://checkout.stripe.com/pay/${mockSessionId}?amount=${amount}`
                    // Nota: Essa URL não funcionaria na realidade sem backend. 
                    // No flow simulado, nós interceptamos o clique ou abrimos um modal próprio.
                });
            }, 1500); // Delay de rede fake
        });
    }

    // AQUI ENTRARIA A CHAMADA REAL PARA SUA EDGE FUNCTION
    // const { data, error } = await supabase.functions.invoke('create-checkout', { body: { amount, email: userEmail } })
    return null;
};

export const checkStripePayment = async (sessionId: string): Promise<'paid' | 'unpaid'> => {
    // SIMULAÇÃO DE VERIFICAÇÃO DE STATUS
    if (STRIPE_TEST_MODE) {
        console.log(`🔎 Stripe: Verificando status da sessão ${sessionId}...`);
        return new Promise((resolve) => {
            setTimeout(() => {
                // Em modo de teste, assumimos sucesso para facilitar.
                // Na vida real, bateríamos na API do Stripe.
                console.log("✅ Stripe: Pagamento Confirmado (Simulado)");
                resolve('paid');
            }, 1000);
        });
    }
    return 'unpaid';
};
