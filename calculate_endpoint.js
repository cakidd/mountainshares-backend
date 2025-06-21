
// Add calculate-purchase endpoint
app.post('/calculate-purchase', async (req, res) => {
  try {
    const { quantity } = req.body;
    
    // Calculate pricing
    const tokenPrice = 1.00; // $1 per token
    const subtotal = quantity * tokenPrice;
    const processingFee = 0.30 + (subtotal * 0.029); // Stripe fees
    const platformFee = subtotal * 0.02; // 2% platform fee
    const total = subtotal + processingFee + platformFee;
    
    res.json({
      success: true,
      pricing: {
        quantity,
        tokenPrice,
        subtotal,
        processingFee,
        platformFee,
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
