const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

class MountainSharesAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.headers,
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async getContractInfo() {
    return this.request('/api/contracts');
  }

  async checkTransactionStatus(sessionId) {
    return this.request(`/api/transaction-status?sessionId=${sessionId}`);
  }

  async getTreasuryDistribution(amount) {
    return this.request('/api/contracts/treasury', {
      method: 'POST',
      body: JSON.stringify({
        amount: amount,
        transactionType: 'preview',
        transactionHash: 'preview'
      })
    });
  }

  async getCustomerDashboard(customerId) {
    return this.request(`/api/customer-dashboard?customerId=${customerId}`);
  }
}

export default new MountainSharesAPI();
