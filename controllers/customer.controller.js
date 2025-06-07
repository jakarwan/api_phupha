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
