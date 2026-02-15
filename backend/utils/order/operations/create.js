const prisma = require('../../../prisma/client');
const { generateOrderNumber, calculateOrderTotals, calculateItemSubtotal, updateProductStock, calculateDeliveryFee } = require('../../orderUtils');

/**
 * Create order from cart with transaction safety
 */
const createOrderFromCart = async (orderData, cart) => {
  const {
    userId,
    deliveryAddress,
    deliveryDate,
    deliverySlot,
    paymentMethod,
    orderNotes,
    discount
  } = orderData;

  return await prisma.$transaction(async (prisma) => {
    // Generate unique order number
    const orderNumber = await generateOrderNumber();

    // Calculate delivery fee
    const deliveryFee = calculateDeliveryFee(deliveryAddress.pincode, cart.totalAmount);

    // Calculate order totals
    const orderTotals = calculateOrderTotals(cart.items, {
      deliveryFee,
      tax: 18, // 18% GST
      discount
    });

    // Create order
    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        status: 'PENDING',
        totalAmount: orderTotals.totalAmount,
        subtotal: orderTotals.subtotal,
        deliveryFee: orderTotals.deliveryFee,
        tax: orderTotals.tax,
        discount: orderTotals.discount,
        paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
        deliveryAddress: JSON.stringify(deliveryAddress),
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        deliverySlot,
        orderNotes
      }
    });

    // Create order items
    const orderItems = [];
    for (const cartItem of cart.items) {
      const itemSubtotal = calculateItemSubtotal(cartItem.quantity, cartItem.price);
      
      const orderItem = await prisma.orderItem.create({
        data: {
          orderId: newOrder.id,
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          price: cartItem.price,
          subtotal: itemSubtotal
        }
      });
      
      orderItems.push(orderItem);
    }

    // Update product stock
    await updateProductStock(cart.items, 'REDUCE');

    // Clear user's cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        totalAmount: 0,
        updatedAt: new Date()
      }
    });

    return newOrder;
  });
};

module.exports = {
  createOrderFromCart
};
