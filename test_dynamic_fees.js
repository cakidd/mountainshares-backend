const calculateRegionalFee = (subtotal, cardCountry = 'US', currency = 'USD') => {
    let regionalFee = 0;
    
    if (cardCountry !== 'US') {
        regionalFee += subtotal * 0.015;
    }
    
    if (currency !== 'USD') {
        regionalFee += subtotal * 0.01;
    }
    
    const minBuffer = subtotal * 0.005;
    regionalFee = Math.max(regionalFee, minBuffer);
    
    return Math.ceil(regionalFee * 100) / 100;
};

// Test scenarios
const testCases = [
    { amount: 1, country: 'US', currency: 'USD', desc: '$1 US Card' },
    { amount: 1, country: 'CA', currency: 'USD', desc: '$1 Canadian Card' },
    { amount: 100, country: 'US', currency: 'USD', desc: '$100 US Card' },
    { amount: 100, country: 'UK', currency: 'GBP', desc: '$100 UK Card + Currency' },
];

testCases.forEach(test => {
    const loadingFee = test.amount * 0.02;
    const subtotal = test.amount + loadingFee;
    const stripeFeeExact = (subtotal * 0.029) + 0.30;
    const stripeFee = Math.ceil(stripeFeeExact * 100) / 100;
    const regionalFee = calculateRegionalFee(subtotal, test.country, test.currency);
    const total = subtotal + stripeFee + regionalFee;
    
    console.log(`${test.desc}:`);
    console.log(`  Regional Fee: $${regionalFee.toFixed(2)}`);
    console.log(`  Total: $${total.toFixed(2)}`);
    console.log('');
});
