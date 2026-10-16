// models/Order.js
import mongoose from "mongoose";

const paymentDetailsSchema = new mongoose.Schema(
  {
    amount:        { type: Number },
    paidAt:        { type: Date },
    transactionId: { type: Number },
    channel:       { type: String },
    reference:     { type: String },
    currency:      { type: String, default: "NGN" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    email:        { type: String, required: true },
    phone:        { type: String, required: true },
    items: [
      {
        _id:      { type: String }, // will hold Mongo ObjectId string OR Sanity _id later
        name:     String,
        price:    Number,
        quantity: Number,
        image:    String,
      },
    ],
    shipping:     { type: Object, required: true },
    total:        { type: Number, required: true },
    paymentReference: { type: String, required: true, unique: true },

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled"],
      default: "pending",
      index: true,
    },

    source: {
      type: String,
      enum: ["webhook", "callback", "init"],
      default: "callback",
    },

    paymentDetails: { type: paymentDetailsSchema, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);