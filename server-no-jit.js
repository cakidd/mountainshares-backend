const express = require('express');
const { ethers } = require('ethers');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.static('public'));

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || 'https://arbitrum-one-rpc.publicnode.com');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// REMOVE JIT INTEGRATION TEMPORARILY
// const jitStrategy = new JITPaymentStrategy(provider, wallet);

let contract;
try {
  if (process.env.CONTRACT_ABI && process.env.CONTRACT_ADDRESS) {
    const CONTRACT_ABI = JSON.parse(process.env.CONTRACT_ABI);
    contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    console.log('✅ H4H contract loaded successfully');
  }
} catch (error) {
  console.error('Contract setup failed:', error.message);
}

// Your existing routes without JIT...
