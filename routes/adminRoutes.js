import express from "express";
import { loginAdmin } from "../controllers/adminController.js";

const router = express.Router();

router.post("/login", loginAdmin);
// PUT /api/orders/:id
router.put("/:id", async (req, res) => {
  try {
    const { paid } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paid },
      { new: true }
    );

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
