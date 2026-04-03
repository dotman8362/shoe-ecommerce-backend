import express from "express";
import Post from "../models/Post.js";
import mongoose from "mongoose";

const router = express.Router();

// ✅ GET ALL POSTS
router.get("/", async (req, res) => {
  try {
    const { limit = 10, page = 1, category } = req.query;
    const query = { published: true };
    
    if (category) query.category = category;
    
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Post.countDocuments(query);
    
    res.json({
      success: true,
      posts,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ GET SINGLE POST
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid post ID format" });
    }
    
    const post = await Post.findById(id);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    // Increment views
    post.views += 1;
    await post.save();
    
    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ CREATE POST (Admin only - add auth middleware)
router.post("/", async (req, res) => {
  try {
    const post = new Post(req.body);
    const savedPost = await post.save();
    res.status(201).json({ success: true, post: savedPost });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ UPDATE POST
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body, updatedAt: new Date() };
    
    const post = await Post.findByIdAndUpdate(id, updatedData, { new: true });
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ DELETE POST
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid post ID format" });
    }
    
    const post = await Post.findByIdAndDelete(id);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ GET POSTS BY CATEGORY
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const posts = await Post.find({ category, published: true })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ SEARCH POSTS
router.get("/search/:query", async (req, res) => {
  try {
    const { query } = req.params;
    const posts = await Post.find({
      $text: { $search: query },
      published: true
    }).limit(20);
    
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;