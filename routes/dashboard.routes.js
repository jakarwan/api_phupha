const express = require("express");
const router = express.Router();
const {
  getDashboard,
} = require("../controllers/dashboard.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/", authMiddleware, getDashboard);

module.exports = router;
