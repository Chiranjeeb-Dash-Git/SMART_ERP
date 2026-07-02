
const express = require('express');
const { protect } = require('../middleware/auth');
const pool = require('../config/db');
const PDFDocument = require('pdfkit');

const router = express.Router();

router.get('/:companyId', protect, async (req, res) => {
  try {
    const { type } = req.query;
    let query = `
      SELECT i.*, l.name as party_name
      FROM invoices i
      LEFT JOIN ledgers l ON i.party_ledger_id = l.id
      WHERE i.company_id = $1
    `;
    const params = [req.params.companyId];
    
    if (type) {
      query += ' AND i.invoice_type = $2';
      params.push(type);
    }
    
    query += ' ORDER BY i.date DESC, i.invoice_number DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:companyId/:id', protect, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, l.name as party_name, l.address as party_address, l.gst_number as party_gst,
             c.name as company_name, c.address as company_address, c.gst_number as company_gst
      FROM invoices i
      LEFT JOIN ledgers l ON i.party_ledger_id = l.id
      JOIN companies c ON i.company_id = c.id
      WHERE i.id = $1 AND i.company_id = $2
    `, [req.params.id, req.params.companyId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
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
      company_id, invoice_type, voucher_id, date, due_date,
      party_ledger_id, billing_address, shipping_address,
      taxable_amount, igst_amount, cgst_amount, sgst_amount,
      round_off, total_amount, notes, terms
    } = req.body;

    const countResult = await client.query(
      'SELECT COUNT(*) FROM invoices WHERE company_id = $1 AND invoice_type = $2',
      [company_id, invoice_type]
    );
    const prefix = invoice_type === 'Sales' ? 'INV' : 'PUR';
    const invoice_number = `${prefix}-${String(parseInt(countResult.rows[0].count) + 1).padStart(6, '0')}`;

    const total_gst = (igst_amount || 0) + (cgst_amount || 0) + (sgst_amount || 0);
    const balance_amount = total_amount;

    const result = await client.query(
      `INSERT INTO invoices 
       (company_id, invoice_number, invoice_type, voucher_id, date, due_date,
        party_ledger_id, billing_address, shipping_address,
        taxable_amount, igst_amount, cgst_amount, sgst_amount, total_gst,
        round_off, total_amount, paid_amount, balance_amount, notes, terms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING *`,
      [company_id, invoice_number, invoice_type, voucher_id, date, due_date,
       party_ledger_id, billing_address, shipping_address,
       taxable_amount, igst_amount, cgst_amount, sgst_amount, total_gst,
       round_off, total_amount, 0, balance_amount, notes, terms]
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

router.put('/:id/payment', protect, async (req, res) => {
  try {
    const { paid_amount } = req.body;
    const invoiceResult = await pool.query(
      'SELECT * FROM invoices WHERE id = $1',
      [req.params.id]
    );
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const invoice = invoiceResult.rows[0];
    const new_paid_amount = invoice.paid_amount + paid_amount;
    const new_balance = invoice.total_amount - new_paid_amount;
    const status = new_balance <= 0 ? 'paid' : (new_paid_amount > 0 ? 'partial' : 'unpaid');

    const result = await pool.query(
      `UPDATE invoices 
       SET paid_amount = $1, balance_amount = $2, status = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [new_paid_amount, new_balance, status, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await pool.query('DELETE FROM invoices WHERE id = $1', [req.params.id]);
    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:companyId/:id/pdf', protect, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, l.name as party_name, l.address as party_address, l.gst_number as party_gst,
             c.name as company_name, c.address as company_address, c.gst_number as company_gst,
             c.phone as company_phone, c.email as company_email
      FROM invoices i
      LEFT JOIN ledgers l ON i.party_ledger_id = l.id
      JOIN companies c ON i.company_id = c.id
      WHERE i.id = $1 AND i.company_id = $2
    `, [req.params.id, req.params.companyId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const invoice = result.rows[0];
    
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.pdf"`);
    doc.pipe(res);

    doc.fontSize(24).text(invoice.company_name, { align: 'center' });
    doc.moveDown();
    if (invoice.company_address) {
      doc.fontSize(10).text(invoice.company_address, { align: 'center' });
    }
    if (invoice.company_gst) {
      doc.fontSize(10).text(`GST: ${invoice.company_gst}`, { align: 'center' });
    }
    if (invoice.company_phone) {
      doc.fontSize(10).text(`Phone: ${invoice.company_phone}`, { align: 'center' });
    }
    if (invoice.company_email) {
      doc.fontSize(10).text(`Email: ${invoice.company_email}`, { align: 'center' });
    }

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    doc.fontSize(18).text(`${invoice.invoice_type} Invoice`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Invoice No: ${invoice.invoice_number}`);
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`);
    if (invoice.due_date) {
      doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`);
    }
    if (invoice.party_name) {
      doc.text(`Customer: ${invoice.party_name}`);
    }
    if (invoice.party_gst) {
      doc.text(`GST: ${invoice.party_gst}`);
    }
    if (invoice.billing_address) {
      doc.text(`Address: ${invoice.billing_address}`);
    }

    doc.moveDown();

    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 150;
    const col3 = 250;
    const col4 = 350;
    const col5 = 450;

    doc.fontSize(10).text('Description', col1, tableTop);
    doc.text('Qty', col2, tableTop);
    doc.text('Rate', col3, tableTop);
    doc.text('Tax', col4, tableTop);
    doc.text('Amount', col5, tableTop);

    doc.moveTo(50, doc.y + 15).lineTo(550, doc.y + 15).stroke();
    doc.moveDown();

    let y = doc.y;
    doc.text('Taxable Amount', col1, y);
    doc.text(`₹${invoice.taxable_amount.toFixed(2)}`, col5, y, { align: 'right' });

    y += 20;
    doc.text('CGST', col1, y);
    doc.text(`₹${invoice.cgst_amount.toFixed(2)}`, col5, y, { align: 'right' });

    y += 20;
    doc.text('SGST', col1, y);
    doc.text(`₹${invoice.sgst_amount.toFixed(2)}`, col5, y, { align: 'right' });

    y += 20;
    doc.text('IGST', col1, y);
    doc.text(`₹${invoice.igst_amount.toFixed(2)}`, col5, y, { align: 'right' });

    if (invoice.round_off > 0) {
      y += 20;
      doc.text('Round Off', col1, y);
      doc.text(`₹${invoice.round_off.toFixed(2)}`, col5, y, { align: 'right' });
    }

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    doc.fontSize(14).text(`Total: ₹${invoice.total_amount.toFixed(2)}`, { align: 'right' });

    if (invoice.notes) {
      doc.moveDown();
      doc.fontSize(10).text(`Notes: ${invoice.notes}`);
    }

    if (invoice.terms) {
      doc.moveDown();
      doc.fontSize(9).text(`Terms: ${invoice.terms}`);
    }

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
