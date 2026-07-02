
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SmartERP Backend is running!' });
});

const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const ledgerRoutes = require('./routes/ledgers');
const stockItemRoutes = require('./routes/stockItems');
const stockGroupRoutes = require('./routes/stockGroups');
const unitRoutes = require('./routes/units');
const voucherRoutes = require('./routes/vouchers');
const invoiceRoutes = require('./routes/invoices');
const transactionRoutes = require('./routes/transactions');
const inventoryTransactionRoutes = require('./routes/inventoryTransactions');
const gstRecordRoutes = require('./routes/gstRecords');
const auditLogRoutes = require('./routes/auditLogs');
const reportsRoutes = require('./routes/reports');

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/ledgers', ledgerRoutes);
app.use('/api/stock-items', stockItemRoutes);
app.use('/api/stock-groups', stockGroupRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/inventory-transactions', inventoryTransactionRoutes);
app.use('/api/gst-records', gstRecordRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/reports', reportsRoutes);

// Alias routes for compatibility
app.use('/api/items', stockItemRoutes);
app.use('/api/customers', ledgerRoutes);
app.use('/api/suppliers', ledgerRoutes);
app.use('/api/stock-summary', stockItemRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
