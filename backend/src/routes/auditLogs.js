
const express = require('express');
const { protect } = require('../middleware/auth');
const pool = require('../config/db');

const router = express.Router();

router.get('/:companyId', protect, async (req, res) => {
  try {
    const { module, fromDate, toDate, userId } = req.query;
    
    let query = `
      SELECT al.*, u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.company_id = $1
    `;
    const params = [req.params.companyId];
    let paramIndex = 2;

    if (module) {
      query += ` AND al.module = $${paramIndex}`;
      params.push(module);
      paramIndex++;
    }

    if (userId) {
      query += ` AND al.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (fromDate) {
      query += ` AND al.created_at >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      query += ` AND al.created_at <= $${paramIndex}`;
      params.push(toDate);
    }

    query += ' ORDER BY al.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const {
      company_id, action, module, record_id,
      old_values, new_values
    } = req.body;

    const result = await pool.query(
      `INSERT INTO audit_logs 
       (company_id, user_id, action, module, record_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [company_id, req.user.id, action, module, record_id,
       old_values, new_values,
       req.ip || 'unknown',
       req.get('user-agent') || 'unknown']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
