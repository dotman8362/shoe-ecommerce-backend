import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    badge: String,
    image: String,
    hoverImage: String,
    category: String,
    rating: {
      type: Number,
      default: 4.5,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    colors: [String],
    sizes: [String],
    description: String,
    inStock: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
