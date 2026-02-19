import { loadStripe } from '@stripe/stripe-js';

// Load Stripe for future use (e.g. Elements), but for basic redirects we'll use the session URL
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export const createCheckoutSession = async (priceId: string, userId: string, userEmail?: string) => {
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

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server responded with ${response.status}`);
        }

        const session = await response.json();

        if (session.url) {
            // Modern and most reliable way: redirect directly to the session URL
            window.location.href = session.url;
        } else {
            // Fallback for older Stripe API responses if necessary, 
            // but our backend should always return a URL
            const stripe = await stripePromise;
            if (!stripe) throw new Error('Stripe failed to initialize');

            const result = await (stripe as any).redirectToCheckout({
                sessionId: session.sessionId || session.id,
            });

            if (result.error) {
                throw new Error(result.error.message);
            }
        }
    } catch (error: any) {
        console.error('Checkout error:', error);
        throw error;
    }
};
