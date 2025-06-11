require("dotenv").config();
const express = require("express");
const app = express();
const authRoutes = require("./routes/auth.routes");
const customerRoutes = require("./routes/customer.routes");
const addressRoutes = require("./routes/address.routes");
const productRoutes = require("./routes/product.routes");
const typeRoutes = require("./routes/type.routes");
const orderRoutes = require("./routes/order.routes");
const path = require("path");
const cors = require("cors");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// เปิด CORS ทั้งหมด (เหมาะกับ dev)
// app.use(cors())

// เปิดเฉพาะ origin
// app.use(cors({ origin: "http://localhost:5173" }));
app.use(
  cors({
    origin: ["https://phupha-help.com", "https://www.phupha-help.com"], // ✅ ใส่โดเมนหลักของ frontend ที่เรียกใช้ API
    credentials: true, // ✅ ถ้าคุณใช้ cookie, auth header (เช่น JWT Bearer)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // ✅ จำกัดเฉพาะ method ที่ใช้
    allowedHeaders: ["Content-Type", "Authorization"], // ✅ เฉพาะ headers ที่จำเป็น
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/products", productRoutes);
app.use("/api/types", typeRoutes);
app.use("/api/orders", orderRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
