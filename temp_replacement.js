app.post('/calculate-purchase', async (req, res) => {
  try {
    const { quantity } = req.body;

    // Calculate pricing based on REAL Stripe behavior
    const tokenPrice = 1.00; // $1 per token
    const subtotal = quantity * tokenPrice;

    // Stripe rounds UP to nearest cent (as proven by Carrie's transaction)
    const stripeProcessingFee = Math.ceil((0.30 + (subtotal * 0.029)) * 100) / 100;

    // Your 2% platform fee (also round up to ensure coverage)
    const platformFee = Math.ceil((subtotal * 0.02) * 100) / 100;

    const total = subtotal + stripeProcessingFee + platformFee;

    res.json({
      success: true,
      pricing: {
        quantity,
        tokenPrice,
        subtotal,
        processingFee: stripeProcessingFee,
        platformFee,
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
