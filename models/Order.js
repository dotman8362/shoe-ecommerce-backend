// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  email:        { type: String, required: true },
  phone:        { type: String, required: true },
  items:        [{ name: String, price: Number, quantity: Number, image: String }],
  shipping:     { type: Object, required: true },
  total:        { type: Number, required: true },
  paymentReference: { type: String, required: true, unique: true }, // hard DB-level guard
  source:       { type: String, enum: ["webhook", "callback"], default: "callback" },
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);