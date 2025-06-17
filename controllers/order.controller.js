const db = require("../models/db");
const paginateQuery = require("../utils/pagination");

async function generateOrderId() {
  const [rows] = await db.query(
    "SELECT order_id FROM orders ORDER BY id DESC LIMIT 1"
  );
  let lastId = rows.length > 0 ? rows[0].order_id : null;

  if (!lastId) return "PO00001";

  const numberPart = parseInt(lastId.replace("PO", ""), 10);
  const newId = "PO" + String(numberPart + 1).padStart(5, "0");
  return newId;
}

exports.addOrder = async (req, res) => {
  const { member_id, items } = req.body;

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    let total = 0;
    let totalPoints = 0; // เพิ่มตัวแปรสำหรับเก็บ point รวม
    const order_id = await generateOrderId();

    if (!member_id || !items) {
      return res.status(400).json({
        status: false,
        msg: "กรุณาเลือกลูกค้าที่สั่งซื้อสินค้าและสินค้า",
      });
    }

    for (const item of items) {
      const [products] = await conn.query(
        "SELECT * FROM products WHERE id = ?",
        [item.product_id]
      );

      if (products.length === 0) {
        return res.status(400).json({
          status: false,
          msg: "สินค้าไม่พอหรือไม่พบสินค้า",
        });
      }

      const product = products[0];
      if (isNaN(product.price) || isNaN(item.quantity)) {
        return res.status(400).json({
          status: false,
          msg: "ราคาหรือจำนวนไม่ถูกต้อง",
        });
      }

      total += parseFloat(product.price) * parseInt(item.quantity);
      totalPoints += parseFloat(product.point || 0) * parseInt(item.quantity); // คำนวณ point รวม
    }

    const [orderResult] = await conn.query(
      "INSERT INTO orders (order_id, member_id, total_price, user_id) VALUES (?, ?, ?, ?)",
      [order_id, member_id, total, req.user.id]
    );

    for (const item of items) {
      const [products] = await conn.query(
        "SELECT * FROM products WHERE id = ?",
        [item.product_id]
      );
      const product = products[0];
      await conn.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price, point) VALUES (?, ?, ?, ?, ?)",
        [
          orderResult.insertId,
          item.product_id,
          item.quantity,
          product.price,
          product.point,
        ]
      );
    }

    // อัพเดท point ของ member หลังจาก INSERT orders เสร็จแล้ว
    if (totalPoints > 0) {
      await conn.query(
        "UPDATE members SET point = COALESCE(point, 0) + ? WHERE id = ?",
        [totalPoints, member_id]
      );
    }

    await conn.commit();
    res.status(201).json({
      status: true,
      msg: "เพิ่มออเดอร์สำเร็จ",
      order_id: orderResult.insertId,
      total_points: totalPoints, // ส่ง point ที่ได้รับกลับไปด้วย
    });
  } catch (err) {
    console.log(err);
    await conn.rollback();
    res.status(500).json({
      status: false,
      msg: "เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่ภายหลัง",
    });
  } finally {
    conn.release();
  }
};

exports.getOrder = async (req, res) => {
  try {
    const { search, status } = req.query;
    let sql =
      "SELECT od.id, od.order_id, od.member_id, od.total_price, od.user_id, od.status, od.created_at, mb.first_name, mb.family_name, mb.phone, us.first_name as user_first_name, us.family_name as user_family_name, (SELECT SUM(point) FROM order_items WHERE order_id = od.id) as point, (SELECT name_th FROM thai_provinces WHERE mb.province_id = id) as province FROM orders as od LEFT JOIN members as mb ON od.member_id = mb.id LEFT JOIN users as us ON od.user_id = us.id WHERE 1=1";
    const params = [];

    if (search) {
      sql +=
        " AND od.order_id LIKE ? OR mb.first_name  LIKE ? OR mb.family_name LIKE ?";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }

    sql += " ORDER BY created_at DESC";

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

exports.getOrderItems = async (req, res) => {
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

exports.editOrderItems = async (req, res) => {
  const { id, status } = req.body;

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // เช็คสถานะปัจจุบันของ order
    const [currentOrder] = await conn.query(
      "SELECT status, member_id FROM orders WHERE id = ?",
      [id]
    );

    if (currentOrder.length === 0) {
      return res.status(404).json({
        status: false,
        msg: "ไม่พบคำสั่งซื้อ",
      });
    }

    const currentStatus = currentOrder[0].status;
    const memberId = currentOrder[0].member_id;

    // อัพเดทสถานะ
    await conn.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);

    // ถ้าเปลี่ยนสถานะเป็น "cancelled" ให้หัก point
    if (status === "cancelled") {
      // คำนวณ point ทั้งหมดของ order นี้
      const [orderItems] = await conn.query(
        "SELECT SUM(point * quantity) as total_points FROM order_items WHERE order_id = ?",
        [id]
      );

      const totalPoints = orderItems[0].total_points || 0;

      if (totalPoints > 0) {
        // หัก point จาก member
        await conn.query(
          "UPDATE members SET point = GREATEST(COALESCE(point, 0) - ?, 0) WHERE id = ?",
          [totalPoints, memberId]
        );
      }
    }

    // ถ้าเปลี่ยนจาก "cancelled/ยกเลิก" เป็นสถานะอื่น ให้คืน point
    else if (currentStatus === "cancelled" && status !== "cancelled") {
      // คำนวณ point ทั้งหมดของ order นี้
      const [orderItems] = await conn.query(
        "SELECT SUM(point * quantity) as total_points FROM order_items WHERE order_id = ?",
        [id]
      );

      const totalPoints = orderItems[0].total_points || 0;

      if (totalPoints > 0) {
        // คืน point ให้ member
        await conn.query(
          "UPDATE members SET point = COALESCE(point, 0) + ? WHERE id = ?",
          [totalPoints, memberId]
        );
      }
    }

    await conn.commit();
    res.status(200).json({
      status: true,
      msg: "อัปเดทสถานะคำสั่งซื้อสำเร็จ",
    });
  } catch (error) {
    console.log(error);
    await conn.rollback();
    res.status(500).json({
      status: false,
      message: "เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่ภายหลัง",
    });
  } finally {
    conn.release();
  }
};

exports.editProduct = async (req, res) => {
  const { id, name, description, price, point, stock, type_id, image_url } =
    req.body;
  try {
    let sql =
      "UPDATE products SET name = ?, description = ?, price = ?, point = ?, stock = ?, type_id = ?, image_url = ? WHERE id = ?";

    await db.query(sql, [
      name,
      description,
      price,
      point,
      stock,
      type_id,
      image_url,
      id,
    ]);
    res.status(200).json({ status: true, msg: "แก้ไขข้อมูลสินค้าสำเร็จ" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่ภายหลัง",
    });
  }
};

exports.delProduct = async (req, res) => {
  const { id } = req.body;
  try {
    let sql = "DELETE FROM products WHERE id = ?";

    await db.query(sql, [id]);
    res.status(200).json({ status: true, msg: "ลบข้อมูลสินค้าสำเร็จ" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่ภายหลัง",
    });
  }
};
