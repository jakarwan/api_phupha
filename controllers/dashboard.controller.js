const db = require("../models/db");
// const paginateQuery = require("../utils/pagination");

exports.getDashboard = async (req, res) => {
  try {
    // const { search, province_id } = req.query;
    const salesQuery = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_price) as total_sales,
        COUNT(member_id) as customers
      FROM orders 
      WHERE status != 'cancelled'
    `;
    const [salesData] = await db.query(salesQuery);

    const customersQuery = `
      SELECT 
        COUNT(*) as customers
      FROM members
    `;
    const [customersData] = await db.query(customersQuery);

    const dashboardData = {
      // Stats Cards
      stats: {
        totalSales: {
          value: salesData[0].total_sales || 0,
        },
        totalOrders: {
          value: salesData[0].total_orders || 0,
        },
        customers: {
          value: customersData[0].customers || 0,
        },
      },
    };

    res.status(200).json({ status: true, data: dashboardData });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่ภายหลัง",
    });
  }
};
