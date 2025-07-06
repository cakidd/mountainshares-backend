import React, { useState, useEffect } from 'react';
import StripeService from '../services/stripe-service';
import MountainSharesAPI from '../services/mountainshares-api';

const MountainSharesPurchase = () => {
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState(null);
  const [treasuryPreview, setTreasuryPreview] = useState(null);

  useEffect(() => {
    loadContractInfo();
  }, []);

  useEffect(() => {
    if (amount > 0) {
      loadTreasuryPreview();
    }
  }, [amount]);

  const loadContractInfo = async () => {
    try {
      const contractData = await MountainSharesAPI.getContractInfo();
      setContracts(contractData);
    } catch (error) {
      console.error('Failed to load contract info:', error);
    }
  };

  const loadTreasuryPreview = async () => {
    try {
      const platformFee = amount * 0.02;
      const preview = await MountainSharesAPI.getTreasuryDistribution(platformFee);
      setTreasuryPreview(preview);
    } catch (error) {
      console.error('Failed to load treasury preview:', error);
    }
  };

  const handlePurchase = async () => {
    if (amount < 1) {
      alert('Minimum purchase amount is $1');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await StripeService.createCheckoutSession(amount, {
        contract_address: contracts?.contracts?.mountainSharesToken,
        settlement_reserve: contracts?.contracts?.settlementReserve
      });

      if (error) {
        console.error('Stripe error:', error);
        alert('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const platformFee = amount * 0.02;
  const totalCharge = amount + platformFee;

  return (
    <div className="mountainshares-purchase">
      <div className="purchase-header">
        <h2>🏔️ Purchase MountainShares Tokens</h2>
        <p>Support the H4H ecosystem while earning MountainShares tokens</p>
      </div>

      <div className="purchase-form">
        <div className="amount-input">
          <label htmlFor="amount">Token Amount ($USD):</label>
          <input 
            id="amount"
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(Number(e.target.value))}
            min="1"
            step="1"
            disabled={loading}
          />
        </div>

        <div className="pricing-breakdown">
          <h3>Pricing Breakdown</h3>
          <div className="pricing-item">
            <span>Token Value:</span>
            <span>${amount.toFixed(2)}</span>
          </div>
          <div className="pricing-item">
            <span>Platform Fee (2%):</span>
            <span>${platformFee.toFixed(2)}</span>
          </div>
          <div className="pricing-item total">
            <span>Total Charge:</span>
            <span>${totalCharge.toFixed(2)}</span>
          </div>
        </div>

        {treasuryPreview && (
          <div className="treasury-impact">
            <h3>Your H4H Impact</h3>
            <p>Your ${platformFee.toFixed(2)} platform fee supports:</p>
            <div className="impact-list">
              <div className="impact-item">
                <span>Non-Profit Programs (30%):</span>
                <span>${(platformFee * 0.30).toFixed(2)}</span>
              </div>
              <div className="impact-item">
                <span>Community Programs (15%):</span>
                <span>${(platformFee * 0.15).toFixed(2)}</span>
              </div>
              <div className="impact-item">
                <span>Treasury Operations (30%):</span>
                <span>${(platformFee * 0.30).toFixed(2)}</span>
              </div>
              <div className="impact-item">
                <span>Governance (10%):</span>
                <span>${(platformFee * 0.10).toFixed(2)}</span>
              </div>
              <div className="impact-item">
                <span>Development (15%):</span>
                <span>${(platformFee * 0.15).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <button 
          className="purchase-button"
          onClick={handlePurchase} 
          disabled={loading || amount < 1}
        >
          {loading ? 'Processing...' : `Purchase $${amount} Tokens`}
        </button>
      </div>

      {contracts && (
        <div className="contract-info">
          <h3>Smart Contract Information</h3>
          <div className="contract-item">
            <span>MountainShares Token:</span>
            <span className="address">{contracts.contracts.mountainSharesToken}</span>
          </div>
          <div className="contract-item">
            <span>Settlement Reserve:</span>
            <span className="address">{contracts.contracts.settlementReserve}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MountainSharesPurchase;
