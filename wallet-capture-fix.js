// Enhanced wallet capture function
async function createStripeSession(amount) {
  // Ensure wallet is connected
  if (!window.ethereum) {
    alert('Please install MetaMask!');
    return;
  }
  
  // Get connected wallet address
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  const customerWallet = accounts[0];
  
  if (!customerWallet) {
    alert('Please connect your wallet first!');
    return;
  }
  
  console.log('Customer wallet:', customerWallet);
  
  // Create Stripe session with wallet address
  const response = await fetch('/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: amount,
      customerWallet: customerWallet  // ← CRITICAL FIX!
    })
  });
  
  const session = await response.json();
  window.location.href = session.url;
}
