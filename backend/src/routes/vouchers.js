
const express = require('express');
const { protect } = require('../middleware/auth');
const pool = require('../config/db');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const router = express.Router();

router.get('/:companyId', protect, async (req, res) => {
  try {
    const { type } = req.query;
    let query = `
      SELECT v.*, l.name as party_name 
      FROM vouchers v 
      LEFT JOIN ledgers l ON v.party_ledger_id = l.id 
      WHERE v.company_id = $1
    `;
    const params = [req.params.companyId];
    
    if (type) {
      query += ' AND v.voucher_type = $2';
      params.push(type);
    }
    
    query += ' ORDER BY v.date DESC, v.voucher_number DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:companyId/:id', protect, async (req, res) => {
  try {
    const voucherResult = await pool.query(`
      SELECT v.*, l.name as party_name 
      FROM vouchers v 
      LEFT JOIN ledgers l ON v.party_ledger_id = l.id 
      WHERE v.id = $1 AND v.company_id = $2
    `, [req.params.id, req.params.companyId]);

    if (voucherResult.rows.length === 0) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    const entriesResult = await pool.query(`
      SELECT ve.*, l.name as ledger_name 
      FROM voucher_entries ve 
      JOIN ledgers l ON ve.ledger_id = l.id 
      WHERE ve.voucher_id = $1
    `, [req.params.id]);

    const itemsResult = await pool.query(`
      SELECT vi.*, i.name as item_name, i.unit 
      FROM voucher_items vi 
      JOIN items i ON vi.item_id = i.id 
      WHERE vi.voucher_id = $1
    `, [req.params.id]);

    res.json({
      ...voucherResult.rows[0],
      entries: entriesResult.rows,
      items: itemsResult.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', protect, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { company_id, voucher_type, date, party_ledger_id, narration, total_amount, entries, items } = req.body;

    const countResult = await client.query(
      'SELECT COUNT(*) FROM vouchers WHERE company_id = $1 AND voucher_type = $2',
      [company_id, voucher_type]
    );
    const voucherNumber = `${voucher_type.substring(0, 3).toUpperCase()}-${String(parseInt(countResult.rows[0].count) + 1).padStart(5, '0')}`;

    const voucherResult = await client.query(
      'INSERT INTO vouchers (company_id, voucher_number, voucher_type, date, party_ledger_id, narration, total_amount) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [company_id, voucherNumber, voucher_type, date, party_ledger_id, narration, total_amount || 0]
    );
    const voucherId = voucherResult.rows[0].id;

    for (const entry of (entries || [])) {
      await client.query(
        'INSERT INTO voucher_entries (voucher_id, ledger_id, debit, credit) VALUES ($1, $2, $3, $4)',
        [voucherId, entry.ledger_id, entry.debit, entry.credit]
      );
    }

    if (items && items.length > 0) {
      for (const item of items) {
        let finalItemId = item.item_id;
        
        if (!finalItemId && item.item_name) {
           const newItemResult = await client.query(
             'INSERT INTO stock_items (company_id, name) VALUES ($1, $2) RETURNING id',
             [company_id, item.item_name]
           );
           finalItemId = newItemResult.rows[0].id;
        }
        
        if (!finalItemId) continue;

        await client.query(
          'INSERT INTO voucher_items (voucher_id, item_id, quantity, rate, amount, gst_rate, total_amount) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [voucherId, finalItemId, item.quantity, item.rate, item.amount, item.gst_rate || 0, item.amount]
        );

        const quantityChange = voucher_type === 'Sales' ? -item.quantity : item.quantity;
        await client.query(`
          INSERT INTO stock_summary (company_id, item_id, quantity, rate, amount)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (company_id, item_id)
          DO UPDATE SET 
            quantity = stock_summary.quantity + EXCLUDED.quantity,
            updated_at = CURRENT_TIMESTAMP
        `, [company_id, finalItemId, quantityChange, item.rate, quantityChange * item.rate]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json(voucherResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

router.get('/:companyId/:id/pdf', protect, async (req, res) => {
  try {
    const voucherResult = await pool.query(`
      SELECT v.*, l.name as party_name, l.address as party_address, l.gst_number as party_gst,
             c.name as company_name, c.address as company_address, c.gst_number as company_gst
      FROM vouchers v 
      LEFT JOIN ledgers l ON v.party_ledger_id = l.id 
      JOIN companies c ON v.company_id = c.id
      WHERE v.id = $1 AND v.company_id = $2
    `, [req.params.id, req.params.companyId]);

    if (voucherResult.rows.length === 0) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    const voucher = voucherResult.rows[0];

    const itemsResult = await pool.query(`
      SELECT vi.*, i.name as item_name, i.unit 
      FROM voucher_items vi 
      JOIN items i ON vi.item_id = i.id 
      WHERE vi.voucher_id = $1
    `, [req.params.id]);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${voucher.voucher_number}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).text(voucher.company_name, { align: 'center' });
    doc.fontSize(12).text(voucher.company_address, { align: 'center' });
    if (voucher.company_gst) {
      doc.text(`GST: ${voucher.company_gst}`, { align: 'center' });
    }
    doc.moveDown();
    doc.fontSize(16).text(`${voucher.voucher_type} Voucher`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Voucher No: ${voucher.voucher_number}`);
    doc.text(`Date: ${new Date(voucher.date).toLocaleDateString()}`);
    if (voucher.party_name) {
      doc.text(`Party: ${voucher.party_name}`);
    }
    doc.moveDown();

    if (itemsResult.rows.length > 0) {
      doc.text('Items:', { underline: true });
      doc.moveDown();
      
      let y = doc.y;
      itemsResult.rows.forEach((item, index) => {
        doc.text(`${index + 1}. ${item.item_name}`);
        doc.text(`   Qty: ${item.quantity} ${item.unit} @ ${item.rate.toFixed(2)} = ${item.amount.toFixed(2)}`);
        if (item.gst_rate > 0) {
          const calculatedGst = item.amount * (item.gst_rate / 100);
          doc.text(`   GST: ${item.gst_rate}% = ${calculatedGst.toFixed(2)}`);
        }
        doc.moveDown(0.5);
      });
    }

    doc.moveDown();
    doc.fontSize(14).text(`Total Amount: ₹${Number(voucher.total_amount || 0).toFixed(2)}`, { align: 'right' });

    if (voucher.narration) {
      doc.moveDown();
      doc.fontSize(12).text(`Narration: ${voucher.narration}`);
    }

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:companyId/export/excel', protect, async (req, res) => {
  try {
    const { type } = req.query;
    let query = `
      SELECT v.*, l.name as party_name 
      FROM vouchers v 
      LEFT JOIN ledgers l ON v.party_ledger_id = l.id 
      WHERE v.company_id = $1
    `;
    const params = [req.params.companyId];
    
    if (type) {
      query += ' AND v.voucher_type = $2';
      params.push(type);
    }
    
    query += ' ORDER BY v.date DESC, v.voucher_number DESC';
    
    const result = await pool.query(query, params);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Vouchers');

    worksheet.columns = [
      { header: 'Voucher No', key: 'voucher_number', width: 15 },
      { header: 'Type', key: 'voucher_type', width: 15 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Party', key: 'party_name', width: 30 },
      { header: 'Amount', key: 'total_amount', width: 15 },
      { header: 'Narration', key: 'narration', width: 30 }
    ];

    result.rows.forEach(row => {
      worksheet.addRow({
        ...row,
        date: new Date(row.date).toLocaleDateString()
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="vouchers.xlsx"`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
