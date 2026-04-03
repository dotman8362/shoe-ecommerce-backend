// routes/paymentRoutes.js
import express from "express";
import { 
  initializePayment,  
  verifyPayment,
  paystackWebhook,
  getOrderStatus
} from "../controllers/paymentController.js";

const router = express.Router();

// ✅ These routes will use the global express.json() middleware
router.post("/initialize", initializePayment);
router.post("/verify", verifyPayment);
router.get("/order-status/:reference", getOrderStatus);

// ✅ Webhook route - override to use raw body
router.post(
  "/webhook/paystack",
  express.raw({ type: "application/json" }),
  paystackWebhook
);

export default router;