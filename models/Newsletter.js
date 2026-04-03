import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  status: { 
    type: String, 
    enum: ["active", "unsubscribed"], 
    default: "active" 
  },
  subscribedAt: { type: Date, default: Date.now },
  unsubscribedAt: { type: Date },
  ipAddress: { type: String },
  userAgent: { type: String }
});

export default mongoose.model("Newsletter", newsletterSchema);