const db = require("../models/db");
// const paginateQuery = require("../utils/pagination");

// exports.addCustomer = async (req, res) => {
//   try {
//     const {
//       first_name,
//       family_name,
//       phone,
//       address,
//       tambon_id,
//       amphure_id,
//       province_id,
//       lz_id,
//       sp_id,
//       birthdate,
//     } = req.body;

//     const member_id = await generateMemberId();

//     await db.query(
//       "INSERT INTO members (member_id, first_name, family_name, phone, address, tambon_id, amphure_id, province_id, lz_id, sp_id, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
//       [
//         member_id,
//         first_name,
//         family_name,
//         phone,
//         address,
//         tambon_id,
//         amphure_id,
//         province_id,
//         lz_id,
//         sp_id,
//         birthdate,
//       ]
//     );

//     res
//       .status(201)
//       .json({ status: true, msg: "เพิ่มข้อมูลสมาชิกสำเร็จ", member_id });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       status: false,
//       msg: "เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่ภายหลัง",
//     });
//   }
// };

exports.getProductType = async (req, res) => {
  try {
    // const { search, province_id } = req.query;
    let sql =
      "SELECT * FROM product_type";
    // const params = [];

    // if (search) {
    //   sql +=
    //     " AND mb.member_id LIKE ? OR mb.first_name LIKE ? OR mb.family_name LIKE ? OR mb.phone LIKE ?";
    //   params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    // }

    // if (province_id) {
    //   sql += " AND pv.id = ? ";
    //   params.push(province_id);
    // }

    // sql += " ORDER BY mb.created_at DESC";

    const [rows] = await db.query(sql);
    res.status(200).json({ status: true, data: rows });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่ภายหลัง",
    });
  }
};

// exports.editCustomer = async (req, res) => {
//   const {
//     id,
//     first_name,
//     family_name,
//     phone,
//     address,
//     province_id,
//     lz_id,
//     sp_id,
//     birthdate,
//   } = req.body;
//   try {
//     let sql =
//       "UPDATE members SET first_name = ?, family_name = ?, phone = ?, address = ?, province_id = ?, lz_id = ?, sp_id = ?, birthdate = ? WHERE id = ?";

//     await db.query(sql, [
//       first_name,
//       family_name,
//       phone,
//       address,
//       province_id,
//       lz_id,
//       sp_id,
//       birthdate,
//       id,
//     ]);
//     res.status(200).json({ status: true, msg: "แก้ไขข้อมูลลูกค้าสำเร็จ" });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       status: false,
//       message: "เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่ภายหลัง",
//     });
//   }
// };

// exports.delCustomer = async (req, res) => {
//   const { id } = req.body;
//   try {
//     let sql = "DELETE FROM members WHERE id = ?";

//     await db.query(sql, [id]);
//     res.status(200).json({ status: true, msg: "ลบข้อมูลลูกค้าสำเร็จ" });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       status: false,
//       message: "เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่ภายหลัง",
//     });
//   }
// };
