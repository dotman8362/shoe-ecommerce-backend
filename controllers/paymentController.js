import axios from "axios";
import Order from "../models/Order.js";
import dotenv from "dotenv";
import Product from "../models/Product.js";
import crypto from "crypto";

dotenv.config();

// Check for Paystack secret key
if (!process.env.PAYSTACK_SECRET_KEY) {
  console.error("FATAL: PAYSTACK_SECRET_KEY is not set");
}

export const initializePayment = async (req, res) => {
  console.log("=== PAYMENT INITIALIZATION REQUEST ===");
  console.log("Email:", req.body?.email);
  console.log("Cart length:", req.body?.cart?.length);
  
  const { email, cart, shipping } = req.body;

  // Validation
  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    console.log("❌ Validation failed: Cart is empty or invalid");
    return res.status(400).json({ success: false, message: "Cart is empty or invalid" });
  }

  if (!shipping?.name || !shipping?.email || !shipping?.phone || !shipping?.address) {
    console.log("❌ Validation failed: Incomplete shipping details");
    return res.status(400).json({ success: false, message: "Incomplete shipping details" });
  }

  if (!email) {
    console.log("❌ Validation failed: Email is required");
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  // Email validation
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: "Valid email is required" });
  }

  console.log("✅ Validation passed, processing payment...");
  
  try {
    const productIds = cart.map(item => item._id);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
      return res.status(400).json({ success: false, message: "One or more products not found" });
    }

    const serverCart = cart.map(item => {
      const product = products.find(p => p._id.toString() === item._id.toString());
      if (!product) throw new Error(`Product not found: ${item._id}`);
      if (!item.quantity || item.quantity < 1) throw new Error(`Invalid quantity for: ${item._id}`);
      
      return {
        _id: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image,
      };
    });

    const serverTotal = serverCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const amountInKobo = Math.round(serverTotal * 100);
    const reference = `jofta_${crypto.randomBytes(16).toString("hex")}`;

    const paystackRes = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amountInKobo,
        reference,
        metadata: {
          expectedAmountKobo: amountInKobo,
          customerName: shipping.name,
          phone: shipping.phone,
          shipping,
          cart: serverCart,
        },
      },
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      }
    );

    if (!paystackRes.data.status) {
      return res.status(502).json({ success: false, message: "Paystack initialisation failed" });
    }

    await Order.create({
      customerName: shipping.name,
      email: shipping.email,
      phone: shipping.phone,
      items: serverCart,
      shipping,
      total: serverTotal,
      paymentReference: reference,
      status: "pending",
    });

    return res.status(200).json({
      success: true,
      reference,
      amount: amountInKobo,
      authorization_url: paystackRes.data.data.authorization_url,
    });

  } catch (error) {
    console.error("[initializePayment] Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const paystackWebhook = async (req, res) => {
  const signature = req.headers["x-paystack-signature"];

  if (!signature) {
    return res.status(400).json({ message: "Missing signature header" });
  }

  const computedHash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(req.body)
    .digest("hex");

  if (computedHash !== signature) {
    return res.status(401).json({ message: "Invalid signature" });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).json({ message: "Malformed JSON" });
  }

  if (event.event === "charge.success") {
    const data = event.data;

    try {
      // ✅ Validate amount FIRST
      const expectedAmountKobo = data.metadata?.expectedAmountKobo;
      if (!expectedAmountKobo || data.amount !== expectedAmountKobo) {
        console.error(`[Webhook] Amount mismatch on ref ${data.reference}`);
        return res.status(200).send("OK");
      }

      // ✅ Find or create order
      let order = await Order.findOne({ paymentReference: data.reference });
      
      if (!order) {
        // Create order from webhook data
        order = await Order.create({
          customerName: data.metadata?.customerName,
          email: data.customer?.email,
          phone: data.metadata?.phone,
          items: data.metadata?.cart || [],
          shipping: data.metadata?.shipping,
          total: data.amount / 100,
          paymentReference: data.reference,
          status: "paid",
          source: "webhook",
          paymentDetails: {
            amount: data.amount / 100,
            paidAt: new Date(),
            transactionId: data.id,
            channel: data.channel,
            reference: data.reference,
          },
        });
        console.log(`[Webhook] Created new order for ref: ${data.reference}`);
      }
      
      if (order.status === "paid") {
        console.log(`[Webhook] Order ${data.reference} already paid, skipping`);
        return res.status(200).send("OK");
      }

      // ✅ Update order status (NO STOCK DEDUCTION)
      order.status = "paid";
      order.paymentDetails = {
        amount: data.amount / 100,
        paidAt: new Date(),
        transactionId: data.id,
        channel: data.channel,
        reference: data.reference,
      };
      await order.save();

      console.log(`[Webhook] Order ${order._id} marked as paid`);
    } catch (err) {
      console.error("[Webhook] Error:", err);
      // Still return 200 to prevent Paystack retries
    }
  }

  return res.status(200).send("OK");
};

export const verifyPayment = async (req, res) => {
  const { reference, cart, shipping } = req.body;

  if (!reference || !shipping || !cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const existingOrder = await Order.findOne({ paymentReference: reference });
    if (existingOrder && existingOrder.status === "paid") {
      return res.status(200).json({
        success: true,
        message: "Order already processed",
        order: existingOrder,
      });
    }

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    const paymentData = response.data.data;

    if (paymentData.status !== "success") {
      return res.status(400).json({ success: false, message: "Payment not successful" });
    }

    const serverTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const expectedAmountKobo = Math.round(serverTotal * 100);

    if (paymentData.amount !== expectedAmountKobo) {
      console.error(`[Verify] Amount mismatch on ref ${reference}`);
      return res.status(400).json({ success: false, message: "Payment amount mismatch" });
    }

    // ✅ Update or create order (NO STOCK DEDUCTION)
    let order = await Order.findOne({ paymentReference: reference });
    
    if (order) {
      order.status = "paid";
      order.paymentDetails = {
        amount: paymentData.amount / 100,
        paidAt: new Date(),
        transactionId: paymentData.id,
        channel: paymentData.channel,
      };
      await order.save();
    } else {
      order = await Order.create({
        customerName: shipping.name,
        email: shipping.email,
        phone: shipping.phone,
        items: cart,
        shipping,
        total: serverTotal,
        paymentReference: reference,
        status: "paid",
        source: "callback",
        paymentDetails: {
          amount: paymentData.amount / 100,
          paidAt: new Date(),
          transactionId: paymentData.id,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order saved successfully",
      order,
    });

  } catch (error) {
    console.error("[Verify] Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get order status helper endpoint
export const getOrderStatus = async (req, res) => {
  const { reference } = req.params;
  
  try {
    const order = await Order.findOne({ paymentReference: reference });
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    return res.status(200).json({
      success: true,
      status: order.status,
      order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
