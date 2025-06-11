const express = require("express");
const router = express.Router();
const {
  addProduct,
  getProduct,
  editProduct,
  delProduct,
} = require("../controllers/product.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload");

router.post("/add", authMiddleware, upload.single("image"), addProduct);
router.get("/list", authMiddleware, getProduct);
router.put("/edit", authMiddleware, upload.single("image"), editProduct);
router.delete("/delete", authMiddleware, delProduct);

module.exports = router;
