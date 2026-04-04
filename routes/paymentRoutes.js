// routes/paymentRoutes.js
import express from "express";
import rateLimit from 'express-rate-limit';
import { 
  initializePayment,  
  verifyPayment,
  paystackWebhook,
  getOrderStatus
} from "../controllers/paymentController.js";

const router = express.Router();

// ✅ Rate limiter for payment initialization (protects from abuse)
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP
  message: { success: false, message: "Too many payment attempts. Please try again later." }
});

// ✅ Apply rate limiter ONLY to initialize endpoint
router.post("/initialize", paymentLimiter, initializePayment);

// ✅ No rate limiter on verify (user already authenticated via reference)
router.post("/verify", verifyPayment);

// ✅ NO rate limiter on webhook - Paystack needs unrestricted access
router.post(
  "/webhook/paystack",
  express.raw({ type: "application/json" }),
  paystackWebhook
);

// ✅ No rate limiter on status check
router.get("/order-status/:reference", getOrderStatus);

export default router;
