import React, { useState, useEffect } from 'react';
import MountainSharesAPI from '../services/mountainshares-api';

const CustomerDashboard = ({ customerId }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [contracts, setContracts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [customerId]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [dashboard, contractInfo] = await Promise.all([
        MountainSharesAPI.getCustomerDashboard(customerId),
        MountainSharesAPI.getContractInfo()
      ]);

      setDashboardData(dashboard);
      setContracts(contractInfo);
    } catch (error) {
      console.error('Dashboard load failed:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        <p>Loading your MountainShares dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-icon">❌</div>
        <h2>Dashboard Error</h2>
        <p>{error}</p>
        <button className="retry-button" onClick={refreshData}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="customer-dashboard">
      <div className="dashboard-header">
        <h1>🏔️ MountainShares Dashboard</h1>
        <button className="refresh-button" onClick={refreshData}>
          🔄 Refresh
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="token-balance-card">
          <h2>Token Balance</h2>
          <div className="balance-amount">
            ${dashboardData?.tokenBalance?.toFixed(2) || '0.00'}
          </div>
          <p className="balance-subtitle">MountainShares Tokens</p>
          
          {contracts?.contracts?.mountainSharesToken && (
            <div className="contract-address">
              <span className="label">Token Contract:</span>
              <span className="address">{contracts.contracts.mountainSharesToken}</span>
            </div>
          )}
        </div>

        <div className="settlement-info-card">
          <h2>Settlement Reserve</h2>
          <div className="settlement-details">
            <p>Your tokens are backed by USDC in the Settlement Reserve</p>
            {contracts?.contracts?.settlementReserve && (
              <div className="contract-address">
                <span className="label">Reserve Contract:</span>
                <span className="address">{contracts.contracts.settlementReserve}</span>
              </div>
            )}
          </div>
        </div>

        <div className="transaction-history-card">
          <h2>Transaction History</h2>
          {dashboardData?.transactions?.length > 0 ? (
            <div className="transaction-list">
              {dashboardData.transactions.map(tx => (
                <div key={tx.id} className="transaction-item">
                  <div className="transaction-main">
                    <span className="transaction-amount">${tx.amount}</span>
                    <span className="transaction-date">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="transaction-details">
                    <span className="transaction-status">{tx.status}</span>
                    <span className="transaction-id">{tx.id}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-transactions">
              <p>No transactions yet</p>
              <button 
                className="purchase-button"
                onClick={() => window.location.href = '/purchase'}
              >
                Make Your First Purchase
              </button>
            </div>
          )}
        </div>

        <div className="h4h-impact-card">
          <h2>Your H4H Impact</h2>
          <p>Every purchase supports these causes:</p>
          <div className="impact-breakdown">
            <div className="impact-item">
              <span className="cause">Non-Profit Programs</span>
              <span className="percentage">30%</span>
            </div>
            <div className="impact-item">
              <span className="cause">Community Programs</span>
              <span className="percentage">15%</span>
            </div>
            <div className="impact-item">
              <span className="cause">Treasury Operations</span>
              <span className="percentage">30%</span>
            </div>
            <div className="impact-item">
              <span className="cause">Governance</span>
              <span className="percentage">10%</span>
            </div>
            <div className="impact-item">
              <span className="cause">Development</span>
              <span className="percentage">15%</span>
            </div>
          </div>
          
          {dashboardData?.totalContributed && (
            <div className="total-contribution">
              <strong>Total Contributed: ${dashboardData.totalContributed.toFixed(2)}</strong>
            </div>
          )}
        </div>

        <div className="treasury-addresses-card">
          <h2>Treasury Addresses</h2>
          <div className="address-list">
            {contracts?.treasury && Object.entries(contracts.treasury).map(([key, address]) => (
              <div key={key} className="address-item">
                <span className="address-label">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </span>
                <span className="address-value">{address}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
