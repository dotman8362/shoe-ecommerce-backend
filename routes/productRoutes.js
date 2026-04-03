import express from "express";
import Product from "../models/Product.js";
import mongoose from "mongoose";

const router = express.Router();

// ✅ GET ALL PRODUCTS (SHUFFLED)
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    
    // Shuffle the products array
    const shuffledProducts = shuffleArray(products);
    
    res.json(shuffledProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ GET PRODUCTS WITH PAGINATION AND SHUFFLE
router.get("/paginated", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;
    
    // Get random products using MongoDB aggregation
    const products = await Product.aggregate([
      { $match: {} },
      { $sample: { size: limit } }  // This shuffles and picks random products
    ]);
    
    const total = await Product.countDocuments();
    
    res.json({
      products,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ SEARCH WITH SHUFFLE
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === "") {
      return res.json([]);
    }
    
    const searchTerm = q.trim();
    
    let products = await Product.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { category: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    }).limit(20);
    
    // Shuffle search results
    products = shuffleArray(products);
    
    res.json(products.slice(0, 10));
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ GET RANDOM PRODUCTS (For homepage recommendations)
router.get("/random/:count", async (req, res) => {
  try {
    const count = parseInt(req.params.count) || 4;
    
    const products = await Product.aggregate([
      { $sample: { size: count } }
    ]);
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ GET PRODUCTS BY CATEGORY (SHUFFLED)
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    
    let products = await Product.find({ 
      category: { $regex: category, $options: 'i' } 
    });
    
    // Shuffle products in the same category
    products = shuffleArray(products);
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ GET SINGLE PRODUCT BY ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ ADD PRODUCT
router.post("/add", async (req, res) => {
  try {
    const product = new Product(req.body);
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ SEED PRODUCTS
router.post("/seed", async (req, res) => {
  try {
    await Product.deleteMany();
    const products = await Product.insertMany(req.body);
    // Shuffle the seeded products before returning
    const shuffledProducts = shuffleArray(products);
    res.json(shuffledProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// DELETE PRODUCT
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }
    
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;