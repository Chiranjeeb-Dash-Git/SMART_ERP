
const express = require('express');
const { protect } = require('../middleware/auth');
const pool = require('../config/db');

const router = express.Router();

router.get('/:companyId', protect, async (req, res) => {
  try {
    const { ledgerId, fromDate, toDate, type } = req.query;
    
    let query = `
      SELECT t.*, l.name as ledger_name
      FROM transactions t
      LEFT JOIN ledgers l ON t.ledger_id = l.id
      WHERE t.company_id = $1
    `;
    const params = [req.params.companyId];
    let paramIndex = 2;

    if (ledgerId) {
      query += ` AND t.ledger_id = $${paramIndex}`;
      params.push(ledgerId);
      paramIndex++;
    }

    if (type) {
      query += ` AND t.transaction_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (fromDate) {
      query += ` AND t.transaction_date >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      query += ` AND t.transaction_date <= $${paramIndex}`;
      params.push(toDate);
    }

    query += ' ORDER BY t.transaction_date DESC, t.created_at DESC';

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
      company_id, transaction_type, transaction_date,
      reference_number, ledger_id, amount, debit_credit,
      voucher_id, invoice_id, narration
    } = req.body;

    const result = await pool.query(
      `INSERT INTO transactions 
       (company_id, transaction_type, transaction_date, reference_number, 
        ledger_id, amount, debit_credit, voucher_id, invoice_id, narration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [company_id, transaction_type, transaction_date, reference_number,
       ledger_id, amount, debit_credit, voucher_id, invoice_id, narration]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
