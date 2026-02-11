import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ==============================================================================
// CONFIGURAÇÃO DO ASAAS (PREENCHA AQUI)
// ==============================================================================

const ASAAS_API_KEY = "$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmU2ZGUzMDkyLWQ4OTUtNDBlNC04MjE1LWM1YWUxNDc4NTczOTo6JGFhY2hfNzIwNzlhY2YtN2FjNi00NzQyLTkzNzMtMDk1MzVhNmM1MjA0";
const ASAAS_ENV = "production"; // Configurado para Produção

const BASE_URL = ASAAS_ENV === 'sandbox'
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://www.asaas.com/api/v3';

console.log(`Inicializando Asaas Function... Env: ${ASAAS_ENV}`);

serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { amount, cpf, name } = await req.json();

        if (!amount || amount <= 0) {
            throw new Error("Valor inválido");
        }

        // 1. Criar Cliente no Asaas (Simplificado: Cria sempre um novo para este exemplo)
        // O ideal seria verificar se o CPF já existe na base do Asaas antes.
        console.log("Criando cliente no Asaas...");
        const customerRes = await fetch(`${BASE_URL}/customers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': ASAAS_API_KEY
            },
            body: JSON.stringify({
                name: name || "Jogador DueloGG",
                cpfCnpj: cpf
            })
        });
        const customer = await customerRes.json();

        if (customer.errors) {
            // Se der erro (ex: CPF inválido), repassa o erro
            throw new Error(customer.errors[0].description);
        }

        console.log(`Cliente criado: ${customer.id}. Gerando Cobrança...`);

        // 2. Criar Cobrança Pix
        const paymentRes = await fetch(`${BASE_URL}/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': ASAAS_API_KEY
            },
            body: JSON.stringify({
                customer: customer.id,
                billingType: 'PIX',
                value: amount,
                dueDate: new Date().toISOString().split('T')[0], // Hoje
                description: 'Recarga DueloGG'
            })
        });

        // O Asaas retorna o objeto payment, mas o QR Code vem em outra chamada ou campo
        const payment = await paymentRes.json();

        if (payment.errors) {
            throw new Error(payment.errors[0].description);
        }

        // 3. Pegar o QR Code e o "Copia e Cola"
        const qrCodeRes = await fetch(`${BASE_URL}/payments/${payment.id}/pixQrCode`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'access_token': ASAAS_API_KEY
            }
        });
        const qrCodeData = await qrCodeRes.json();

        return new Response(
            JSON.stringify({
                success: true,
                invoiceId: payment.id,
                qrCode: qrCodeData.encodedImage, // Base64 da imagem
                copyPaste: qrCodeData.payload // O código copia e cola
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200
            }
        )

    } catch (error) {
        console.error("Erro na função create-pix:", error.message);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400
            }
        )
    }
})
