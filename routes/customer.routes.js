const express = require("express");
const router = express.Router();
const {
  addCustomer,
  getCustomer,
  editCustomer,
  delCustomer,
  getOrderCustomer,
  getOrderItemsCustomer,
} = require("../controllers/customer.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/add-customer", authMiddleware, addCustomer);
router.get("/list", authMiddleware, getCustomer);
router.put("/edit-customer", authMiddleware, editCustomer);
router.delete("/delete", authMiddleware, delCustomer);
router.get("/order", authMiddleware, getOrderCustomer);
router.get("/order-item", authMiddleware, getOrderItemsCustomer);

module.exports = router;
