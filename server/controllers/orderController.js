const Order = require("../models/Order");
const Product = require("../models/Product");

function calcShipping(subtotal) {
  if (subtotal >= 500) return 0;
  return 35;
}

function calcTax(subtotal) {
  return Number((subtotal * 0.07).toFixed(2));
}

async function rollbackDeductedItems(deductedItems) {
  if (!deductedItems.length) return;

  for (const deducted of deductedItems) {
    try {
      await Product.findByIdAndUpdate(deducted.productId, {
        $inc: { stock: deducted.quantity },
      });
    } catch (rollbackErr) {
      console.error("Rollback failed for product:", deducted.productId, rollbackErr);
    }
  }
}

exports.createOrder = async (req, res) => {
  console.log("CREATE_ORDER_HIT", {
    userId: req.user?.id,
    clientRequestId: req.body?.clientRequestId,
    items: req.body?.items,
    time: Date.now(),
  });

  const deductedItems = [];
  const { items = [], clientRequestId, source = "online" } = req.body || {};

  try {
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order items are required" });
    }

    // idempotency check ก่อนเริ่ม
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
      const quantity = Number(item?.quantity || 0);

      if (!item?.productId || quantity <= 0) {
        throw new Error("Invalid product or quantity");
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
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }

      deductedItems.push({
        productId: product._id,
        quantity,
      });

      const unitPrice = Number(product.salePrice);
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
    //throw new Error("Force order create fail");
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

    return res.status(201).json(order);
  } catch (err) {
    // สำคัญมาก: ถ้ามี stock ถูกหักไปแล้ว ต้อง rollback ก่อนเสมอ
    if (deductedItems.length > 0) {
      await rollbackDeductedItems(deductedItems);
    }

    // หลัง rollback แล้วค่อย handle duplicate request
    if (err?.code === 11000 && clientRequestId) {
      const existing = await Order.findOne({
        clientRequestId,
        user: req.user.id,
      });

      if (existing) {
        return res.status(200).json(existing);
      }
    }

    const message = err?.message || "Failed to create order";

    if (
      message.includes("Insufficient stock") ||
      message === "Invalid product or quantity"
    ) {
      return res.status(400).json({ message });
    }

    return res.status(400).json({ message });
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