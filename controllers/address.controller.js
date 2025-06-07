const db = require('../models/db');

exports.getProvinces = async (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT * FROM thai_provinces';
  const params = [];

  if (search) {
    sql += ' WHERE name_th LIKE ? OR name_en LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }

  const [rows] = await db.query(sql, params);
  res.json(rows);
};

exports.getAmphures = async (req, res) => {
  const { province_id, search } = req.query;
  let sql = 'SELECT * FROM thai_amphures WHERE 1=1';
  const params = [];

  if (province_id) {
    sql += ' AND id = ?';
    params.push(province_id);
  }

  if (search) {
    sql += ' AND (name_th LIKE ? OR name_en LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const [rows] = await db.query(sql, params);
  res.json(rows);
};

exports.getTambons = async (req, res) => {
  const { amphure_id, search } = req.query;
  let sql = 'SELECT * FROM thai_tambons WHERE 1=1';
  const params = [];

  if (amphure_id) {
    sql += ' AND id = ?';
    params.push(amphure_id);
  }

  if (search) {
    sql += ' AND (name_th LIKE ? OR name_en LIKE ? OR zip_code LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const [rows] = await db.query(sql, params);
  res.json(rows);
};
