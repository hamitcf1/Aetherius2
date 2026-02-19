import { loadStripe } from '@stripe/stripe-js';

// Make sure to add VITE_STRIPE_PUBLISHABLE_KEY to your .env file
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export const createCheckoutSession = async (priceId: string, userId: string, userEmail?: string) => {
    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripe failed to initialize');

    try {
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                priceId,
                userId,
                customerEmail: userEmail,
                successUrl: window.location.origin + '?payment_success=true',
                cancelUrl: window.location.origin + '?payment_canceled=true',
            }),
        });

        const session = await response.json();
        if (session.error) {
            throw new Error(session.error);
        }

        // Redirect to Stripe Checkout
        const result = await stripe.redirectToCheckout({
            sessionId: session.sessionId,
        });

        if (result.error) {
            throw new Error(result.error.message);
        }
    } catch (error: any) {
        console.error('Checkout error:', error);
        throw error;
    }
};
