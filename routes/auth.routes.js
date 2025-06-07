const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/register", register);
router.post("/login", login);

// Example protected route
router.get("/profile", authMiddleware, (req, res) => {
  res.json({ status: true, msg: "This is your profile", user: req.user });
});

module.exports = router;
