import express from "express";
import Newsletter from "../models/Newsletter.js";

const router = express.Router();

// ✅ Subscribe to newsletter
router.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide a valid email address" 
      });
    }
    
    // Check if email already exists
    const existing = await Newsletter.findOne({ email: email.toLowerCase() });
    
    if (existing) {
      if (existing.status === "unsubscribed") {
        // Reactivate subscription
        existing.status = "active";
        existing.subscribedAt = new Date();
        await existing.save();
        return res.json({ 
          success: true, 
          message: "Welcome back! You have been resubscribed." 
        });
      }
      return res.status(400).json({ 
        success: false, 
        message: "This email is already subscribed to our newsletter." 
      });
    }
    
    // Create new subscription
    const subscription = new Newsletter({
      email: email.toLowerCase(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    await subscription.save();
    
    res.json({ 
      success: true, 
      message: "Successfully subscribed to our newsletter!" 
    });
    
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to subscribe. Please try again later." 
    });
  }
});

// ✅ Unsubscribe from newsletter
router.post("/unsubscribe", async (req, res) => {
  try {
    const { email } = req.body;
    
    const subscription = await Newsletter.findOne({ email: email.toLowerCase() });
    
    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        message: "Email not found in our records." 
      });
    }
    
    subscription.status = "unsubscribed";
    subscription.unsubscribedAt = new Date();
    await subscription.save();
    
    res.json({ 
      success: true, 
      message: "You have been unsubscribed from our newsletter." 
    });
    
  } catch (error) {
    console.error("Unsubscribe error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to unsubscribe. Please try again later." 
    });
  }
});

// ✅ Get all subscribers (Admin only - add auth middleware)
router.get("/subscribers", async (req, res) => {
  try {
    const subscribers = await Newsletter.find({ status: "active" })
      .sort({ subscribedAt: -1 });
    
    res.json({ 
      success: true, 
      count: subscribers.length,
      subscribers 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get subscriber count
router.get("/count", async (req, res) => {
  try {
    const count = await Newsletter.countDocuments({ status: "active" });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;