    // Calculate fees with proper rounding to ensure minimum $1.36
    const loadingFee = amount * 0.02; // 2% loading fee
    const subtotal = amount + loadingFee;
    
    // Calculate Stripe fee and round up to ensure we cover costs
    const stripeFeeExact = (subtotal * 0.029) + 0.30;
    const stripeFee = Math.ceil(stripeFeeExact * 100) / 100; // Round up to nearest cent
    
    const totalAmount = Math.round((subtotal + stripeFee) * 100); // Convert to cents
