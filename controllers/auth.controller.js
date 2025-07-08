const db = require("../models/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

exports.register = async (req, res) => {
  const { username, password, first_name, family_name, phone } = req.body;

  const [userExists] = await db.query(
    "SELECT * FROM users WHERE username = ?",
    [username]
  );
  if (userExists.length > 0)
    return res
      .status(400)
      .json({ status: false, msg: "มีชื่อผู้ใช้นี้ในระบบแล้ว" });

  const hash = await bcrypt.hash(password, 10);
  await db.query(
    "INSERT INTO users (username, password, first_name, family_name, phone) VALUES (?, ?, ?, ?, ?)",
    [username, hash, first_name, family_name, phone]
  );

  res.status(201).json({ status: true, msg: "User registered" });
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
    username,
  ]);
  if (rows.length === 0)
    return res
      .status(400)
      .json({ status: false, msg: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });

  const user = rows[0];

  if (!["admin", "superadmin"].includes(user.role)) {
    return res
      .status(403)
      .json({ status: false, msg: "คุณไม่มีสิทธิ์เข้าใช้งาน" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res.status(401).json({ status: false, msg: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );

  res.json({
    token,
    user: {
      first_name: user.first_name,
      family_name: user.family_name,
      role: user.role,
      birthdate: user.birthdate,
      phone: user.phone,
      created_at: user.created_at,
    },
  });
};
