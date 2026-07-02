
const express = require('express');
const { protect } = require('../middleware/auth');
const pool = require('../config/db');
const ExcelJS = require('exceljs');

const router = express.Router();

router.get('/:companyId', protect, async (req, res) => {
  try {
    const { fromDate, toDate, type } = req.query;
    
    let query = `
      SELECT gr.*
      FROM gst_records gr
      WHERE gr.company_id = $1
    `;
    const params = [req.params.companyId];
    let paramIndex = 2;

    if (type) {
      query += ` AND gr.gst_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (fromDate) {
      query += ` AND gr.transaction_date >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      query += ` AND gr.transaction_date <= $${paramIndex}`;
      params.push(toDate);
    }

    query += ' ORDER BY gr.transaction_date DESC, gr.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:companyId/export/excel', protect, async (req, res) => {
  try {
    const { fromDate, toDate, type } = req.query;
    
    let query = `
      SELECT gr.*
      FROM gst_records gr
      WHERE gr.company_id = $1
    `;
    const params = [req.params.companyId];
    let paramIndex = 2;

    if (type) {
      query += ` AND gr.gst_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (fromDate) {
      query += ` AND gr.transaction_date >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      query += ` AND gr.transaction_date <= $${paramIndex}`;
      params.push(toDate);
    }

    query += ' ORDER BY gr.transaction_date';

    const result = await pool.query(query, params);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('GST Records');

    worksheet.columns = [
      { header: 'Date', key: 'transaction_date', width: 15 },
      { header: 'GST Type', key: 'gst_type', width: 15 },
      { header: 'HSN Code', key: 'hsn_code', width: 15 },
      { header: 'Taxable Amount', key: 'taxable_amount', width: 15 },
      { header: 'GST Rate', key: 'gst_rate', width: 10 },
      { header: 'IGST', key: 'igst_amount', width: 12 },
      { header: 'CGST', key: 'cgst_amount', width: 12 },
      { header: 'SGST', key: 'sgst_amount', width: 12 },
      { header: 'Total GST', key: 'total_gst', width: 12 },
      { header: 'Place of Supply', key: 'place_of_supply', width: 20 },
    ];

    result.rows.forEach(row => {
      worksheet.addRow({
        ...row,
        transaction_date: new Date(row.transaction_date).toLocaleDateString()
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="gst-records.xlsx"`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
