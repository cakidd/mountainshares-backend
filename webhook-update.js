// Add this to your webhook function
const jitStrategy = new JITPaymentStrategy(provider, wallet);

app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    const session = event.data.object;
    const amount = parseFloat(session.metadata.tokenAmount);
    const total = parseFloat(session.metadata.totalPaid);
    
    console.log('Debug values:', { amount, total });
    
    // Execute JIT Payment Strategy
    const paymentResult = await jitStrategy.executePayment(total);
    
    if (!paymentResult.success) {
      console.error('Payment strategy failed:', paymentResult);
      res.status(500).send('Payment processing failed - manual review required');
      return;
    }
    
    console.log(`Payment successful via ${paymentResult.method}`);
    
    // Continue with H4H contract call
    console.log('About to call H4H contract...');
    const contractCallTx = await contract.loadGiftCard({
      value: ethers.utils.parseEther("0.0005")
    });
    await contractCallTx.wait();
    
    console.log('✅ JIT payment strategy and token minting completed!');
    res.status(200).send('JIT Success');
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook Error');
  }
});
