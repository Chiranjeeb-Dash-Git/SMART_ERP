
const express = require('express');
const { protect } = require('../middleware/auth');
const pool = require('../config/db');

const router = express.Router();

router.get('/:companyId', protect, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, COALESCE(s.quantity, i.opening_stock) as current_stock
      FROM items i
      LEFT JOIN stock_summary s ON i.id = s.item_id AND i.company_id = s.company_id
      WHERE i.company_id = $1
      ORDER BY i.name
    `, [req.params.companyId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', protect, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { company_id, name, unit, hsn_code, gst_rate, opening_stock, opening_rate } = req.body;
    const result = await client.query(
      'INSERT INTO items (company_id, name, unit, hsn_code, gst_rate, opening_stock, opening_rate) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [company_id, name, unit, hsn_code, gst_rate, opening_stock, opening_rate]
    );

    if (opening_stock > 0) {
      await client.query(
        'INSERT INTO stock_summary (company_id, item_id, quantity, rate, amount) VALUES ($1, $2, $3, $4, $5)',
        [company_id, result.rows[0].id, opening_stock, opening_rate, opening_stock * opening_rate]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const { name, unit, hsn_code, gst_rate } = req.body;
    const result = await pool.query(
      'UPDATE items SET name = $1, unit = $2, hsn_code = $3, gst_rate = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, unit, hsn_code, gst_rate, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await pool.query('DELETE FROM items WHERE id = $1', [req.params.id]);
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
