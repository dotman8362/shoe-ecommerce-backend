// backend/addMoreProducts.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";


dotenv.config();

const newProducts = [
  {
      id: 1,
      name: "Army Green Leather Palm Slippers",
      price: 18000,
      badge: "-20%",
      image: "https://res.cloudinary.com/dpy2p67bw/image/upload/q_auto/f_auto/v1775183042/green_xhu5tt.jpg",
      hoverImage: "https://res.cloudinary.com/dpy2p67bw/image/upload/q_auto/f_auto/v1775183042/green_xhu5tt.jpg",
      category: "Palm Slippers",
      rating: 4.5,
      reviews: 128,
  
      // ✅ ADD THIS (important for your color issue)
      colors: ["BLACK", "BROWN", "WHITE", "ASH", "BLUE"],
  
      sizes: ["40", "41", "42", "43", "44", "45"],
  
      description: "Army green leather design coupled with a double sole ",
      inStock: true,
    },
     {
      id: 1,
      name: "Beautiful Handmade Slides",
      price: 12000,
      badge: "-20%",
      image: "https://res.cloudinary.com/dpy2p67bw/image/upload/q_auto/f_auto/v1775183037/lv_d79t7e.jpg",
      hoverImage: "https://res.cloudinary.com/dpy2p67bw/image/upload/q_auto/f_auto/v1775183037/lv_d79t7e.jpg",
      category: "Slides",
      rating: 4.5,
      reviews: 128,
  
      // ✅ ADD THIS (important for your color issue)
      colors: ["BLACK", "BROWN", "WHITE", "ASH", "BLUE"],
  
      sizes: ["40", "41", "42", "43", "44", "45"],
  
      description: "Lv leather design with LV logo  ",
      inStock: true,
    },
];

async function addProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce');
    console.log("✅ Connected to MongoDB");
    
    const inserted = await Product.insertMany(newProducts);
    console.log(`✅ Added ${inserted.length} new products`);
    
    inserted.forEach(product => {
      console.log(`- ${product.name} (ID: ${product._id})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

addProducts();