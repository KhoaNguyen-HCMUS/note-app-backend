// routes/companyRoutes.js (tạo file mới)
const express = require('express');
const router = express.Router();
const Company = require('../models/company');

// POST /api/companies - Create company
router.post('/', async (req, res) => {
  try {
    const company = new Company(req.body);
    const savedCompany = await company.save();

    res.status(201).json({
      success: true,
      data: savedCompany,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/companies - Get all companies
router.get('/', async (req, res) => {
  try {
    const companies = await Company.find().lean();
    res.json({
      success: true,
      data: companies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
