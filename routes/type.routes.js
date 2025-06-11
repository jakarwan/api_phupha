const express = require("express");
const router = express.Router();
const {
  getProductType,
} = require("../controllers/type.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/list", authMiddleware, getProductType);

module.exports = router;
