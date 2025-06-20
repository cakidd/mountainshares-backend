        const loadingFee = amount * 0.02;
        const subtotal = amount + loadingFee;
        const stripeFee = (subtotal * 0.029) + 0.30;
        const finalTotal = subtotal + stripeFee;
        const totalCents = Math.round(finalTotal * 100);

        console.log(`💳 DEBUG: amount=${amount}, loadingFee=${loadingFee}, subtotal=${subtotal}, stripeFee=${stripeFee}, finalTotal=${finalTotal}, totalCents=${totalCents}`);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: currency,
                    unit_amount: totalCents,
                    product_data: {
                        name: "MountainShares Tokens",
                        description: `${amount} tokens + $${loadingFee.toFixed(2)} loading fee + $${stripeFee.toFixed(2)} processing fee`,
                    },
                },
                quantity: 1,
            }],
