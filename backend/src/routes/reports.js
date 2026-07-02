
const express = require('express');
const { protect } = require('../middleware/auth');
const pool = require('../config/db');

const router = express.Router();

// Stock summary report
router.get('/:companyId/stock-summary', protect, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        si.id as item_id,
        si.name as item_name,
        si.sku,
        COALESCE(ss.quantity, si.opening_stock, 0) as current_stock,
        COALESCE(ss.available_stock, si.opening_stock, 0) as available_stock,
        COALESCE(ss.reserved_stock, 0) as reserved_stock,
        COALESCE(ss.damaged_stock, 0) as damaged_stock,
        (COALESCE(ss.quantity, si.opening_stock, 0) * COALESCE(si.purchase_price, si.opening_rate, 0)) as value
      FROM stock_items si
      LEFT JOIN stock_summary ss ON si.id = ss.item_id
      WHERE si.company_id = $1
    `, [req.params.companyId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sales summary report
router.get('/:companyId/sales-summary', protect, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as voucher_count,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(SUM(total_gst), 0) as total_tax
      FROM vouchers
      WHERE company_id = $1 AND voucher_type = 'Sales'
    `, [req.params.companyId]);
    const row = result.rows[0];
    res.json({
      total_sales: parseFloat(row.total_sales) || 0,
      total_tax: parseFloat(row.total_tax) || 0,
      total_net: (parseFloat(row.total_sales) || 0) - (parseFloat(row.total_tax) || 0),
      voucher_count: parseInt(row.voucher_count) || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Purchase summary report
router.get('/:companyId/purchase-summary', protect, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as voucher_count,
        COALESCE(SUM(total_amount), 0) as total_purchases,
        COALESCE(SUM(total_gst), 0) as total_tax
      FROM vouchers
      WHERE company_id = $1 AND voucher_type = 'Purchase'
    `, [req.params.companyId]);
    const row = result.rows[0];
    res.json({
      total_purchases: parseFloat(row.total_purchases) || 0,
      total_tax: parseFloat(row.total_tax) || 0,
      total_net: (parseFloat(row.total_purchases) || 0) - (parseFloat(row.total_tax) || 0),
      voucher_count: parseInt(row.voucher_count) || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Profit and loss report
router.get('/:companyId/profit-loss', protect, async (req, res) => {
  try {
    const salesResult = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total_sales
      FROM vouchers
      WHERE company_id = $1 AND voucher_type = 'Sales'
    `, [req.params.companyId]);
    const purchaseResult = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total_purchases
      FROM vouchers
      WHERE company_id = $1 AND voucher_type = 'Purchase'
    `, [req.params.companyId]);
    const totalSales = parseFloat(salesResult.rows[0].total_sales) || 0;
    const totalPurchases = parseFloat(purchaseResult.rows[0].total_purchases) || 0;
    res.json({
      total_income: totalSales,
      total_expenses: totalPurchases,
      net_profit: totalSales - totalPurchases
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
