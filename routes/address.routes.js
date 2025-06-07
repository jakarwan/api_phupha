const express = require('express');
const router = express.Router();
const {
  getProvinces,
  getAmphures,
  getTambons
} = require('../controllers/address.controller');

router.get('/provinces', getProvinces);
router.get('/amphures', getAmphures);
router.get('/tambons', getTambons);

module.exports = router;
