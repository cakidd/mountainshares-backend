        const loadingFee = amount * 0.02;
        const subtotal = amount + loadingFee;
        const stripeFee = (subtotal * 0.029) + 0.30;
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        unit_amount: Math.round(subtotal * 100),
                        product_data: {
                            name: 'MountainShares Tokens',
                            description: `${amount} tokens + $${loadingFee.toFixed(2)} loading fee`,
                        },
                    },
                    quantity: 1,
                },
                {
                    price_data: {
                        currency: 'usd',
                        unit_amount: Math.round(stripeFee * 100),
                        product_data: {
                            name: 'Processing Fee',
                            description: 'Card processing fee',
                        },
                    },
                    quantity: 1,
                }
            ],
