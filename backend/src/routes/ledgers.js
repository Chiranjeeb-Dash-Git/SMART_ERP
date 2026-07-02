
const express = require('express');
const { protect } = require('../middleware/auth');
const pool = require('../config/db');

const router = express.Router();

router.get('/groups/:companyId', protect, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ledger_groups WHERE company_id = $1 ORDER BY name', [req.params.companyId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:companyId', protect, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, g.name as group_name 
      FROM ledgers l 
      JOIN ledger_groups g ON l.group_id = g.id 
      WHERE l.company_id = $1 
      ORDER BY l.name
    `, [req.params.companyId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { company_id, name, group_id, address, gst_number, opening_balance, opening_balance_type, phone, email } = req.body;
    const result = await pool.query(
      'INSERT INTO ledgers (company_id, name, group_id, address, gst_number, opening_balance, opening_balance_type, phone, email) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [company_id, name, group_id, address, gst_number, opening_balance, opening_balance_type, phone, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const { name, group_id, address, gst_number, opening_balance, opening_balance_type, phone, email } = req.body;
    const result = await pool.query(
      'UPDATE ledgers SET name = $1, group_id = $2, address = $3, gst_number = $4, opening_balance = $5, opening_balance_type = $6, phone = $7, email = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9 RETURNING *',
      [name, group_id, address, gst_number, opening_balance, opening_balance_type, phone, email, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await pool.query('DELETE FROM ledgers WHERE id = $1', [req.params.id]);
    res.json({ message: 'Ledger deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
