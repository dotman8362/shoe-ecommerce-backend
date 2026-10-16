// controllers/paymentController.js
import axios from "axios";
import Order from "../models/Order.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import crypto from "crypto";
import { client, urlFor } from "../lib/sanity.js";

dotenv.config();

if (!process.env.PAYSTACK_SECRET_KEY) {
  console.error("FATAL: PAYSTACK_SECRET_KEY is not set");
}

const EXPECTED_CURRENCY = "NGN";
const MAX_QTY_PER_ITEM = 20;

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ---------------------------------------------------------------
// INITIALIZE
// ---------------------------------------------------------------
export const initializePayment = async (req, res) => {
  console.log("=== PAYMENT INITIALIZATION REQUEST ===");
  const { email, cart, shipping } = req.body;

  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ success: false, message: "Cart is empty or invalid" });
  }
  if (!shipping?.name || !shipping?.email || !shipping?.phone || !shipping?.address) {
    return res.status(400).json({ success: false, message: "Incomplete shipping details" });
  }
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ success: false, message: "Valid email is required" });
  }

  // Quantity validation
  for (const item of cart) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QTY_PER_ITEM) {
      return res.status(400).json({
        success: false,
        message: `Invalid quantity for item ${item._id}`,
      });
    }
  }

  try {
    // ✅ Resolve both legacy Mongo ObjectIds AND Sanity _ids
    const productIds = cart.map((item) => item._id);
    const mongoIds = productIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const sanityIds = productIds.filter((id) => !mongoose.Types.ObjectId.isValid(id));

    const [legacyProducts, sanityProducts] = await Promise.all([
      mongoIds.length
        ? client.fetch(
            `*[_type == "product" && legacyMongoId in $ids] { _id, name, price, image, legacyMongoId }`,
            { ids: mongoIds }
          )
        : [],
      sanityIds.length
        ? client.fetch(
            `*[_type == "product" && _id in $ids] { _id, name, price, image, legacyMongoId }`,
            { ids: sanityIds }
          )
        : [],
    ]);

    const products = [...legacyProducts, ...sanityProducts];

    if (products.length !== productIds.length) {
      return res.status(400).json({ success: false, message: "One or more products not found" });
    }

    const serverCart = cart.map((item) => {
      const product = products.find(
        (p) =>
          p._id === item._id ||
          p.legacyMongoId === item._id ||
          p._id === `product-${item._id}`
      );
      if (!product) throw new Error(`Product not found: ${item._id}`);

      return {
        _id: product._id,        // Sanity _id from now on
        name: product.name,
        price: product.price,    // trusted — from Sanity, not browser
        quantity: item.quantity,
        image: urlFor(product.image) || null,
      };
    });

    const serverTotal = serverCart.reduce((s, i) => s + i.price * i.quantity, 0);
    const amountInKobo = Math.round(serverTotal * 100);
    const reference = `jofta_${crypto.randomBytes(16).toString("hex")}`;

    const paystackRes = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amountInKobo,
        reference,
        currency: EXPECTED_CURRENCY,
        metadata: {
          expectedAmountKobo: amountInKobo,
          expectedCurrency: EXPECTED_CURRENCY,
          customerName: shipping.name,
          phone: shipping.phone,
          shipping,
          cart: serverCart,
        },
      },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
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
      source: "init",
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

// ---------------------------------------------------------------
// WEBHOOK (unchanged)
// ---------------------------------------------------------------
export const paystackWebhook = async (req, res) => {
  const signature = req.headers["x-paystack-signature"];
  if (!signature) return res.status(400).json({ message: "Missing signature header" });

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

  if (event.event !== "charge.success") {
    return res.status(200).send("OK");
  }

  const data = event.data;

  try {
    const order = await Order.findOne({ paymentReference: data.reference });
    if (!order) {
      console.error(`[Webhook] No order for ref ${data.reference} — ignoring`);
      return res.status(200).send("OK");
    }

    const expectedKobo = Math.round(order.total * 100);
    if (data.amount !== expectedKobo) {
      console.error(`[Webhook] Amount mismatch ref=${data.reference} paid=${data.amount} expected=${expectedKobo}`);
      return res.status(200).send("OK");
    }
    if (data.currency && data.currency !== EXPECTED_CURRENCY) {
      console.error(`[Webhook] Currency mismatch ref=${data.reference} got=${data.currency}`);
      return res.status(200).send("OK");
    }

    const updated = await Order.findOneAndUpdate(
      { paymentReference: data.reference, status: { $ne: "paid" } },
      {
        $set: {
          status: "paid",
          source: "webhook",
          paymentDetails: {
            amount: data.amount / 100,
            paidAt: new Date(),
            transactionId: data.id,
            channel: data.channel,
            reference: data.reference,
            currency: data.currency || EXPECTED_CURRENCY,
          },
        },
      },
      { new: true }
    );

    if (!updated) {
      console.log(`[Webhook] Order ${data.reference} already paid, skipping`);
    } else {
      console.log(`[Webhook] Order ${updated._id} marked as paid`);
    }
  } catch (err) {
    console.error("[Webhook] Error:", err);
  }

  return res.status(200).send("OK");
};

// ---------------------------------------------------------------
// VERIFY (unchanged)
// ---------------------------------------------------------------
export const verifyPayment = async (req, res) => {
  const { reference } = req.body;

  if (!reference) {
    return res.status(400).json({ success: false, message: "Missing reference" });
  }

  try {
    const order = await Order.findOne({ paymentReference: reference });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === "paid") {
      return res.status(200).json({
        success: true,
        message: "Order already processed",
        order,
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

    const expectedKobo = Math.round(order.total * 100);
    if (paymentData.amount !== expectedKobo) {
      console.error(`[Verify] Amount mismatch ref=${reference} paid=${paymentData.amount} expected=${expectedKobo}`);
      return res.status(400).json({ success: false, message: "Payment amount mismatch" });
    }

    if (paymentData.currency && paymentData.currency !== EXPECTED_CURRENCY) {
      return res.status(400).json({ success: false, message: "Payment currency mismatch" });
    }

    const updated = await Order.findOneAndUpdate(
      { paymentReference: reference, status: { $ne: "paid" } },
      {
        $set: {
          status: "paid",
          source: "callback",
          paymentDetails: {
            amount: paymentData.amount / 100,
            paidAt: new Date(),
            transactionId: paymentData.id,
            channel: paymentData.channel,
            reference: paymentData.reference,
            currency: paymentData.currency || EXPECTED_CURRENCY,
          },
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Order saved successfully",
      order: updated || order,
    });
  } catch (error) {
    console.error("[Verify] Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------------------------------------------------------------
// STATUS (unchanged)
// ---------------------------------------------------------------
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