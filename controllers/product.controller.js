const db = require("../models/db");
const paginateQuery = require("../utils/pagination");

async function generateProductId() {
  const [rows] = await db.query(
    "SELECT product_id FROM products ORDER BY id DESC LIMIT 1"
  );
  let lastId = rows.length > 0 ? rows[0].product_id : null;

  if (!lastId) return "PD001";

  const numberPart = parseInt(lastId.replace("PD", ""), 10);
  const newId = "PD" + String(numberPart + 1).padStart(3, "0");
  return newId;
}

exports.addProduct = async (req, res) => {
  const { name, description, price, point, stock, type_id } = req.body;
  //   const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  const image_url = req.file ? req.file.filename : null;

  try {
    const product_id = await generateProductId();

    if (!name || !price) {
      return res
        .status(400)
        .json({ status: false, message: "กรุณากรอกชื่อสินค้าและราคา" });
    }

    await db.query(
      "INSERT INTO products (product_id, name, description, price, point, stock, type_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        product_id,
        name,
        description,
        price,
        point,
        stock || 0,
        type_id,
        image_url,
      ]
    );

    res
      .status(201)
      .json({ status: true, msg: "เพิ่มข้อมูลสินค้าสำเร็จ", product_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: false,
      msg: "เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่ภายหลัง",
    });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const { search, product_id } = req.query;
    let sql =
      "SELECT id, product_id, name, description, price, point, stock, type_id, image_url FROM products WHERE 1=1";
    const params = [];

    if (search) {
      sql += " AND name LIKE ? OR product_id LIKE ?";
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY created_at DESC";

    const [rows] = await db.query(sql, params);

    // full image url
    const productsWithImageUrl = rows.map(product => ({
      ...product,
      image_url: product.image_url ? 
        `${req.protocol}://${req.get('host')}/uploads/${product.image_url}` : 
        null
    }));

    const { data, pagination } = paginateQuery(req, productsWithImageUrl);
    res.status(200).json({ status: true, data, pagination });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่ภายหลัง",
    });
  }
};

exports.editProduct = async (req, res) => {
  const { id, name, description, price, point, stock, type_id } = req.body;
  
  try {
    if (!id) {
      return res.status(400).json({ 
        status: false, 
        msg: "กรุณาระบุ ID ของสินค้า" 
      });
    }

    if (!name || !price) {
      return res.status(400).json({ 
        status: false, 
        msg: "กรุณากรอกชื่อสินค้าและราคา" 
      });
    }

    // ตรวจสอบว่าสินค้ามีอยู่จริงหรือไม่
    const [existingProduct] = await db.query(
      "SELECT image_url FROM products WHERE id = ?", 
      [id]
    );

    if (existingProduct.length === 0) {
      return res.status(404).json({
        status: false,
        msg: "ไม่พบสินค้าที่ต้องการแก้ไข",
      });
    }

    // จัดการรูปภาพ
    let image_url = existingProduct[0].image_url; // ใช้รูปเดิม
    
    if (req.file) {
      // ลบรูปเดิม (ถ้ามี)
      if (existingProduct[0].image_url) {
        try {
          const oldImagePath = path.join(__dirname, '../uploads', existingProduct[0].image_url);
          await fs.unlink(oldImagePath);
        } catch (err) {
          console.log('Old image not found or already deleted:', err.message);
        }
      }
      image_url = req.file.filename; // ใช้รูปใหม่
    }

    const numPrice = parseFloat(price);
    
    const result = await db.query(
      "UPDATE products SET name = ?, description = ?, price = ?, point = ?, stock = ?, type_id = ?, image_url = ? WHERE id = ?",
      [
        name,
        description || null,
        numPrice,
        point ? parseInt(point) : 0,
        stock ? parseInt(stock) : 0,
        type_id,
        image_url,
        id,
      ]
    );

    if (result[0].affectedRows === 0) {
      return res.status(404).json({
        status: false,
        msg: "ไม่พบสินค้าที่ต้องการแก้ไข",
      });
    }

    res.status(200).json({ 
      status: true, 
      msg: "แก้ไขข้อมูลสินค้าสำเร็จ" 
    });
  } catch (error) {
    console.error('Error in editProduct:', error);
    
    // ลบไฟล์ใหม่ที่อัพโหลดถ้าเกิดข้อผิดพลาด
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkErr) {
        console.error('Error deleting uploaded file:', unlinkErr);
      }
    }
    
    res.status(500).json({
      status: false,
      msg: "เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่ภายหลัง",
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
