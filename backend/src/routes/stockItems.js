
const express = require('express');
const { protect } = require('../middleware/auth');
const pool = require('../config/db');

const router = express.Router();

router.get('/:companyId', protect, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT si.*, u.symbol as unit_symbol, sg.name as stock_group_name,
             COALESCE(ss.quantity, si.opening_stock) as current_stock
      FROM stock_items si
      LEFT JOIN units u ON si.unit_id = u.id
      LEFT JOIN stock_groups sg ON si.stock_group_id = sg.id
      LEFT JOIN stock_summary ss ON si.id = ss.item_id AND si.company_id = ss.company_id
      WHERE si.company_id = $1
      ORDER BY si.name
    `, [req.params.companyId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:companyId/:id', protect, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT si.*, u.symbol as unit_symbol, sg.name as stock_group_name
      FROM stock_items si
      LEFT JOIN units u ON si.unit_id = u.id
      LEFT JOIN stock_groups sg ON si.stock_group_id = sg.id
      WHERE si.id = $1 AND si.company_id = $2
    `, [req.params.id, req.params.companyId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', protect, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const {
      company_id, name, stock_group_id, unit_id, hsn_code,
      gst_rate, igst_rate, cgst_rate, sgst_rate,
      opening_stock, opening_rate, reorder_level, description
    } = req.body;

    const opening_value = (opening_stock || 0) * (opening_rate || 0);

    const result = await client.query(
      `INSERT INTO stock_items 
       (company_id, name, stock_group_id, unit_id, hsn_code, gst_rate, igst_rate, cgst_rate, sgst_rate, opening_stock, opening_rate, opening_value, reorder_level, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [company_id, name, stock_group_id, unit_id, hsn_code, gst_rate, igst_rate, cgst_rate, sgst_rate, opening_stock, opening_rate, opening_value, reorder_level, description]
    );

    if (opening_stock > 0) {
      await client.query(
        `INSERT INTO stock_summary (company_id, item_id, quantity, rate, amount)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (company_id, item_id)
         DO UPDATE SET quantity = EXCLUDED.quantity, rate = EXCLUDED.rate, amount = EXCLUDED.amount, updated_at = CURRENT_TIMESTAMP`,
        [company_id, result.rows[0].id, opening_stock, opening_rate, opening_value]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const {
      name, stock_group_id, unit_id, hsn_code,
      gst_rate, igst_rate, cgst_rate, sgst_rate,
      reorder_level, description, is_active
    } = req.body;
    const result = await pool.query(
      `UPDATE stock_items 
       SET name = $1, stock_group_id = $2, unit_id = $3, hsn_code = $4, 
           gst_rate = $5, igst_rate = $6, cgst_rate = $7, sgst_rate = $8,
           reorder_level = $9, description = $10, is_active = $11,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 RETURNING *`,
      [name, stock_group_id, unit_id, hsn_code, gst_rate, igst_rate, cgst_rate, sgst_rate, reorder_level, description, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await pool.query('DELETE FROM stock_items WHERE id = $1', [req.params.id]);
    res.json({ message: 'Stock item deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
