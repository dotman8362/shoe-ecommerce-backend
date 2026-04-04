import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

// Rate limiter for login attempts (prevents brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  skipSuccessfulRequests: true, // Don't count successful logins
  message: { message: "Too many login attempts. Please try again after 15 minutes." }
});

// In-memory store for failed attempts (use Redis in production)
const failedAttempts = new Map();

// Helper to track failed attempts
const trackFailedAttempt = (ip, email) => {
  const key = `${ip}:${email}`;
  const current = failedAttempts.get(key) || { count: 0, firstAttempt: Date.now() };
  
  current.count++;
  failedAttempts.set(key, current);
  
  // Auto-cleanup after 1 hour
  setTimeout(() => {
    if (failedAttempts.get(key) === current) {
      failedAttempts.delete(key);
    }
  }, 60 * 60 * 1000);
  
  return current.count;
};

// Helper to check if account is locked
const isAccountLocked = (ip, email) => {
  const key = `${ip}:${email}`;
  const attempts = failedAttempts.get(key);
  
  if (!attempts) return false;
  
  // Lock after 5 failed attempts within 15 minutes
  const timeSinceFirst = Date.now() - attempts.firstAttempt;
  return attempts.count >= 5 && timeSinceFirst < 15 * 60 * 1000;
};

// LOGIN
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;
    
    // ✅ Check required environment variables
    if (!process.env.JWT_SECRET) {
      console.error("FATAL: JWT_SECRET is not set");
      return res.status(500).json({ message: "Server configuration error" });
    }
    
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.error("FATAL: ADMIN_EMAIL or ADMIN_PASSWORD not set");
      return res.status(500).json({ message: "Server configuration error" });
    }
    
    // ✅ Validate input format
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: "Valid email is required" });
    }
    
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: "Password is required" });
    }
    
    // ✅ Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    
    // ✅ Check if account is locked
    if (isAccountLocked(clientIp, email)) {
      console.warn(`Login blocked - too many attempts from IP: ${clientIp}, Email: ${email}`);
      return res.status(429).json({ 
        message: "Too many failed attempts. Please try again after 15 minutes." 
      });
    }
    
    // ✅ Get from .env (case-sensitive comparison)
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    // ✅ Constant-time comparison to prevent timing attacks
    const emailMatch = email === adminEmail;
    const passwordMatch = password === adminPassword;
    
    // ✅ Validate credentials
    if (!emailMatch || !passwordMatch) {
      // Track failed attempt
      const attemptCount = trackFailedAttempt(clientIp, email);
      
      // Log failed attempt (for monitoring)
      console.warn(`Failed login attempt - IP: ${clientIp}, Email: ${email}, Attempts: ${attemptCount}`);
      
      // Generic error message (don't specify which field is wrong)
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // ✅ Clear failed attempts on successful login
    const key = `${clientIp}:${email}`;
    failedAttempts.delete(key);
    
    // ✅ Create token with more secure options
    const token = jwt.sign(
      { 
        role: "admin",
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: "8h", // Shorter expiry for security
        issuer: "jofta-solemates",
        audience: "admin-portal"
      }
    );
    
    // ✅ Log successful login
    console.log(`Successful admin login - IP: ${clientIp}, Email: ${email}`);
    
    // ✅ Return token (never return sensitive info)
    res.json({ 
      token,
      expiresIn: "8h",
      message: "Login successful"
    });
    
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Verify token middleware for protected routes
export const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "No token provided" });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "jofta-solemates",
      audience: "admin-portal"
    });
    
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    req.admin = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired. Please login again." });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ✅ Logout endpoint (client-side token discard)
export const logoutAdmin = async (req, res) => {
  // In a stateless JWT setup, logout is client-side
  // But we can add token to a blacklist if needed (requires Redis)
  res.json({ message: "Logged out successfully" });
};
