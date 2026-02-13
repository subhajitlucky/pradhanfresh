const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const { updateOrderStatus } = require('../../utils/order/operations/update');

// Stripe uses raw body for signature verification
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  // In a real app, you'd use stripe.webhooks.constructEvent
  // For this project, we'll simulate the webhook event processing
  try {
    const body = JSON.parse(req.body.toString());
    event = body;

    console.log(`🔔 Webhook received: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;
        
        if (orderId) {
          await prisma.order.update({
            where: { id: parseInt(orderId) },
            data: { 
              paymentStatus: 'COMPLETED',
              status: 'CONFIRMED'
            }
          });
          console.log(`✅ Payment succeeded for order ${orderId}`);
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        const failedOrderId = failedIntent.metadata.orderId;
        
        if (failedOrderId) {
          await prisma.order.update({
            where: { id: parseInt(failedOrderId) },
            data: { paymentStatus: 'FAILED' }
          });
          console.log(`❌ Payment failed for order ${failedOrderId}`);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

module.exports = router;
