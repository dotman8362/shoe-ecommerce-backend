import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  category: { type: String, required: true },
  title: { type: String, required: true },
  excerpt: { type: String, required: true },
  author: { type: String, required: true },
  authorAvatar: { type: String },
  date: { type: Date, default: Date.now },
  readTime: { type: String, default: "5 min read" },
  image: { type: String, required: true },
  altImage: { type: String },
  tags: [{ type: String }],
  content: { type: String }, // Full blog content (HTML or Markdown)
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

postSchema.index({ title: "text", excerpt: "text", content: "text" });

export default mongoose.model("Post", postSchema);