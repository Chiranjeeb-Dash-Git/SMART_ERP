
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const db = require('./config/mock-db');

const app = express();
const PORT = process.env.PORT || 5003;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SmartERP Mock Backend is running!' });
});

const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = db.users.findOne({ id: decoded.id });
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized' });
    }
  }
  
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    const existing = db.users.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = db.users.create({
      email,
      password: hashedPassword,
      name
    });
    
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
    
    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = db.users.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
      
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        token
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/companies', protect, (req, res) => {
  const companies = db.companies.find({ user_id: req.user.id });
  res.json(companies);
});

app.post('/api/companies', protect, (req, res) => {
  try {
    const userCompanies = db.companies.find({ user_id: req.user.id });
    if (userCompanies.length >= 5) {
      return res.status(400).json({ message: 'Maximum 5 companies allowed per user' });
    }
    
    const company = db.companies.create({
      user_id: req.user.id,
      ...req.body
    });
    
    res.status(201).json(company);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/companies/:id', protect, (req, res) => {
  const company = db.companies.update(req.params.id, req.body);
  if (!company) {
    return res.status(404).json({ message: 'Company not found' });
  }
  res.json(company);
});

app.delete('/api/companies/:id', protect, (req, res) => {
  db.companies.delete(req.params.id);
  res.json({ message: 'Company deleted' });
});

app.get('/api/ledgers/groups/:companyId', protect, (req, res) => {
  res.json(db.ledgerGroups.find({ company_id: req.params.companyId }));
});

app.get('/api/ledgers/:companyId', protect, (req, res) => {
  const query = { 
    company_id: req.params.companyId,
    search: req.query.search,
    is_customer: req.query.is_customer === 'true',
    is_supplier: req.query.is_supplier === 'true'
  };
  const ledgers = db.ledgers.find(query);
  const groups = db.ledgerGroups.find({ company_id: req.params.companyId });
  const ledgersWithGroup = ledgers.map(l => ({
    ...l,
    group_name: groups.find(g => g.id === l.group_id)?.name || ''
  }));
  res.json(ledgersWithGroup);
});

app.get('/api/ledgers/:companyId/:id', protect, (req, res) => {
  const ledger = db.ledgers.findOne({ id: req.params.id });
  if (!ledger) {
    return res.status(404).json({ message: 'Ledger not found' });
  }
  res.json(ledger);
});

app.post('/api/ledgers', protect, (req, res) => {
  try {
    const ledger = db.ledgers.create(req.body);
    res.status(201).json(ledger);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/ledgers/:id', protect, (req, res) => {
  const ledger = db.ledgers.update(req.params.id, req.body);
  if (!ledger) {
    return res.status(404).json({ message: 'Ledger not found' });
  }
  res.json(ledger);
});

app.delete('/api/ledgers/:id', protect, (req, res) => {
  db.ledgers.delete(req.params.id);
  res.json({ message: 'Ledger deleted' });
});

app.get('/api/customers/:companyId', protect, (req, res) => {
  const customers = db.ledgers.find({ company_id: req.params.companyId, is_customer: true });
  res.json(customers);
});

app.get('/api/suppliers/:companyId', protect, (req, res) => {
  const suppliers = db.ledgers.find({ company_id: req.params.companyId, is_supplier: true });
  res.json(suppliers);
});

app.get('/api/units/:companyId', protect, (req, res) => {
  res.json(db.units.find({ company_id: req.params.companyId }));
});

app.post('/api/units', protect, (req, res) => {
  res.status(201).json(db.units.create(req.body));
});

app.put('/api/units/:id', protect, (req, res) => {
  const unit = db.units.update(req.params.id, req.body);
  if (!unit) {
    return res.status(404).json({ message: 'Unit not found' });
  }
  res.json(unit);
});

app.delete('/api/units/:id', protect, (req, res) => {
  db.units.delete(req.params.id);
  res.json({ message: 'Unit deleted' });
});

app.get('/api/stock-groups/:companyId', protect, (req, res) => {
  res.json(db.stockGroups.find({ company_id: req.params.companyId }));
});

app.post('/api/stock-groups', protect, (req, res) => {
  try {
    const group = db.stockGroups.create(req.body);
    res.status(201).json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/stock-groups/:id', protect, (req, res) => {
  const group = db.stockGroups.update(req.params.id, req.body);
  if (!group) {
    return res.status(404).json({ message: 'Stock group not found' });
  }
  res.json(group);
});

app.delete('/api/stock-groups/:id', protect, (req, res) => {
  db.stockGroups.delete(req.params.id);
  res.json({ message: 'Stock group deleted' });
});

app.get('/api/stock-items/:companyId', protect, (req, res) => {
  const items = db.stockItems.find({ 
    company_id: req.params.companyId,
    search: req.query.search
  });
  const groups = db.stockGroups.find({ company_id: req.params.companyId });
  const unitsList = db.units.find({ company_id: req.params.companyId });
  const summaries = db.stockSummary.find({ company_id: req.params.companyId });
  
  const enrichedItems = items.map(i => {
    const summary = summaries.find(s => s.item_id === i.id);
    return {
      ...i,
      stock_group_name: groups.find(g => g.id === i.stock_group_id)?.name || '',
      unit_symbol: unitsList.find(u => u.id === i.unit_id)?.symbol || '',
      current_stock: summary?.quantity || i.opening_stock || 0,
      reserved_stock: summary?.reserved_stock || 0,
      damaged_stock: summary?.damaged_stock || 0,
      available_stock: summary?.available_stock || i.opening_stock || 0
    };
  });
  
  res.json(enrichedItems);
});

app.get('/api/stock-items/:companyId/:id', protect, (req, res) => {
  const item = db.stockItems.findOne({ id: req.params.id });
  if (!item) {
    return res.status(404).json({ message: 'Stock item not found' });
  }
  
  const summaries = db.stockSummary.find({ company_id: req.params.companyId, item_id: req.params.id });
  res.json({
    ...item,
    current_stock: summaries[0]?.quantity || item.opening_stock || 0,
    available_stock: summaries[0]?.available_stock || item.opening_stock || 0
  });
});

app.post('/api/stock-items', protect, (req, res) => {
  try {
    const item = db.stockItems.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/stock-items/:id', protect, (req, res) => {
  const item = db.stockItems.update(req.params.id, req.body);
  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }
  res.json(item);
});

app.delete('/api/stock-items/:id', protect, (req, res) => {
  db.stockItems.delete(req.params.id);
  res.json({ message: 'Item deleted' });
});

// Items (alias for stock-items for backward compatibility)
app.get('/api/items/:companyId', protect, (req, res) => {
  const items = db.stockItems.find({ 
    company_id: req.params.companyId,
    search: req.query.search
  });
  const groups = db.stockGroups.find({ company_id: req.params.companyId });
  const unitsList = db.units.find({ company_id: req.params.companyId });
  const summaries = db.stockSummary.find({ company_id: req.params.companyId });
  
  const enrichedItems = items.map(i => {
    const summary = summaries.find(s => s.item_id === i.id);
    return {
      ...i,
      stock_group_name: groups.find(g => g.id === i.stock_group_id)?.name || '',
      unit_symbol: unitsList.find(u => u.id === i.unit_id)?.symbol || '',
      current_stock: summary?.quantity || i.opening_stock || 0,
      reserved_stock: summary?.reserved_stock || 0,
      damaged_stock: summary?.damaged_stock || 0,
      available_stock: summary?.available_stock || i.opening_stock || 0
    };
  });
  
  res.json(enrichedItems);
});

app.post('/api/items', protect, (req, res) => {
  try {
    const item = db.stockItems.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/items/:id', protect, (req, res) => {
  const item = db.stockItems.update(req.params.id, req.body);
  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }
  res.json(item);
});

app.delete('/api/items/:id', protect, (req, res) => {
  db.stockItems.delete(req.params.id);
  res.json({ message: 'Item deleted' });
});

app.get('/api/stock-summary/:companyId', protect, (req, res) => {
  const items = db.stockItems.find({ company_id: req.params.companyId });
  const summaries = db.stockSummary.find({ company_id: req.params.companyId });
  const groups = db.stockGroups.find({ company_id: req.params.companyId });
  const unitsList = db.units.find({ company_id: req.params.companyId });
  
  const summaryData = items.map(i => {
    const summary = summaries.find(s => s.item_id === i.id);
    return {
      ...i,
      stock_group_name: groups.find(g => g.id === i.stock_group_id)?.name || '',
      unit_symbol: unitsList.find(u => u.id === i.unit_id)?.symbol || '',
      current_stock: summary?.quantity || i.opening_stock || 0,
      available_stock: summary?.available_stock || i.opening_stock || 0,
      reserved_stock: summary?.reserved_stock || 0,
      damaged_stock: summary?.damaged_stock || 0
    };
  });
  
  res.json(summaryData);
});

app.get('/api/vouchers/:companyId', protect, (req, res) => {
  const vouchers = db.vouchers.find({ 
    company_id: req.params.companyId, 
    voucher_type: req.query.type 
  });
  
  const ledgers = db.ledgers.find({ company_id: req.params.companyId });
  const vouchersWithParty = vouchers.map(v => ({
    ...v,
    party_name: ledgers.find(l => l.id === v.party_ledger_id)?.name || ''
  }));
  
  res.json(vouchersWithParty);
});

app.get('/api/vouchers/:companyId/:id', protect, (req, res) => {
  const voucher = db.vouchers.findOne({ id: req.params.id });
  if (!voucher) {
    return res.status(404).json({ message: 'Voucher not found' });
  }
  
  const items = db.voucherItems.find({ voucher_id: req.params.id });
  const entries = db.voucherEntries.find({ voucher_id: req.params.id });
  const ledgers = db.ledgers.find({ company_id: req.params.companyId });
  const stockItemsList = db.stockItems.find({ company_id: req.params.companyId });
  const unitsList = db.units.find({ company_id: req.params.companyId });
  
  res.json({
    ...voucher,
    party_name: ledgers.find(l => l.id === voucher.party_ledger_id)?.name || '',
    items: items.map(i => ({
      ...i,
      item_name: stockItemsList.find(s => s.id === i.item_id)?.name || '',
      unit_symbol: unitsList.find(u => u.id === stockItemsList.find(s => s.id === i.item_id)?.unit_id)?.symbol || ''
    })),
    entries: entries.map(e => ({
      ...e,
      ledger_name: ledgers.find(l => l.id === e.ledger_id)?.name || ''
    }))
  });
});

app.get('/api/vouchers/:companyId/export-excel', protect, (req, res) => {
  const vouchers = db.vouchers.find({ 
    company_id: req.params.companyId, 
    voucher_type: req.query.type 
  });
  
  const ledgers = db.ledgers.find({ company_id: req.params.companyId });
  
  // Create a simple CSV (which Excel can open natively)
  const headers = ['Voucher #', 'Date', 'Type', 'Party', 'Amount', 'Status'];
  const rows = vouchers.map(v => [
    v.voucher_number,
    v.date,
    v.voucher_type,
    ledgers.find(l => l.id === v.party_ledger_id)?.name || '',
    String(v.total_amount),
    v.status
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=vouchers-${Date.now()}.csv`);
  res.send(csvContent);
});

app.post('/api/vouchers', protect, (req, res) => {
  try {
    const { voucher_items, ...voucherData } = req.body;
    
    // Calculate totals
    let totalAmount = 0;
    let totalTaxable = 0;
    let totalGst = 0;
    
    if (voucher_items && voucher_items.length > 0) {
      voucher_items.forEach(item => {
        const amount = item.quantity * item.rate;
        const discount = (amount * (item.discount_percent || 0)) / 100;
        const taxable = amount - discount;
        const gst = (taxable * (item.gst_rate || 0)) / 100;
        
        totalTaxable += taxable;
        totalGst += gst;
        totalAmount += taxable + gst;
      });
    }
    
    voucherData.total_amount = totalAmount;
    voucherData.taxable_amount = totalTaxable;
    voucherData.total_gst = totalGst;
    voucherData.status = 'pending';
    
    // Create voucher
    const voucher = db.vouchers.create(voucherData);
    
    // Create voucher items
    if (voucher_items && voucher_items.length > 0) {
      voucher_items.forEach(item => {
        db.voucherItems.create({
          ...item,
          voucher_id: voucher.id
        });
        
        // Update stock summary and create inventory transaction
        if (item.item_id) {
          const summaries = db.stockSummary.find({
            company_id: voucher.company_id,
            item_id: item.item_id
          });
          
          if (summaries.length > 0) {
            const summary = summaries[0];
            const qtyChange = (voucher.voucher_type === 'Purchase' || voucher.voucher_type === 'Debit Note')
              ? item.quantity
              : -item.quantity;
            
            // Update summary using db method
            db.stockSummary.update(summary.id, {
              quantity: (summary.quantity || 0) + qtyChange,
              available_stock: (summary.available_stock || 0) + qtyChange
            });
          }
          
          // Create inventory transaction using db method
          db.inventoryTransactions.create({
            company_id: voucher.company_id,
            item_id: item.item_id,
            transaction_type: (voucher.voucher_type === 'Purchase' || voucher.voucher_type === 'Debit Note') ? 'IN' : 'OUT',
            transaction_date: voucher.date,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.total_amount,
            voucher_id: voucher.id,
            narration: voucherData.narration || ''
          });
        }
      });
    }
    
    // Create invoice if sales/purchase voucher
    if (voucher.voucher_type === 'Sales' || voucher.voucher_type === 'Purchase') {
      const existingInvoices = db.invoices.find({ 
        company_id: voucher.company_id,
        invoice_type: voucher.voucher_type
      });
      
      db.invoices.create({
        company_id: voucher.company_id,
        voucher_id: voucher.id,
        invoice_number: `${voucher.voucher_type.substring(0, 3).toUpperCase()}-INV-${String(existingInvoices.length + 1).padStart(5, '0')}`,
        invoice_type: voucher.voucher_type,
        date: voucher.date,
        due_date: voucher.due_date || voucher.date,
        party_ledger_id: voucher.party_ledger_id,
        taxable_amount: voucher.taxable_amount || 0,
        igst_amount: 0, // We'll use CGST+SGST for now
        cgst_amount: (totalGst || 0) / 2,
        sgst_amount: (totalGst || 0) / 2,
        total_gst: voucher.total_gst || 0,
        round_off: 0,
        total_amount: voucher.total_amount || 0,
        paid_amount: 0,
        balance_amount: voucher.total_amount || 0,
        status: 'unpaid'
      });
    }
    
    res.status(201).json(voucher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/invoices/:companyId', protect, (req, res) => {
  const invoices = db.invoices.find({ 
    company_id: req.params.companyId,
    invoice_type: req.query.type
  });
  
  const ledgers = db.ledgers.find({ company_id: req.params.companyId });
  const invoicesWithParty = invoices.map(i => ({
    ...i,
    party_name: ledgers.find(l => l.id === i.party_ledger_id)?.name || ''
  }));
  
  res.json(invoicesWithParty);
});

app.get('/api/invoices/:companyId/:id', protect, (req, res) => {
  const invoice = db.invoices.findOne({ id: req.params.id });
  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }
  
  res.json(invoice);
});

app.get('/api/invoices/:companyId/:id/pdf', protect, (req, res) => {
  const invoice = db.invoices.findOne({ id: req.params.id });
  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }
  
  const company = db.companies.findOne({ id: req.params.companyId });
  const ledgers = db.ledgers.find({ company_id: req.params.companyId });
  const party = ledgers.find(l => l.id === invoice.party_ledger_id);
  const voucherItems = db.voucherItems.find({ voucher_id: invoice.voucher_id });
  const items = db.stockItems.find({ company_id: req.params.companyId });
  const unitsList = db.units.find({ company_id: req.params.companyId });
  
  const enrichedItems = voucherItems.map((vi, idx) => {
    const item = items.find(i => i.id === vi.item_id);
    const unit = unitsList.find(u => u.id === item?.unit_id);
    const rate = vi.rate || 0;
    const qty = vi.quantity || 0;
    const taxable = rate * qty;
    const gstRate = vi.gst_rate || 0;
    const gstAmt = (taxable * gstRate) / 100;
    const cgst = gstAmt / 2;
    const sgst = gstAmt / 2;
    const total = taxable + gstAmt;

    return {
      srNo: idx + 1,
      name: item?.name || 'Unknown',
      hsn: item?.hsn_code || '',
      qty,
      unit: unit?.symbol || 'PCS',
      rate,
      taxable,
      cgst,
      sgst,
      gstRate,
      total
    };
  });
  
  const totalTaxable = enrichedItems.reduce((sum, i) => sum + i.taxable, 0);
  const totalCGST = enrichedItems.reduce((sum, i) => sum + i.cgst, 0);
  const totalSGST = enrichedItems.reduce((sum, i) => sum + i.sgst, 0);
  const totalGST = totalCGST + totalSGST;
  const grandTotal = totalTaxable + totalGST;
  
  function numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Lakh', 'Crore'];
    
    if (num === 0) return 'Zero';
    
    function toWords(n) {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n/10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n % 100 ? ' and ' + toWords(n % 100) : '');
      let result = '';
      let scaleIdx = 0;
      let remaining = n;
      while (remaining > 0) {
        const part = remaining % 1000;
        if (part > 0) {
          result = toWords(part) + ' ' + scales[scaleIdx] + ' ' + result;
        }
        remaining = Math.floor(remaining / 1000);
        scaleIdx++;
      }
      return result.trim();
    }
    
    const whole = Math.floor(num);
    const paise = Math.round((num - whole) * 100);
    let result = toWords(whole) + ' Rupees';
    if (paise > 0) {
      result += ' and ' + toWords(paise) + ' Paise';
    }
    result += ' Only';
    return result;
  }
  
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoice_number}.pdf`);
  
  doc.pipe(res);

  // --- Professional Header ---
  let y = 50;

  // Company Name
  doc.font('Helvetica-Bold').fontSize(22).text(company?.name || 'Your Company Name', { align: 'center' });
  
  // Company Address & Contact
  doc.font('Helvetica').fontSize(11);
  if (company?.address) doc.text(company.address, { align: 'center' });
  let contactParts = [];
  if (company?.city) contactParts.push(company.city);
  if (company?.state) contactParts.push(company.state);
  if (company?.pincode) contactParts.push(company.pincode);
  if (contactParts.length > 0) doc.text(contactParts.join(', '), { align: 'center' });
  
  contactParts = [];
  if (company?.phone) contactParts.push(`Phone: ${company.phone}`);
  if (company?.email) contactParts.push(`Email: ${company.email}`);
  if (company?.website) contactParts.push(`Website: ${company.website}`);
  if (contactParts.length > 0) doc.text(contactParts.join(' | '), { align: 'center' });
  
  // PAN & GSTIN
  doc.moveDown(0.5);
  let taxInfo = [];
  if (company?.pan_number) taxInfo.push(`PAN: ${company.pan_number}`);
  if (company?.gst_number) taxInfo.push(`GSTIN: ${company.gst_number}`);
  if (taxInfo.length > 0) {
    doc.font('Helvetica-Bold').text(taxInfo.join('    '), { align: 'center' });
  }

  // Divider Line
  y = doc.y + 15;
  doc.moveTo(50, y).lineTo(545, y).stroke();

  // --- Tax Invoice Title ---
  y += 20;
  doc.font('Helvetica-Bold').fontSize(20).text('TAX INVOICE', { align: 'center' });
  y = doc.y + 10;

  // --- Customer & Invoice Info Section ---
  y += 10;
  
  // Left Column: Customer Details
  const leftX = 50;
  doc.font('Helvetica-Bold').fontSize(12).text('Bill To:', leftX, y);
  doc.font('Helvetica').fontSize(11);
  y += 15;
  if (party?.name) {
    doc.font('Helvetica-Bold').text(party.name, leftX, y);
    doc.font('Helvetica');
    y += 15;
  }
  if (party?.address) {
    doc.text(party.address, leftX, y, { width: 230 });
    y += 15;
  }
  let customerContact = [];
  if (party?.phone || party?.mobile) customerContact.push(`Phone: ${party.phone || party.mobile}`);
  if (customerContact.length > 0) {
    doc.text(customerContact.join(' | '), leftX, y);
    y += 15;
  }
  if (party?.gst_number) {
    doc.text(`GSTIN: ${party.gst_number}`, leftX, y);
    y += 15;
  }
  if (party?.state) {
    doc.text(`Place of Supply: ${party.state}`, leftX, y);
    y += 15;
  }

  // Right Column: Invoice Details
  const rightX = 330;
  y = doc.y - (y - (doc.y - 15)); // Reset y to start of section
  
  const invoiceDetails = [
    { label: 'Invoice No.', value: invoice?.invoice_number || '-' },
    { label: 'Invoice Date', value: invoice?.date || '-' },
    { label: 'Due Date', value: invoice?.due_date || '-' },
    { label: 'Challan No.', value: '-' },
    { label: 'E-Way Bill No.', value: '-' },
    { label: 'Transport', value: '-' },
    { label: 'Vehicle No.', value: '-' }
  ];

  invoiceDetails.forEach(detail => {
    doc.font('Helvetica-Bold').fontSize(11).text(`${detail.label}:`, rightX, y);
    doc.font('Helvetica').text(detail.value, rightX + 100, y);
    y += 18;
  });

  // --- Items Table ---
  y = Math.max(y, doc.y) + 20;
  const tableTop = y;
  const colX = [50, 75, 200, 260, 290, 320, 380, 420, 460, 500];
  const colHeaders = ['Sr.', 'Product/Service', 'HSN/SAC', 'Qty', 'Unit', 'Rate', 'Taxable', 'CGST', 'SGST', 'Total'];
  
  // Table Header Background
  doc.rect(50, tableTop - 5, 495, 25).fillAndStroke('#f0f0f0', '#000000');
  doc.fillColor('#000000');
  
  // Table Header Text
  doc.font('Helvetica-Bold').fontSize(10);
  colHeaders.forEach((header, i) => {
    if (i >= 4) {
      doc.text(header, colX[i], tableTop + 2, { align: 'right', width: colX[i+1] ? colX[i+1] - colX[i] - 5 : 100 });
    } else {
      doc.text(header, colX[i], tableTop + 2);
    }
  });
  
  // Table Rows
  y = tableTop + 25;
  doc.font('Helvetica').fontSize(10);
  enrichedItems.forEach(item => {
    doc.text(item.srNo.toString(), colX[0], y + 3);
    doc.text(item.name, colX[1], y + 3, { width: colX[2] - colX[1] - 5 });
    doc.text(item.hsn, colX[2], y + 3);
    doc.text(item.qty.toString(), colX[3], y + 3, { align: 'right' });
    doc.text(item.unit, colX[4], y + 3, { align: 'right' });
    doc.text(`₹${item.rate.toFixed(2)}`, colX[5], y + 3, { align: 'right' });
    doc.text(`₹${item.taxable.toFixed(2)}`, colX[6], y + 3, { align: 'right' });
    doc.text(`₹${item.cgst.toFixed(2)}`, colX[7], y + 3, { align: 'right' });
    doc.text(`₹${item.sgst.toFixed(2)}`, colX[8], y + 3, { align: 'right' });
    doc.text(`₹${item.total.toFixed(2)}`, colX[9], y + 3, { align: 'right' });
    
    // Row Border
    doc.moveTo(50, y + 20).lineTo(545, y + 20).stroke();
    y += 22;
  });

  // Fill remaining rows to make table consistent
  const minRows = 5;
  for (let i = enrichedItems.length; i < minRows; i++) {
    doc.moveTo(50, y + 20).lineTo(545, y + 20).stroke();
    y += 22;
  }

  // --- Totals Section ---
  y += 10;
  const totalQty = enrichedItems.reduce((sum, i) => sum + i.qty, 0);
  
  // Totals Labels (Right Aligned)
  const totals = [
    { label: 'Total', qty: totalQty, taxable: totalTaxable, cgst: totalCGST, sgst: totalSGST, total: grandTotal },
  ];

  totals.forEach(t => {
    doc.font('Helvetica-Bold');
    doc.text(t.label, colX[0], y + 3);
    doc.text(`${t.qty} ${enrichedItems[0]?.unit || 'NOS'}`, colX[3], y + 3, { align: 'right' });
    doc.font('Helvetica');
    doc.text(`₹${t.taxable.toFixed(2)}`, colX[6], y + 3, { align: 'right' });
    doc.text(`₹${t.cgst.toFixed(2)}`, colX[7], y + 3, { align: 'right' });
    doc.text(`₹${t.sgst.toFixed(2)}`, colX[8], y + 3, { align: 'right' });
    doc.font('Helvetica-Bold');
    doc.text(`₹${t.total.toFixed(2)}`, colX[9], y + 3, { align: 'right' });
    y += 22;
  });

  // --- Tax Summary & Amount in Words ---
  y += 10;
  doc.rect(50, y, 495, 60).stroke();
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text('Total in Words:', 60, y + 15);
  doc.font('Helvetica').fontSize(10);
  doc.text(numberToWords(grandTotal), 60, y + 32, { width: 280 });
  
  // Tax Summary Right
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text('Taxable Amount:', 350, y + 15);
  doc.text(`₹${totalTaxable.toFixed(2)}`, 480, y + 15, { align: 'right' });
  doc.font('Helvetica').fontSize(10);
  doc.text('Add: CGST:', 350, y + 32);
  doc.text(`₹${totalCGST.toFixed(2)}`, 480, y + 32, { align: 'right' });
  doc.text('Add: SGST:', 350, y + 47);
  doc.text(`₹${totalSGST.toFixed(2)}`, 480, y + 47, { align: 'right' });
  doc.font('Helvetica-Bold').fontSize(12);
  doc.text('Grand Total:', 350, y + 62);
  doc.text(`₹${grandTotal.toFixed(2)}`, 480, y + 62, { align: 'right' });

  // --- Bank Details & Signatures ---
  y += 75;
  doc.font('Helvetica-Bold').fontSize(11).text('Bank Details:', 50, y);
  doc.font('Helvetica').fontSize(10);
  y += 18;
  doc.text('Bank Name:', 50, y);
  doc.text('HDFC Bank', 150, y);
  y += 15;
  doc.text('Account Number:', 50, y);
  doc.text('000123456789', 150, y);
  y += 15;
  doc.text('IFSC Code:', 50, y);
  doc.text('HDFC0001234', 150, y);
  y += 15;
  doc.text('Branch:', 50, y);
  doc.text('Mumbai Central', 150, y);

  // Authorized Signatory
  doc.font('Helvetica-Bold').fontSize(11).text('For ' + (company?.name || 'Your Company'), 350, y + 30);
  doc.font('Helvetica').fontSize(10);
  doc.text('Authorized Signatory', 350, y + 75);

  // --- Footer ---
  y += 100;
  doc.fontSize(9).text('This is a computer generated invoice and does not require a physical signature.', 50, y, { align: 'center', width: 495 });

  doc.end();
});

app.get('/api/vouchers/:companyId/:id/pdf', protect, (req, res) => {
  const voucher = db.vouchers.findOne({ id: req.params.id });
  if (!voucher) {
    return res.status(404).json({ message: 'Voucher not found' });
  }
  
  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=voucher-${voucher.voucher_number}.pdf`);
  
  doc.pipe(res);
  doc.fontSize(20).text(`${voucher.voucher_type} Voucher`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Voucher #: ${voucher.voucher_number}`);
  doc.text(`Date: ${new Date(voucher.date).toLocaleDateString()}`);
  doc.text(`Amount: ₹${voucher.total_amount.toFixed(2)}`);
  doc.end();
});

app.get('/api/inventory-transactions/:companyId', protect, (req, res) => {
  const tx = db.inventoryTransactions.find({ 
    company_id: req.params.companyId,
    item_id: req.query.item_id
  });
  
  const items = db.stockItems.find({ company_id: req.params.companyId });
  const unitsList = db.units.find({ company_id: req.params.companyId });
  
  const enrichedTx = tx.map(t => {
    const item = items.find(i => i.id === t.item_id);
    return {
      ...t,
      item_name: item?.name || '',
      unit_symbol: unitsList.find(u => u.id === item?.unit_id)?.symbol || ''
    };
  });
  
  res.json(enrichedTx);
});

app.post('/api/inventory-transactions', protect, (req, res) => {
  try {
    const tx = db.inventoryTransactions.create(req.body);
    res.status(201).json(tx);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/reports/:companyId/stock-summary', protect, (req, res) => {
  const items = db.stockItems.find({ company_id: req.params.companyId });
  const summaries = db.stockSummary.find({ company_id: req.params.companyId });
  
  const report = items.map(i => {
    const summary = summaries.find(s => s.item_id === i.id);
    return {
      item_id: i.id,
      item_name: i.name,
      sku: i.sku,
      current_stock: summary?.quantity || i.opening_stock || 0,
      available_stock: summary?.available_stock || i.opening_stock || 0,
      reserved_stock: summary?.reserved_stock || 0,
      damaged_stock: summary?.damaged_stock || 0,
      value: (summary?.quantity || i.opening_stock || 0) * (i.purchase_price || i.opening_rate || 0)
    };
  });
  
  res.json(report);
});

app.get('/api/reports/:companyId/sales-summary', protect, (req, res) => {
  const salesVouchers = db.vouchers.find({ 
    company_id: req.params.companyId, 
    voucher_type: 'Sales' 
  });
  
  const totalSales = salesVouchers.reduce((sum, v) => sum + (v.total_amount || 0), 0);
  const totalTax = salesVouchers.reduce((sum, v) => sum + (v.total_gst || 0), 0);
  
  res.json({
    total_sales: totalSales,
    total_tax: totalTax,
    total_net: totalSales - totalTax,
    voucher_count: salesVouchers.length
  });
});

app.get('/api/reports/:companyId/purchase-summary', protect, (req, res) => {
  const purchaseVouchers = db.vouchers.find({ 
    company_id: req.params.companyId, 
    voucher_type: 'Purchase' 
  });
  
  const totalPurchases = purchaseVouchers.reduce((sum, v) => sum + (v.total_amount || 0), 0);
  const totalTax = purchaseVouchers.reduce((sum, v) => sum + (v.total_gst || 0), 0);
  
  res.json({
    total_purchases: totalPurchases,
    total_tax: totalTax,
    total_net: totalPurchases - totalTax,
    voucher_count: purchaseVouchers.length
  });
});

app.get('/api/reports/:companyId/profit-loss', protect, (req, res) => {
  const salesVouchers = db.vouchers.find({ 
    company_id: req.params.companyId, 
    voucher_type: 'Sales' 
  });
  
  const purchaseVouchers = db.vouchers.find({ 
    company_id: req.params.companyId, 
    voucher_type: 'Purchase' 
  });
  
  const totalSales = salesVouchers.reduce((sum, v) => sum + (v.total_amount || 0), 0);
  const totalPurchases = purchaseVouchers.reduce((sum, v) => sum + (v.total_amount || 0), 0);
  
  res.json({
    total_income: totalSales,
    total_expenses: totalPurchases,
    net_profit: totalSales - totalPurchases
  });
});

app.get('/api/gst-records/:companyId', protect, (req, res) => {
  const records = db.gstRecords.find({ company_id: req.params.companyId });
  res.json(records);
});

app.get('/api/transactions/:companyId', protect, (req, res) => {
  const txs = db.transactions.find({ company_id: req.params.companyId });
  const ledgers = db.ledgers.find({ company_id: req.params.companyId });
  const enrichedTxs = txs.map(t => ({
    ...t,
    ledger_name: ledgers.find(l => l.id === t.ledger_id)?.name || ''
  }));
  res.json(enrichedTxs);
});

app.get('/api/audit-logs/:companyId', protect, (req, res) => {
  const logs = db.auditLogs.find({ company_id: req.params.companyId });
  res.json(logs);
});

app.post('/api/audit-logs', protect, (req, res) => {
  try {
    const log = db.auditLogs.create({
      ...req.body,
      user_id: req.user.id,
      user_name: req.user.name
    });
    res.status(201).json(log);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Mock SmartERP Backend running on port ${PORT}`);
  console.log('✅ No PostgreSQL required - using in-memory database for demonstration!');
  console.log('✅ All features: Masters, Vouchers, Inventory, Invoicing, Reports!');
});

