const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");

function calcShipping(subtotal) {
  if (subtotal >= 500) return 0;
  return 35;
}

function calcTax(subtotal) {
  return Number((subtotal * 0.07).toFixed(2));
}

exports.createOrder = async (req, res) => {
  try {
    const { items = [], clientRequestId, source = "online" } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order items are required" });
    }

    if (clientRequestId) {
      const existing = await Order.findOne({
        clientRequestId,
        user: req.user.id,
      });

      if (existing) {
        return res.status(200).json(existing);
      }
    }

    const normalizedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const quantity = Number(item.quantity || 0);

      if (!item.productId || quantity <= 0) {
        return res.status(400).json({ message: "Invalid product or quantity" });
      }

      const product = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          stock: { $gte: quantity },
          isActive: true,
        },
        { $inc: { stock: -quantity } },
        { new: true }
      );

      if (!product) {
        return res.status(400).json({
          message: `Insufficient stock for product ${item.productId}`,
        });
      }

      const unitPrice = product.salePrice;
      const lineSubtotal = Number((unitPrice * quantity).toFixed(2));

      subtotal += lineSubtotal;

      normalizedItems.push({
        product: product._id,
        name: product.name,
        unitPrice,
        quantity,
        subtotal: lineSubtotal,
      });
    }

    subtotal = Number(subtotal.toFixed(2));
    const tax = calcTax(subtotal);
    const shipping = calcShipping(subtotal);
    const totalPrice = Number((subtotal + tax + shipping).toFixed(2));

    const order = await Order.create({
      user: req.user.id,
      items: normalizedItems,
      subtotal,
      tax,
      shipping,
      totalPrice,
      status: "paid",
      source,
      clientRequestId: clientRequestId || null,
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({
      message: err.message || "Failed to create order",
    });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate("items.product", "name imageUrl category rarity");

    res.json(orders);
  } catch (err) {
    res.status(500).json({
      message: err.message || "Failed to fetch orders",
    });
  }
};