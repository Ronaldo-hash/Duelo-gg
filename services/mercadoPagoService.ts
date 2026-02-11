
const MP_ACCESS_TOKEN = import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN;

export const createPixPayment = async (amount: number, description: string, email: string) => {
    // 1. Mock Fallback (Se não tiver chave configurada)
    if (!MP_ACCESS_TOKEN || MP_ACCESS_TOKEN.includes('YOUR_MP')) {
        console.warn("Mercado Pago Key missing. Returning Mock Data.");
        return {
            id: `mock_${Date.now()}`,
            status: 'pending',
            qr_code: '00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913MercadoPago Mock6008Brasilia62070503***6304E2CA',
            qr_code_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            ticket_url: 'https://www.mercadopago.com.br'
        };
    }

    // 2. Real API Call
    try {
        const response = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': `pay_${Date.now()}`
            },
            body: JSON.stringify({
                transaction_amount: amount,
                description: description,
                payment_method_id: 'pix',
                payer: {
                    email: email,
                    first_name: 'Usuário',
                    last_name: 'DueloGG'
                }
            })
        });

        const data = await response.json();

        if (data.status === 400 || data.error) {
            console.error("MP Error:", data);
            throw new Error(data.message || "Erro no Mercado Pago");
        }

        return {
            id: data.id,
            status: data.status,
            qr_code: data.point_of_interaction?.transaction_data?.qr_code,
            qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64,
            ticket_url: data.point_of_interaction?.transaction_data?.ticket_url
        };

    } catch (error) {
        console.error("Mercado Pago Service Error:", error);
        return null;
    }
};

export const getPaymentStatus = async (paymentId: string | number) => {
    // 1. Mock Fallback
    if (!MP_ACCESS_TOKEN || MP_ACCESS_TOKEN.includes('YOUR_MP')) {
        console.log("Mock Check Status: Auto-approving for demo.");
        return 'approved';
    }

    try {
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
            }
        });
        const data = await response.json();
        return data.status; // approved, pending, rejected
    } catch (error) {
        console.error("MP Status Error", error);
        return 'pending';
    }
};
