import WalletService from './services/wallet-service.js';
import MountainSharesAPI from './services/mountainshares-api.js';

class MountainSharesApp {
  constructor() {
    this.currentTab = 'feed';
    this.walletConnected = false;
    this.init();
  }

  init() {
    console.log('🚀 THE COMMONS BUSINESS NETWORK LOADED 🚀');
    console.log('🏔️ West Virginia Digital Business Revolution');
    console.log('Backend URL:', process.env.REACT_APP_BACKEND_URL);
    console.log('💎 MountainShares integration ready');

    this.setupEventListeners();
    this.checkExistingConnection();
  }

  setupEventListeners() {
    // Tab switching
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-tab]')) {
        const tab = e.target.getAttribute('data-tab');
        this.switchTab(tab);
      }
    });

    // Wallet connection
    document.addEventListener('click', (e) => {
      if (e.target.matches('.wallet-connect-btn')) {
        this.handleWalletConnection();
      }
    });
  }

  switchTab(tab) {
    console.log('Switching to tab:', tab);
    this.currentTab = tab;
    
    // Update UI
    document.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = 'none';
    });
    
    const activeContent = document.querySelector(`[data-tab-content="${tab}"]`);
    if (activeContent) {
      activeContent.style.display = 'block';
    }

    // Update active tab styling
    document.querySelectorAll('[data-tab]').forEach(tabBtn => {
      tabBtn.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`[data-tab="${tab}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
    }
  }

  async checkExistingConnection() {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const result = await WalletService.connectWallet();
          if (result.success) {
            this.walletConnected = true;
            this.updateWalletUI(result.address);
          }
        } else {
          console.log('No existing connection found');
        }
      }
    } catch (error) {
      console.error('Connection check failed:', error);
    }
  }

  async handleWalletConnection() {
    try {
      const result = await WalletService.connectWallet();
      
      if (result.success) {
        this.walletConnected = true;
        this.updateWalletUI(result.address);
        console.log('✅ Wallet connected successfully');
      } else {
        console.error('❌ Wallet connection failed:', result.error);
        this.showError('Wallet connection failed: ' + result.error);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      this.showError('Wallet connection failed: ' + error.message);
    }
  }

  updateWalletUI(address) {
    const walletBtn = document.querySelector('.wallet-connect-btn');
    if (walletBtn) {
      walletBtn.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
      walletBtn.classList.add('connected');
    }

    const walletStatus = document.querySelector('.wallet-status');
    if (walletStatus) {
      walletStatus.textContent = 'Connected';
      walletStatus.classList.add('connected');
    }
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f8d7da;
      color: #721c24;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #f5c6cb;
      z-index: 1000;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.mountainSharesApp = new MountainSharesApp();
});

export default MountainSharesApp;
