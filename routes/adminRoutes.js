import express from "express";
import rateLimit from "express-rate-limit";
import { loginAdmin, verifyAdminToken } from "../controllers/adminController.js";
import Order from "../models/Order.js";

const router = express.Router();

// ✅ Rate limiter for admin actions
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per IP
  skipSuccessfulRequests: true,
  message: { message: "Too many requests. Please try again later." }
});

// ✅ Public route (with rate limiting for login)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts. Try again later." }
});

router.post("/login", loginLimiter, loginAdmin);

// ✅ PROTECTED ROUTES - All routes below require authentication
router.use(verifyAdminToken);

// ✅ Get all orders (with pagination)
router.get("/orders", adminLimiter, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Order.countDocuments();
    
    res.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get single order by ID
router.get("/orders/:id", adminLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }
    
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json({ success: true, order });
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update order status (with validation)
router.put("/orders/:id", adminLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { paid, status, trackingNumber, notes } = req.body;
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }
    
    // Build update object with validation
    const updateData = {};
    
    if (paid !== undefined) {
      if (typeof paid !== 'boolean') {
        return res.status(400).json({ message: "Paid must be a boolean value" });
      }
      updateData.paid = paid;
      if (paid === true) {
        updateData.paidAt = new Date();
      }
    }
    
    if (status !== undefined) {
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      updateData.status = status;
    }
    
    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber;
    }
    
    if (notes !== undefined) {
      updateData.adminNotes = notes;
    }
    
    // Add audit trail
    updateData.lastUpdatedBy = req.admin?.role || 'admin';
    updateData.lastUpdatedAt = new Date();
    
    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Log the update (for audit trail)
    console.log(`Order ${id} updated by admin: ${JSON.stringify(updateData)}`);
    
    res.json({ 
      success: true, 
      order,
      message: "Order updated successfully"
    });
  } catch (err) {
    console.error("Update order error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Delete order (with confirmation check)
router.delete("/orders/:id", adminLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { confirm } = req.body;
    
    // Require confirmation for deletion
    if (confirm !== true) {
      return res.status(400).json({ message: "Confirmation required to delete order" });
    }
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }
    
    const order = await Order.findByIdAndDelete(id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Log deletion
    console.log(`Order ${id} deleted by admin`);
    
    res.json({ 
      success: true, 
      message: "Order deleted successfully" 
    });
  } catch (err) {
    console.error("Delete order error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get order statistics
router.get("/stats/orders", adminLimiter, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const paidOrders = await Order.countDocuments({ paid: true });
    const pendingOrders = await Order.countDocuments({ paid: false });
    
    const revenue = await Order.aggregate([
      { $match: { paid: true } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);
    
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      success: true,
      stats: {
        totalOrders,
        paidOrders,
        pendingOrders,
        totalRevenue: revenue[0]?.total || 0,
        recentOrders
      }
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
