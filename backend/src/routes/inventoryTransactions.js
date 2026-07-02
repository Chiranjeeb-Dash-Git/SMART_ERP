
const express = require('express');
const { protect } = require('../middleware/auth');
const pool = require('../config/db');

const router = express.Router();

router.get('/:companyId', protect, async (req, res) => {
  try {
    const { itemId, fromDate, toDate, type } = req.query;
    
    let query = `
      SELECT it.*, si.name as item_name, u.symbol as unit_symbol
      FROM inventory_transactions it
      LEFT JOIN stock_items si ON it.item_id = si.id
      LEFT JOIN units u ON si.unit_id = u.id
      WHERE it.company_id = $1
    `;
    const params = [req.params.companyId];
    let paramIndex = 2;

    if (itemId) {
      query += ` AND it.item_id = $${paramIndex}`;
      params.push(itemId);
      paramIndex++;
    }

    if (type) {
      query += ` AND it.transaction_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (fromDate) {
      query += ` AND it.transaction_date >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      query += ` AND it.transaction_date <= $${paramIndex}`;
      params.push(toDate);
    }

    query += ' ORDER BY it.transaction_date DESC, it.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
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
      company_id, item_id, transaction_type, transaction_date,
      quantity, rate, amount, voucher_id, reference_number, narration
    } = req.body;

    const result = await client.query(
      `INSERT INTO inventory_transactions 
       (company_id, item_id, transaction_type, transaction_date, 
        quantity, rate, amount, voucher_id, reference_number, narration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [company_id, item_id, transaction_type, transaction_date,
       quantity, rate, amount, voucher_id, reference_number, narration]
    );

    const qtyChange = transaction_type === 'Purchase' || transaction_type === 'Stock In' ? quantity : -quantity;
    await client.query(
      `INSERT INTO stock_summary (company_id, item_id, quantity, rate, amount)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (company_id, item_id)
       DO UPDATE SET 
         quantity = stock_summary.quantity + EXCLUDED.quantity,
         rate = EXCLUDED.rate,
         amount = (stock_summary.quantity + EXCLUDED.quantity) * EXCLUDED.rate,
         updated_at = CURRENT_TIMESTAMP`,
      [company_id, item_id, qtyChange, rate, qtyChange * rate]
    );

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

router.delete('/:id', protect, async (req, res) => {
  try {
    await pool.query('DELETE FROM inventory_transactions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Inventory transaction deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
