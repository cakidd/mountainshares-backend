// Add this to top of server.js to debug JIT loading
try {
  console.log('🔍 Attempting to load JIT modules...');
  const { JITPaymentStrategy } = require('./jit-payment-strategy');
  console.log('✅ JITPaymentStrategy loaded successfully');
  
  const jitStrategy = new JITPaymentStrategy(provider, wallet);
  console.log('✅ JIT strategy initialized successfully');
  
} catch (error) {
  console.error('❌ JIT module loading failed:', error.message);
  console.error('❌ JIT files missing or have import errors');
}
