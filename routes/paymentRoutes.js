// routes/paymentRoutes.js
import express from "express";
import { 
  initializePayment,  
  verifyPayment,
  getOrderStatus
} from "../controllers/paymentController.js";

const router = express.Router();

// ✅ These routes will use the global express.json() middleware
router.post("/initialize", initializePayment);
router.post("/verify", verifyPayment);
router.get("/order-status/:reference", getOrderStatus);

// ❌ Remove webhook from here - it's now in server.js
// router.post("/webhook/paystack", express.raw({ type: "application/json" }), paystackWebhook);

export default router;
