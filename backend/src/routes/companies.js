
const express = require('express');
const { protect } = require('../middleware/auth');
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM companies WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', protect, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const countResult = await client.query('SELECT COUNT(*) FROM companies WHERE user_id = $1', [req.user.id]);
    if (parseInt(countResult.rows[0].count) >= 5) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Maximum 5 companies allowed per user' });
    }

    const { name, address, city, state, pincode, country, gst_number, pan_number, financial_year_start, financial_year_end, phone, email: company_email, website } = req.body;

    const result = await client.query(
      `INSERT INTO companies 
       (user_id, name, address, city, state, pincode, country, gst_number, pan_number, financial_year_start, financial_year_end, phone, email, website)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [req.user.id, name, address, city, state, pincode, country, gst_number, pan_number, financial_year_start, financial_year_end, phone, company_email, website]
    );

    const companyId = result.rows[0].id;

    // Create default ledger groups
    const ledgerGroups = [
      { id: uuidv4(), name: 'Assets', parent_id: null, nature: 'Assets', is_default: true },
      { id: uuidv4(), name: 'Liabilities', parent_id: null, nature: 'Liabilities', is_default: true },
      { id: uuidv4(), name: 'Income', parent_id: null, nature: 'Income', is_default: true },
      { id: uuidv4(), name: 'Expenses', parent_id: null, nature: 'Expenses', is_default: true },
      { id: uuidv4(), name: 'Capital Account', parent_name: 'Liabilities', nature: 'Liabilities', is_default: true },
      { id: uuidv4(), name: 'Current Assets', parent_name: 'Assets', nature: 'Assets', is_default: true },
      { id: uuidv4(), name: 'Current Liabilities', parent_name: 'Liabilities', nature: 'Liabilities', is_default: true },
      { id: uuidv4(), name: 'Fixed Assets', parent_name: 'Assets', nature: 'Assets', is_default: true },
      { id: uuidv4(), name: 'Sundry Debtors', parent_name: 'Current Assets', nature: 'Assets', is_default: true },
      { id: uuidv4(), name: 'Sundry Creditors', parent_name: 'Current Liabilities', nature: 'Liabilities', is_default: true },
      { id: uuidv4(), name: 'Bank Accounts', parent_name: 'Current Assets', nature: 'Assets', is_default: true },
      { id: uuidv4(), name: 'Cash-in-Hand', parent_name: 'Current Assets', nature: 'Assets', is_default: true },
      { id: uuidv4(), name: 'Purchase Accounts', parent_name: 'Expenses', nature: 'Expenses', is_default: true },
      { id: uuidv4(), name: 'Sales Accounts', parent_name: 'Income', nature: 'Income', is_default: true },
      { id: uuidv4(), name: 'Duties & Taxes', parent_name: 'Current Liabilities', nature: 'Liabilities', is_default: true },
      { id: uuidv4(), name: 'Direct Expenses', parent_name: 'Expenses', nature: 'Expenses', is_default: true },
      { id: uuidv4(), name: 'Indirect Expenses', parent_name: 'Expenses', nature: 'Expenses', is_default: true },
      { id: uuidv4(), name: 'Direct Incomes', parent_name: 'Income', nature: 'Income', is_default: true },
      { id: uuidv4(), name: 'Indirect Incomes', parent_name: 'Income', nature: 'Income', is_default: true },
      { id: uuidv4(), name: 'Investments', parent_name: 'Assets', nature: 'Assets', is_default: true },
      { id: uuidv4(), name: 'Loans & Advances (Asset)', parent_name: 'Assets', nature: 'Assets', is_default: true },
      { id: uuidv4(), name: 'Loans (Liability)', parent_name: 'Liabilities', nature: 'Liabilities', is_default: true },
    ];

    // Insert root groups first
    const groupIdMap = {};
    for (const group of ledgerGroups.filter(g => !g.parent_name)) {
      await client.query(
        'INSERT INTO ledger_groups (id, company_id, name, parent_id, nature, is_default) VALUES ($1, $2, $3, $4, $5, $6)',
        [group.id, companyId, group.name, null, group.nature, group.is_default]
      );
      groupIdMap[group.name] = group.id;
    }

    // Insert child groups
    for (const group of ledgerGroups.filter(g => g.parent_name)) {
      group.parent_id = groupIdMap[group.parent_name];
      await client.query(
        'INSERT INTO ledger_groups (id, company_id, name, parent_id, nature, is_default) VALUES ($1, $2, $3, $4, $5, $6)',
        [group.id, companyId, group.name, group.parent_id, group.nature, group.is_default]
      );
      groupIdMap[group.name] = group.id;
    }

    // Create default units
    const defaultUnits = [
      { name: 'Numbers', symbol: 'Nos', description: 'Numbers or Pieces' },
      { name: 'Kilograms', symbol: 'Kg', description: 'Kilograms' },
      { name: 'Grams', symbol: 'g', description: 'Grams' },
      { name: 'Meters', symbol: 'm', description: 'Meters' },
      { name: 'Liters', symbol: 'L', description: 'Liters' },
      { name: 'Box', symbol: 'Box', description: 'Boxes' },
      { name: 'Pack', symbol: 'Pack', description: 'Packs' },
      { name: 'Dozen', symbol: 'Doz', description: 'Dozen' },
    ];

    for (const unit of defaultUnits) {
      await client.query(
        'INSERT INTO units (company_id, name, symbol, description) VALUES ($1, $2, $3, $4)',
        [companyId, unit.name, unit.symbol, unit.description]
      );
    }

    // Create default stock groups
    const stockGroups = [
      { name: 'Primary', parent_name: null, description: 'Primary stock group' },
      { name: 'Raw Materials', parent_name: 'Primary', description: 'Raw materials' },
      { name: 'Work-in-Progress', parent_name: 'Primary', description: 'Work in progress' },
      { name: 'Finished Goods', parent_name: 'Primary', description: 'Finished goods' },
    ];

    const stockGroupIdMap = {};
    for (const sg of stockGroups.filter(g => !g.parent_name)) {
      const id = uuidv4();
      await client.query(
        'INSERT INTO stock_groups (id, company_id, name, parent_id, description) VALUES ($1, $2, $3, $4, $5)',
        [id, companyId, sg.name, null, sg.description]
      );
      stockGroupIdMap[sg.name] = id;
    }

    for (const sg of stockGroups.filter(g => g.parent_name)) {
      const id = uuidv4();
      await client.query(
        'INSERT INTO stock_groups (id, company_id, name, parent_id, description) VALUES ($1, $2, $3, $4, $5)',
        [id, companyId, sg.name, stockGroupIdMap[sg.parent_name], sg.description]
      );
      stockGroupIdMap[sg.name] = id;
    }

    // Create default ledgers
    const defaultLedgers = [
      { name: 'Cash', group_name: 'Cash-in-Hand', opening_balance: 0, opening_balance_type: 'debit' },
      { name: 'Sales Account', group_name: 'Sales Accounts', opening_balance: 0, opening_balance_type: 'credit' },
      { name: 'Purchase Account', group_name: 'Purchase Accounts', opening_balance: 0, opening_balance_type: 'debit' },
      { name: 'Output CGST', group_name: 'Duties & Taxes', opening_balance: 0, opening_balance_type: 'credit' },
      { name: 'Output SGST', group_name: 'Duties & Taxes', opening_balance: 0, opening_balance_type: 'credit' },
      { name: 'Output IGST', group_name: 'Duties & Taxes', opening_balance: 0, opening_balance_type: 'credit' },
      { name: 'Input CGST', group_name: 'Duties & Taxes', opening_balance: 0, opening_balance_type: 'debit' },
      { name: 'Input SGST', group_name: 'Duties & Taxes', opening_balance: 0, opening_balance_type: 'debit' },
      { name: 'Input IGST', group_name: 'Duties & Taxes', opening_balance: 0, opening_balance_type: 'debit' },
    ];

    for (const ledger of defaultLedgers) {
      await client.query(
        'INSERT INTO ledgers (company_id, name, group_id, opening_balance, opening_balance_type) VALUES ($1, $2, $3, $4, $5)',
        [companyId, ledger.name, groupIdMap[ledger.group_name], ledger.opening_balance, ledger.opening_balance_type]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating company:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const {
      name, address, city, state, pincode, country,
      gst_number, pan_number, financial_year_start,
      financial_year_end, phone, email, website
    } = req.body;
    const result = await pool.query(
      `UPDATE companies 
       SET name = $1, address = $2, city = $3, state = $4, pincode = $5, country = $6,
           gst_number = $7, pan_number = $8, financial_year_start = $9, financial_year_end = $10,
           phone = $11, email = $12, website = $13, updated_at = CURRENT_TIMESTAMP
       WHERE id = $14 AND user_id = $15 RETURNING *`,
      [name, address, city, state, pincode, country,
       gst_number, pan_number, financial_year_start, financial_year_end,
       phone, email, website, req.params.id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await pool.query('DELETE FROM companies WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Company deleted' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
