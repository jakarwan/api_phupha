const db = require("../models/db");
const paginateQuery = require("../utils/pagination");

async function generateMemberId() {
  const [rows] = await db.query(
    "SELECT member_id FROM members ORDER BY id DESC LIMIT 1"
  );
  let lastId = rows.length > 0 ? rows[0].member_id : null;

  if (!lastId) return "PF00001";

  const numberPart = parseInt(lastId.replace("PF", ""), 10);
  const newId = "PF" + String(numberPart + 1).padStart(5, "0");
  return newId;
}

exports.addCustomer = async (req, res) => {
  try {
    const {
      first_name,
      family_name,
      phone,
      address,
      tambon_id,
      amphure_id,
      province_id,
      lz_id,
      sp_id,
      birthdate,
    } = req.body;

    const member_id = await generateMemberId();

    await db.query(
      "INSERT INTO members (member_id, first_name, family_name, phone, address, tambon_id, amphure_id, province_id, lz_id, sp_id, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        member_id,
        first_name,
        family_name,
        phone,
        address,
        tambon_id,
        amphure_id,
        province_id,
        lz_id,
        sp_id,
        birthdate,
      ]
    );

    res
      .status(201)
      .json({ status: true, msg: "เพิ่มข้อมูลสมาชิกสำเร็จ", member_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: false,
      msg: "เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่ภายหลัง",
    });
  }
};

exports.getCustomer = async (req, res) => {
  try {
    const { search, province_id } = req.query;
    let sql =
      "SELECT mb.*, ap.name_th as amphure, tb.name_th as tambon, pv.name_th as province FROM members as mb LEFT JOIN thai_amphures as ap ON mb.amphure_id = ap.id LEFT JOIN thai_provinces as pv ON mb.province_id = pv.id LEFT JOIN thai_tambons as tb ON mb.tambon_id = tb.id WHERE 1=1";
    const params = [];

    if (search) {
      sql +=
        " AND mb.member_id LIKE ? OR mb.first_name LIKE ? OR mb.family_name LIKE ? OR mb.phone LIKE ?";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (province_id) {
      sql += " AND pv.id = ? ";
      params.push(province_id);
    }

    sql += " ORDER BY mb.created_at DESC";

    const [rows] = await db.query(sql, params);
    const { data, pagination } = paginateQuery(req, rows);
    res.status(200).json({ status: true, data, pagination });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่ภายหลัง",
    });
  }
};

exports.editCustomer = async (req, res) => {
  const {
    id,
    first_name,
    family_name,
    phone,
    address,
    province_id,
    lz_id,
    sp_id,
    birthdate,
  } = req.body;
  try {
    let sql =
      "UPDATE members SET first_name = ?, family_name = ?, phone = ?, address = ?, province_id = ?, lz_id = ?, sp_id = ?, birthdate = ? WHERE id = ?";

    await db.query(sql, [
      first_name,
      family_name,
      phone,
      address,
      province_id,
      lz_id,
      sp_id,
      birthdate,
      id,
    ]);
    res.status(200).json({ status: true, msg: "แก้ไขข้อมูลลูกค้าสำเร็จ" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่ภายหลัง",
    });
  }
};

exports.delCustomer = async (req, res) => {
  const { id } = req.body;
  try {
    let sql = "DELETE FROM members WHERE id = ?";

    await db.query(sql, [id]);
    res.status(200).json({ status: true, msg: "ลบข้อมูลลูกค้าสำเร็จ" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่ภายหลัง",
    });
  }
};

exports.getOrderCustomer = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      res.status(400).json({
        status: false,
        message: "กรุณาส่ง id",
      });
    }

    let sql =
      "SELECT od.id, od.order_id, od.member_id, od.total_price, od.user_id, od.status, od.created_at, mb.first_name, mb.family_name, mb.phone, us.first_name as user_first_name, us.family_name as user_family_name, (SELECT SUM(point) FROM order_items WHERE order_id = od.id) as point, (SELECT name_th FROM thai_provinces WHERE mb.province_id = id) as province FROM orders as od LEFT JOIN members as mb ON od.member_id = mb.id LEFT JOIN users as us ON od.user_id = us.id WHERE mb.id = ? ORDER BY od.created_at DESC";

    const [rows] = await db.query(sql, [id]);

    // const { data, pagination } = paginateQuery(req, rows);
    res.status(200).json({ status: true, data: rows });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่ภายหลัง",
    });
  }
};

exports.getOrderItemsCustomer = async (req, res) => {
  try {
    const { order_id } = req.query;
    if (!order_id) {
      return res
        .status(400)
        .json({ status: false, msg: "กรุณาส่ง order id มาด้วย" });
    }
    let sql =
      "SELECT oi.order_id, oi.product_id, oi.quantity, oi.price, oi.point, pd.name, pd.product_id, pd.image_url FROM order_items as oi LEFT JOIN products as pd ON oi.product_id = pd.id WHERE 1=1";
    const params = [];

    if (order_id) {
      sql += " AND oi.order_id = ?";
      params.push(`${order_id}`);
    }

    const [rows] = await db.query(sql, params);

    const productsWithImageUrl = rows.map((product) => ({
      ...product,
      image_url: product.image_url
        ? `${req.protocol}://${req.get("host")}/uploads/${product.image_url}`
        : null,
    }));

    // const { data, pagination } = paginateQuery(req, rows);
    res.status(200).json({ status: true, data: productsWithImageUrl });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่ภายหลัง",
    });
  }
};
