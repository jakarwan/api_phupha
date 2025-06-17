const express = require("express");
const router = express.Router();
const { addOrder, getOrder, getOrderItems, editOrderItems } = require("../controllers/order.controller");
const authMiddleware = require("../middlewares/auth.middleware");
// const upload = require("../middlewares/upload");

router.post("/add", authMiddleware, addOrder);
router.get("/list", authMiddleware, getOrder);
router.get("/items", authMiddleware, getOrderItems);
router.put("/status", authMiddleware, editOrderItems);
// router.put("/edit", authMiddleware, upload.single("image"), editProduct);
// router.delete("/delete", authMiddleware, delProduct);

module.exports = router;
