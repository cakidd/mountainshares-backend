import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

class StripeService {
  async createCheckoutSession(amount, metadata = {}) {
    const stripe = await stripePromise;
    
    const platformFee = amount * 0.02; // 2% platform fee
    const totalAmount = amount + platformFee;
    
    return stripe.redirectToCheckout({
      lineItems: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'MountainShares Tokens',
            description: `$${amount} worth of MountainShares tokens`,
          },
          unit_amount: Math.round(totalAmount * 100), // Convert to cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      successUrl: `${window.location.origin}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/purchase-cancelled`,
      metadata: {
        tokens_purchase: amount.toString(),
        ...metadata
      }
    });
  }

  async getCheckoutSession(sessionId) {
    // This would typically be called from your backend
    // For now, return the sessionId for status checking
    return { id: sessionId };
  }
}

export default new StripeService();
