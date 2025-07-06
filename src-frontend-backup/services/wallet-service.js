class WalletService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
  }

  async connectWallet() {
    try {
      // Check if ethers is available
      if (typeof ethers === 'undefined') {
        throw new Error('Ethers.js library not loaded');
      }

      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask not installed');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Create provider and signer
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();
      this.address = await this.signer.getAddress();

      console.log('✅ Wallet connected:', this.address);
      return {
        success: true,
        address: this.address,
        provider: this.provider,
        signer: this.signer
      };

    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getBalance() {
    if (!this.provider || !this.address) {
      throw new Error('Wallet not connected');
    }

    const balance = await this.provider.getBalance(this.address);
    return ethers.utils.formatEther(balance);
  }

  async switchToNetwork(chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      return true;
    } catch (error) {
      console.error('Network switch failed:', error);
      return false;
    }
  }

  disconnect() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    console.log('🔌 Wallet disconnected');
  }
}

export default new WalletService();
