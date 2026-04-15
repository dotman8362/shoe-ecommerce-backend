import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";

dotenv.config();

const app = express();

// ✅ CRITICAL: Enable trust proxy - REQUIRED for Render
app.set('trust proxy', 1);

// ============================================
// 1. SECURITY HEADERS (Helmet)
// ============================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.paystack.co"],
      connectSrc: ["'self'", "https://api.paystack.co"],
    },
  },
}));

// ============================================
// 2. RATE LIMITING (Prevents DoS attacks)
// ============================================

// Helper function to get client IP address
const getClientIp = (req) => {
  // Check for x-forwarded-for header (when behind proxy)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // Get the first IP from the list (client IP)
    const ips = forwarded.split(',');
    return ips[0].trim();
  }
  
  // Check for cloudflare headers
  if (req.headers['cf-connecting-ip']) {
    return req.headers['cf-connecting-ip'];
  }
  
  // Fallback to req.ip (Express' built-in IP detection)
  return req.ip;
};

// General limiter for most routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // 100 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  // Custom keyGenerator to handle proxy IPs correctly
  keyGenerator: (req) => {
    const clientIp = getClientIp(req);
    console.log(`Rate limit key for IP: ${clientIp}`); // Optional: for debugging
    return clientIp;
  },
  skip: (req) => {
    // Optional: Skip rate limiting for health check
    return req.path === '/health';
  }
});

// Stricter limiter for sensitive routes
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // 10 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const clientIp = getClientIp(req);
    return clientIp;
  },
  message: { success: false, message: "Too many attempts, please try again later." }
});

// Apply general limiter to all routes by default
app.use(generalLimiter);

// ============================================
// 3. CORS CONFIGURATION
// ============================================
const allowedOrigins = [
  'https://www.joftasolemates.com.ng',
  'https://joftasolemates.com.ng',
  'http://localhost:3000', // For local development
  'http://localhost:5173', // For Vite development
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn(`Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Paystack-Signature'],
}));

// ============================================
// 4. REQUEST SIZE LIMITS
// ============================================
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ============================================
// 5. WEBHOOK - MUST be BEFORE express.json() for raw body
// ============================================
app.post(
  "/api/payment/webhook/paystack",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const { paystackWebhook } = await import("./controllers/paymentController.js");
    return paystackWebhook(req, res);
  }
);

// ============================================
// 6. REGULAR ROUTES (after webhook)
// ============================================
// Apply strict limiter to sensitive routes
app.use("/api/admin", strictLimiter, adminRoutes);
app.use("/api/payment", strictLimiter, paymentRoutes);

// Routes with general limiter (inherited from app.use(generalLimiter))
app.use("/api", emailRoutes);
app.use("/api", contactRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// ============================================
// 7. HEALTH CHECK
// ============================================
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok",
    time: Date.now(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug route to verify IP detection (remove in production)
app.get("/debug-ip", (req, res) => {
  res.json({
    clientIp: getClientIp(req),
    ip: req.ip,
    xForwardedFor: req.headers['x-forwarded-for'],
    trustProxy: app.get('trust proxy'),
    cfConnectingIp: req.headers['cf-connecting-ip']
  });
});

// ============================================
// 8. ERROR HANDLING MIDDLEWARE
// ============================================
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  
  if (err.status === 429) {
    return res.status(429).json({ 
      success: false, 
      message: "Too many requests. Please slow down.",
      retryAfter: Math.ceil(err.retryAfter || 60)
    });
  }
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      success: false, 
      message: "CORS policy blocked this request." 
    });
  }
  
  // Log full error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  
  res.status(500).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'development' ? err.message : "Internal server error" 
  });
});

// ============================================
// 9. 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: "Route not found",
    path: req.originalUrl
  });
});

// ============================================
// 10. DATABASE CONNECTION
// ============================================
const PORT = process.env.PORT || 5000;

// Make sure MONGO_URI is defined
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is not defined in environment variables");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ CORS enabled for: ${allowedOrigins.join(', ')}`);
      console.log(`🔒 Trust proxy setting: ${app.get('trust proxy')}`);
      console.log(`📊 Rate limiting active: 100 requests per 15 minutes`);
    });
    
    // ============================================
    // 11. GRACEFUL SHUTDOWN
    // ============================================
    process.on('SIGTERM', async () => {
      console.log('SIGTERM signal received: closing HTTP server');
      
      server.close(async () => {
        console.log('HTTP server closed');
        try {
          await mongoose.connection.close();
          console.log('MongoDB connection closed');
          process.exit(0);
        } catch (err) {
          console.error('Error closing MongoDB connection:', err);
          process.exit(1);
        }
      });
      
      setTimeout(() => {
        console.error('Could not close connections in time, forcing shutdown');
        process.exit(1);
      }, 10000);
    });
    
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    console.error("💡 Make sure your IP is whitelisted in MongoDB Atlas");
    process.exit(1);
  });
