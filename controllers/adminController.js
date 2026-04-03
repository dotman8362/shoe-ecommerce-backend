import jwt from "jsonwebtoken";

// LOGIN
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Get from .env
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // ✅ Validate
    if (email !== adminEmail || password !== adminPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Create token
    const token = jwt.sign(
      { role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
