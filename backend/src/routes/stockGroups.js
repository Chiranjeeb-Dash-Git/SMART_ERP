
const express = require('express');
const { protect } = require('../middleware/auth');
const pool = require('../config/db');

const router = express.Router();

router.get('/:companyId', protect, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM stock_groups WHERE company_id = $1 OR id IN (SELECT id FROM stock_groups WHERE company_id = $2) ORDER BY name',
      [req.params.companyId, '00000000-0000-0000-0000-000000000000']
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { company_id, name, parent_id, description } = req.body;
    const result = await pool.query(
      'INSERT INTO stock_groups (company_id, name, parent_id, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [company_id, name, parent_id, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const { name, parent_id, description } = req.body;
    const result = await pool.query(
      'UPDATE stock_groups SET name = $1, parent_id = $2, description = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, parent_id, description, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await pool.query('DELETE FROM stock_groups WHERE id = $1', [req.params.id]);
    res.json({ message: 'Stock group deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
