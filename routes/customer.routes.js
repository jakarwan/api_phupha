const express = require("express");
const router = express.Router();
const {
  addCustomer,
  getCustomer,
  editCustomer,
  delCustomer,
} = require("../controllers/customer.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/add-customer", authMiddleware, addCustomer);
router.get("/list", authMiddleware, getCustomer);
router.put("/edit-customer", authMiddleware, editCustomer);
router.delete("/delete", authMiddleware, delCustomer);

module.exports = router;
