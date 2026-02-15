const express = require('express');
const router = express.Router();
const stripe = process.env.STRIPE_SECRET_KEY
    ? require('stripe')(process.env.STRIPE_SECRET_KEY)
    : null;
const requireAuth = require('../../middleware/requireAuth');
const prisma = require('../../prisma/client');

/**
 * POST /api/orders/payment-intent
 * Create a Stripe PaymentIntent for the current user's order
 */
router.post('/payment-intent', requireAuth, async (req, res) => {
    try {
        if (!stripe) {
            return res.status(503).json({
                success: false,
                message: 'Payment service is not configured'
            });
        }

        const { amount, currency = 'inr', orderId } = req.body;

        if (!amount || !orderId) {
            return res.status(400).json({
                success: false,
                message: 'Amount and Order ID are required'
            });
        }

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe expects amount in paise (for INR)
            currency,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                orderId: orderId.toString(),
                userId: req.user.userId.toString()
            }
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
        });
    } catch (err) {
        console.error('Stripe Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment intent',
            error: err.message
        });
    }
});

module.exports = router;
