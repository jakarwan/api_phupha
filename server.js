require("dotenv").config();
const express = require("express");
const app = express();
const authRoutes = require("./routes/auth.routes");
const customerRoutes = require("./routes/customer.routes");
const addressRoutes = require("./routes/address.routes");
const cors = require("cors");

app.use(express.json());
// เปิด CORS ทั้งหมด (เหมาะกับ dev)
// app.use(cors())

// เปิดเฉพาะ origin
// app.use(cors({ origin: "http://localhost:5173" }));
app.use(cors({ origin: "https://phupha-help.com" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/address", addressRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
