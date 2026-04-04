import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import emailRoutes from "./routes/emailRoutes.js"
import contactRoutes from "./routes/contactRoutes.js"

import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";


dotenv.config();

const app = express();

// ✅ ADD CORS CONFIGURATION (BEFORE any routes)
app.use(cors({
  origin: ['https://www.joftasolemates.com.ng'], // Allow your frontend ports
  credentials: true,  // Allow cookies if needed
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// ✅ JSON middleware for all routes (webhook will override)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Handle preflight requests automatically
// app.options('*', cors());



// 🔥 2. MIDDLEWARE AFTER
app.use(cors());
app.use(express.json());

// 🔥 3. ROUTES

app.use("/api/admin", adminRoutes);
app.use("/api", emailRoutes);
app.use("/api", contactRoutes);


// ... after other routes
app.use("/api/posts", postRoutes);

app.use("/api/products", productRoutes);
app.use("/api/payment", paymentRoutes);


// ... after other routes
app.use("/api/newsletter", newsletterRoutes);

app.use("/api/orders", orderRoutes);
// DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.listen(5000, () => console.log("Server running on port 5000"));
