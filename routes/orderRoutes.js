import express from "express";
import Order from "../models/Order.js";
import mongoose from "mongoose";

const router = express.Router();

// ✅ GET ALL ORDERS - Handles multiple data structures
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    
    console.log(`Found ${orders.length} orders`); // Debug log
    
    // Transform orders to match dashboard expected format
    const transformedOrders = orders.map(order => {
      // Get customer name from various possible fields
      let customerName = order.customerName || 
                        order.name || 
                        order.shipping?.name || 
                        order.customer?.name ||
                        "Unknown";
      
      // Get email from various possible fields
      let email = order.email || 
                 order.shipping?.email || 
                 order.customer?.email ||
                 "";
      
      // Get phone from various possible fields
      let phone = order.phone || 
                 order.shipping?.phone || 
                 order.customer?.phone ||
                 "";
      
      // Get address from various possible fields
      let address = order.address || 
                   order.shipping?.address || 
                   "";
      
      let city = order.city || 
                order.shipping?.city || 
                "";
      
      let state = order.state || 
                 order.shipping?.state || 
                 "";
      
      let zip = order.zip || 
               order.shipping?.zip || 
               "";
      
      // Check if order is paid (handles multiple formats)
      const isPaid = order.paid === true || 
                    order.status === "paid" || 
                    order.paymentStatus === "paid" ||
                    false;
      
      return {
        _id: order._id,
        id: order._id,
        name: customerName,
        email: email,
        phone: phone,
        address: address,
        city: city,
        state: state,
        zip: zip,
        total: order.total || 0,
        items: order.items || [],
        paid: isPaid,
        status: isPaid ? "paid" : "pending",
        createdAt: order.createdAt,
        paymentReference: order.paymentReference,
        shipping: order.shipping
      };
    });
    
    console.log(`Transformed ${transformedOrders.length} orders for dashboard`); // Debug log
    res.json(transformedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ GET ORDER STATISTICS
router.get("/stats/summary", async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    
    // Count paid orders (handles multiple formats)
    const orders = await Order.find();
    const paidOrders = orders.filter(o => 
      o.paid === true || o.status === "paid" || o.paymentStatus === "paid"
    ).length;
    
    const pendingOrders = totalOrders - paidOrders;
    
    // Calculate total revenue from paid orders
    const totalRevenue = orders
      .filter(o => o.paid === true || o.status === "paid")
      .reduce((sum, o) => sum + (o.total || 0), 0);
    
    res.json({
      totalOrders,
      paidOrders,
      pendingOrders,
      totalRevenue,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ GET SINGLE ORDER BY ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }
    
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Transform to dashboard format
    const transformedOrder = {
      _id: order._id,
      name: order.customerName || order.name || order.shipping?.name || "Unknown",
      email: order.email || order.shipping?.email || "",
      phone: order.phone || order.shipping?.phone || "",
      address: order.address || order.shipping?.address || "",
      city: order.city || order.shipping?.city || "",
      state: order.state || order.shipping?.state || "",
      zip: order.zip || order.shipping?.zip || "",
      total: order.total || 0,
      items: order.items || [],
      paid: order.paid === true || order.status === "paid",
      createdAt: order.createdAt
    };
    
    res.json(transformedOrder);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ UPDATE ORDER STATUS
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { paid } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }
    
    const updateData = {
      paid: paid === true,
      status: paid === true ? "paid" : "pending"
    };
    
    if (paid === true) {
      updateData.paidAt = new Date();
    }
    
    const order = await Order.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json({ success: true, order });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ DELETE ORDER
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }
    
    const order = await Order.findByIdAndDelete(id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ DEBUG ENDPOINT - Check raw order data
router.get("/debug/raw", async (req, res) => {
  try {
    const orders = await Order.find();
    res.json({
      count: orders.length,
      orders: orders.map(o => ({
        id: o._id,
        customerName: o.customerName,
        name: o.name,
        email: o.email,
        shipping: o.shipping,
        total: o.total,
        paid: o.paid,
        status: o.status,
        createdAt: o.createdAt
      }))
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

export default router;