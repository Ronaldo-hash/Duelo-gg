
const ASAAS_URL = import.meta.env.VITE_ASAAS_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_KEY = import.meta.env.VITE_ASAAS_API_KEY;

export const createPixCharge = async (amount: number, description: string, customerId?: string) => {
    // Basic validation
    if (!ASAAS_KEY || ASAAS_KEY.includes('YOUR_ASAAS')) {
        console.warn("Asaas Key missing. Returning Mock Data.");
        return {
            id: `pay_${Date.now()}`,
            netValue: amount,
            status: 'PENDING',
            invoiceUrl: 'https://sandbox.asaas.com/invoice/preview/mock',
            pixQrCode: '00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913Asaas Mock6008Brasilia62070503***6304E2CA',
            pixImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        };
    }

    try {
        const response = await fetch(`${ASAAS_URL}/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': ASAAS_KEY
            },
            body: JSON.stringify({
                customer: customerId || 'cus_000005164890', // Default mock customer if none provided
                billingType: 'PIX',
                value: amount,
                dueDate: new Date().toISOString().split('T')[0],
                description: description
            })
        });

        const data = await response.json();

        // If success, we also need the QR Code payload (separate endpoint usually, but check API)
        // For Asaas, after creating payment, we get ID. Then fetch QR Code.
        if (data.id) {
            const qrResponse = await fetch(`${ASAAS_URL}/payments/${data.id}/pixQrCode`, {
                headers: { 'access_token': ASAAS_KEY }
            });
            const qrData = await qrResponse.json();
            return { ...data, pixQrCode: qrData.payload, pixImage: qrData.encodedImage };
        }

        return data;

    } catch (error) {
        console.error("Asaas Error:", error);
        return null;
    }
};
