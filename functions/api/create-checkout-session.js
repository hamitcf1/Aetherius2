import Stripe from 'stripe';

export async function onRequestPost({ request, env }) {
    if (!env.STRIPE_SECRET_KEY) {
        return new Response(JSON.stringify({ error: 'Missing Stripe Secret Key' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);

    try {
        const { priceId, successUrl, cancelUrl, customerEmail, userId } = await request.json();

        if (!priceId) {
            return new Response(JSON.stringify({ error: 'Missing priceId' }), { status: 400 });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: customerEmail,
            metadata: {
                userId: userId
            },
            allow_promotion_codes: true,
        });

        return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
