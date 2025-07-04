import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MountainSharesAPI from '../services/mountainshares-api';

const PurchaseSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('processing');
  const [transaction, setTransaction] = useState(null);
  const [error, setError] = useState(null);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setError('No session ID provided');
      return;
    }

    checkTransactionStatus();
  }, [sessionId]);

  const checkTransactionStatus = async () => {
    try {
      const result = await MountainSharesAPI.checkTransactionStatus(sessionId);
      
      if (result.processed && result.transaction) {
        setStatus('completed');
        setTransaction(result.transaction);
      } else {
        // Continue polling for up to 30 attempts (1 minute)
        if (pollCount < 30) {
          setPollCount(prev => prev + 1);
          setTimeout(checkTransactionStatus, 2000);
        } else {
          setStatus('timeout');
          setError('Transaction processing timed out. Please contact support.');
        }
      }
    } catch (error) {
      console.error('Status check failed:', error);
      setStatus('error');
      setError('Failed to check transaction status. Please contact support.');
    }
  };

  const renderProcessingState = () => (
    <div className="processing-state">
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
      <h2>🏔️ Processing Your MountainShares Purchase</h2>
      <p>Your payment was successful! We're now:</p>
      <ul className="processing-steps">
        <li>✅ Payment confirmed by Stripe</li>
        <li>🔄 Allocating your MountainShares tokens</li>
        <li>🔄 Distributing platform fees to H4H treasury</li>
        <li>🔄 Securing funds in Settlement Reserve</li>
        <li>🔄 Updating your account balance</li>
      </ul>
      <p className="processing-note">
        This usually takes 5-10 seconds. Please don't close this page.
      </p>
      <p className="poll-info">Check #{pollCount + 1}/30</p>
    </div>
  );

  const renderCompletedState = () => (
    <div className="completed-state">
      <div className="success-icon">✅</div>
      <h2>Purchase Complete!</h2>
      
      <div className="transaction-summary">
        <h3>Transaction Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="label">Tokens Purchased:</span>
            <span className="value">${transaction.tokensPurchased}</span>
          </div>
          <div className="summary-item">
            <span className="label">Platform Fee:</span>
            <span className="value">${transaction.platformFee}</span>
          </div>
          <div className="summary-item">
            <span className="label">Settlement Amount:</span>
            <span className="value">${transaction.settlementAmount} USDC</span>
          </div>
          <div className="summary-item">
            <span className="label">Transaction ID:</span>
            <span className="value transaction-id">{transaction.id}</span>
          </div>
        </div>
      </div>

      <div className="h4h-impact">
        <h3>Your Impact on H4H</h3>
        <p>Your ${transaction.platformFee} platform fee was distributed to:</p>
        <div className="impact-grid">
          <div className="impact-item">
            <span className="cause">Non-Profit Programs</span>
            <span className="amount">${(transaction.platformFee * 0.30).toFixed(2)}</span>
            <span className="percentage">30%</span>
          </div>
          <div className="impact-item">
            <span className="cause">Community Programs</span>
            <span className="amount">${(transaction.platformFee * 0.15).toFixed(2)}</span>
            <span className="percentage">15%</span>
          </div>
          <div className="impact-item">
            <span className="cause">Treasury Operations</span>
            <span className="amount">${(transaction.platformFee * 0.30).toFixed(2)}</span>
            <span className="percentage">30%</span>
          </div>
          <div className="impact-item">
            <span className="cause">Governance</span>
            <span className="amount">${(transaction.platformFee * 0.10).toFixed(2)}</span>
            <span className="percentage">10%</span>
          </div>
          <div className="impact-item">
            <span className="cause">Development</span>
            <span className="amount">${(transaction.platformFee * 0.15).toFixed(2)}</span>
            <span className="percentage">15%</span>
          </div>
        </div>
      </div>

      <div className="next-steps">
        <h3>What's Next?</h3>
        <ul>
          <li>Your tokens have been allocated to your account</li>
          <li>Settlement Reserve has been updated with USDC backing</li>
          <li>You can view your balance in the dashboard</li>
          <li>Transaction details are available in your history</li>
        </ul>
      </div>

      <div className="action-buttons">
        <button 
          className="primary-button"
          onClick={() => window.location.href = '/dashboard'}
        >
          View Dashboard
        </button>
        <button 
          className="secondary-button"
          onClick={() => window.location.href = '/purchase'}
        >
          Purchase More Tokens
        </button>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="error-state">
      <div className="error-icon">❌</div>
      <h2>Processing Error</h2>
      <p>{error}</p>
      <div className="error-details">
        <p><strong>Session ID:</strong> {sessionId}</p>
        <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
      </div>
      <div className="error-actions">
        <button 
          className="primary-button"
          onClick={() => window.location.href = '/support'}
        >
          Contact Support
        </button>
        <button 
          className="secondary-button"
          onClick={() => window.location.href = '/purchase'}
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="purchase-success">
      {status === 'processing' && renderProcessingState()}
      {status === 'completed' && renderCompletedState()}
      {(status === 'error' || status === 'timeout') && renderErrorState()}
    </div>
  );
};

export default PurchaseSuccess;
