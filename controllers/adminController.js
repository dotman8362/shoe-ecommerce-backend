import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

// Rate limiter for login attempts
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { message: "Too many login attempts. Try again after 15 minutes." }
});

// Failed attempts tracking (use Redis in production)
const failedAttempts = new Map();

const trackFailedAttempt = (ip, email) => {
  const key = `${ip}:${email}`;
  const current = failedAttempts.get(key) || { count: 0, firstAttempt: Date.now() };
  current.count++;
  failedAttempts.set(key, current);
  
  setTimeout(() => {
    if (failedAttempts.get(key) === current) {
      failedAttempts.delete(key);
    }
  }, 60 * 60 * 1000);
  
  return current.count;
};

const isAccountLocked = (ip, email) => {
  const key = `${ip}:${email}`;
  const attempts = failedAttempts.get(key);
  if (!attempts) return false;
  const timeSinceFirst = Date.now() - attempts.firstAttempt;
  return attempts.count >= 5 && timeSinceFirst < 15 * 60 * 1000;
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;
    
    // Validate environment variables
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not set");
      return res.status(500).json({ message: "Server configuration error" });
    }
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    
    // Check account lockout
    if (isAccountLocked(clientIp, email)) {
      return res.status(429).json({ 
        message: "Too many failed attempts. Try again after 15 minutes." 
      });
    }
    
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (email !== adminEmail || password !== adminPassword) {
      trackFailedAttempt(clientIp, email);
      console.warn(`Failed admin login - IP: ${clientIp}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Clear failed attempts on success
    const key = `${clientIp}:${email}`;
    failedAttempts.delete(key);
    
    const token = jwt.sign(
      { role: "admin", email: adminEmail },
      process.env.JWT_SECRET,
      { expiresIn: "8h", issuer: "jofta-solemates", audience: "admin-portal" }
    );
    
    console.log(`Successful admin login - IP: ${clientIp}`);
    
    res.json({ token, expiresIn: "8h", message: "Login successful" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

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
