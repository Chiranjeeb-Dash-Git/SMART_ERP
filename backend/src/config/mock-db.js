
const { v4: uuidv4 } = require('uuid');

let users = [];
let companies = [];
let ledgers = [];
let ledgerGroups = [];
let stockItems = [];
let stockGroups = [];
let units = [];
let vouchers = [];
let voucherItems = [];
let voucherEntries = [];
let invoices = [];
let stockSummary = [];
let transactions = [];
let inventoryTransactions = [];
let gstRecords = [];
let auditLogs = [];

function initDefaults() {
  ledgerGroups = [
    { id: uuidv4(), company_id: 'default', name: 'Assets', parent_id: null, nature: 'Assets', is_default: true },
    { id: uuidv4(), company_id: 'default', name: 'Liabilities', parent_id: null, nature: 'Liabilities', is_default: true },
    { id: uuidv4(), company_id: 'default', name: 'Income', parent_id: null, nature: 'Income', is_default: true },
    { id: uuidv4(), company_id: 'default', name: 'Expenses', parent_id: null, nature: 'Expenses', is_default: true },
    { id: uuidv4(), company_id: 'default', name: 'Current Assets', parent_id: null, nature: 'Assets', is_default: true },
    { id: uuidv4(), company_id: 'default', name: 'Current Liabilities', parent_id: null, nature: 'Liabilities', is_default: true },
    { id: uuidv4(), company_id: 'default', name: 'Sundry Debtors', parent_id: 'Current Assets', nature: 'Assets', is_default: true },
    { id: uuidv4(), company_id: 'default', name: 'Sundry Creditors', parent_id: 'Current Liabilities', nature: 'Liabilities', is_default: true },
    { id: uuidv4(), company_id: 'default', name: 'Bank Accounts', parent_id: 'Current Assets', nature: 'Assets', is_default: true },
    { id: uuidv4(), company_id: 'default', name: 'Cash-in-Hand', parent_id: 'Current Assets', nature: 'Assets', is_default: true },
    { id: uuidv4(), company_id: 'default', name: 'Purchase Accounts', parent_id: 'Expenses', nature: 'Expenses', is_default: true },
    { id: uuidv4(), company_id: 'default', name: 'Sales Accounts', parent_id: 'Income', nature: 'Income', is_default: true },
    { id: uuidv4(), company_id: 'default', name: 'Direct Expenses', parent_id: 'Expenses', nature: 'Expenses', is_default: true },
    { id: uuidv4(), company_id: 'default', name: 'Indirect Expenses', parent_id: 'Expenses', nature: 'Expenses', is_default: true },
    { id: uuidv4(), company_id: 'default', name: 'Direct Incomes', parent_id: 'Income', nature: 'Income', is_default: true },
    { id: uuidv4(), company_id: 'default', name: 'Indirect Incomes', parent_id: 'Income', nature: 'Income', is_default: true },
    { id: uuidv4(), company_id: 'default', name: 'CGST', parent_id: 'Current Liabilities', nature: 'Liabilities', is_default: true },
    { id: uuidv4(), company_id: 'default', name: 'SGST', parent_id: 'Current Liabilities', nature: 'Liabilities', is_default: true },
    { id: uuidv4(), company_id: 'default', name: 'IGST', parent_id: 'Current Liabilities', nature: 'Liabilities', is_default: true },
    { id: uuidv4(), company_id: 'default', name: 'Input CGST', parent_id: 'Current Assets', nature: 'Assets', is_default: true },
    { id: uuidv4(), company_id: 'default', name: 'Input SGST', parent_id: 'Current Assets', nature: 'Assets', is_default: true },
  ];

  units = [
    { id: uuidv4(), company_id: 'default', name: 'Pieces', symbol: 'PCS', description: 'Pieces or units' },
    { id: uuidv4(), company_id: 'default', name: 'Kilograms', symbol: 'KG', description: 'Kilograms' },
    { id: uuidv4(), company_id: 'default', name: 'Grams', symbol: 'G', description: 'Grams' },
    { id: uuidv4(), company_id: 'default', name: 'Meters', symbol: 'M', description: 'Meters' },
    { id: uuidv4(), company_id: 'default', name: 'Liters', symbol: 'LTR', description: 'Liters' },
    { id: uuidv4(), company_id: 'default', name: 'Boxes', symbol: 'BOX', description: 'Boxes' },
    { id: uuidv4(), company_id: 'default', name: 'Nos', symbol: 'NOS', description: 'Numbers' },
  ];

  stockGroups = [
    { id: uuidv4(), company_id: 'default', name: 'Primary', parent_id: null, description: 'Primary stock group' },
    { id: uuidv4(), company_id: 'default', name: 'Electronics', parent_id: 'Primary', description: 'Electronic items' },
    { id: uuidv4(), company_id: 'default', name: 'Furniture', parent_id: 'Primary', description: 'Furniture items' },
    { id: uuidv4(), company_id: 'default', name: 'Groceries', parent_id: 'Primary', description: 'Grocery items' },
    { id: uuidv4(), company_id: 'default', name: 'Medical', parent_id: 'Primary', description: 'Medical supplies' },
    { id: uuidv4(), company_id: 'default', name: 'Raw Materials', parent_id: 'Primary', description: 'Raw materials' },
    { id: uuidv4(), company_id: 'default', name: 'Finished Goods', parent_id: 'Primary', description: 'Finished goods' },
    { id: uuidv4(), company_id: 'default', name: 'Apparel', parent_id: 'Primary', description: 'Clothing and Apparel' },
    { id: uuidv4(), company_id: 'default', name: 'Footwear', parent_id: 'Primary', description: 'Shoes and Footwear' },
  ];
}

initDefaults();

const db = {
  users: {
    find: (query) => users.filter(u => 
      (!query.id || u.id === query.id) && 
      (!query.email || u.email === query.email)
    ),
    findOne: (query) => users.find(u => 
      (!query.id || u.id === query.id) && 
      (!query.email || u.email === query.email)
    ),
    create: (data) => {
      const user = { id: uuidv4(), ...data, created_at: new Date(), updated_at: new Date() };
      users.push(user);
      return user;
    },
  },

  companies: {
    find: (query) => companies.filter(c => (!query.user_id || c.user_id === query.user_id)),
    findOne: (query) => companies.find(c => c.id === query.id),
    create: (data) => {
      const company = { id: uuidv4(), ...data, created_at: new Date(), updated_at: new Date() };
      companies.push(company);
      
      ledgerGroups.filter(g => g.company_id === 'default').forEach(g => {
        ledgerGroups.push({ ...g, id: uuidv4(), company_id: company.id });
      });
      
      units.filter(u => u.company_id === 'default').forEach(u => {
        units.push({ ...u, id: uuidv4(), company_id: company.id });
      });
      
      stockGroups.filter(g => g.company_id === 'default').forEach(g => {
        stockGroups.push({ ...g, id: uuidv4(), company_id: company.id });
      });
      
      const companyLedgerGroups = ledgerGroups.filter(g => g.company_id === company.id);
      const companyUnits = units.filter(u => u.company_id === company.id);
      const companyStockGroups = stockGroups.filter(g => g.company_id === company.id);
      
      const cashGroup = companyLedgerGroups.find(g => g.name === 'Cash-in-Hand');
      const bankGroup = companyLedgerGroups.find(g => g.name === 'Bank Accounts');
      const salesGroup = companyLedgerGroups.find(g => g.name === 'Sales Accounts');
      const purchaseGroup = companyLedgerGroups.find(g => g.name === 'Purchase Accounts');
      const sundryDebtors = companyLedgerGroups.find(g => g.name === 'Sundry Debtors');
      const sundryCreditors = companyLedgerGroups.find(g => g.name === 'Sundry Creditors');
      
      // Default ledgers
      if (cashGroup) {
        ledgers.push({
          id: uuidv4(),
          company_id: company.id,
          name: 'Cash',
          group_id: cashGroup.id,
          opening_balance: 50000,
          opening_balance_type: 'debit',
          is_active: true,
          is_supplier: false,
          is_customer: false,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
      
      if (bankGroup) {
        ledgers.push({
          id: uuidv4(),
          company_id: company.id,
          name: 'HDFC Bank - Current Account',
          group_id: bankGroup.id,
          opening_balance: 150000,
          opening_balance_type: 'debit',
          is_active: true,
          is_supplier: false,
          is_customer: false,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
      
      if (salesGroup) {
        ledgers.push({
          id: uuidv4(),
          company_id: company.id,
          name: 'Sales',
          group_id: salesGroup.id,
          opening_balance: 0,
          opening_balance_type: 'credit',
          is_active: true,
          is_supplier: false,
          is_customer: false,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
      
      if (purchaseGroup) {
        ledgers.push({
          id: uuidv4(),
          company_id: company.id,
          name: 'Purchase',
          group_id: purchaseGroup.id,
          opening_balance: 0,
          opening_balance_type: 'debit',
          is_active: true,
          is_supplier: false,
          is_customer: false,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
      
      // Add customers (Sundry Debtors)
      let customers = [];
      if (sundryDebtors) {
        customers = [
          {
            id: uuidv4(),
            company_id: company.id,
            name: 'Amit Enterprises',
            group_id: sundryDebtors.id,
            opening_balance: 25000,
            opening_balance_type: 'debit',
            address: '123 MG Road, Mumbai',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            gst_number: '27AAECF1234D1Z5',
            phone: '022-23456789',
            mobile: '9876543210',
            email: 'amit@amitenterprises.com',
            is_active: true,
            is_supplier: false,
            is_customer: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: uuidv4(),
            company_id: company.id,
            name: 'Priya Retailers',
            group_id: sundryDebtors.id,
            opening_balance: 15000,
            opening_balance_type: 'debit',
            address: '456 Commercial Street, Bangalore',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001',
            gst_number: '29AAECF5678E2Z6',
            phone: '080-23456789',
            mobile: '9988776655',
            email: 'priya@priyaretailers.com',
            is_active: true,
            is_supplier: false,
            is_customer: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: uuidv4(),
            company_id: company.id,
            name: 'Rohit Traders',
            group_id: sundryDebtors.id,
            opening_balance: 0,
            opening_balance_type: 'debit',
            address: '789 Main Road, Delhi',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001',
            gst_number: '07AAECF9012F3G7',
            phone: '011-23456789',
            mobile: '8877665544',
            email: 'rohit@rohittraders.com',
            is_active: true,
            is_supplier: false,
            is_customer: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ];
        customers.forEach(c => ledgers.push(c));
      }
      
      // Add suppliers (Sundry Creditors)
      let suppliers = [];
      if (sundryCreditors) {
        suppliers = [
          {
            id: uuidv4(),
            company_id: company.id,
            name: 'Suresh Suppliers',
            group_id: sundryCreditors.id,
            opening_balance: 30000,
            opening_balance_type: 'credit',
            address: '321 Industrial Area, Pune',
            city: 'Pune',
            state: 'Maharashtra',
            pincode: '411001',
            gst_number: '27AAECS4321D1Z5',
            phone: '020-23456789',
            mobile: '9123456789',
            email: 'suresh@sureshsuppliers.com',
            is_active: true,
            is_supplier: true,
            is_customer: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: uuidv4(),
            company_id: company.id,
            name: 'Tech Mart Distributors',
            group_id: sundryCreditors.id,
            opening_balance: 10000,
            opening_balance_type: 'credit',
            address: '654 Electronics City, Chennai',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '600001',
            gst_number: '33AAECT8765E2Z6',
            phone: '044-23456789',
            mobile: '9012345678',
            email: 'info@techmart.com',
            is_active: true,
            is_supplier: true,
            is_customer: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ];
        suppliers.forEach(s => ledgers.push(s));
      }
      
      // Add stock items
      const electronicsGroup = companyStockGroups.find(g => g.name === 'Electronics');
      const apparelGroup = companyStockGroups.find(g => g.name === 'Apparel');
      const groceriesGroup = companyStockGroups.find(g => g.name === 'Groceries');
      const pcsUnit = companyUnits.find(u => u.symbol === 'PCS');
      const kgUnit = companyUnits.find(u => u.symbol === 'KG');
      
      let stockItemList = [];
      if (pcsUnit) {
        stockItemList = [
          {
            id: uuidv4(),
            company_id: company.id,
            name: 'Wireless Mouse',
            sku: 'WM-001',
            stock_group_id: electronicsGroup?.id,
            unit_id: pcsUnit.id,
            hsn_code: '847160',
            gst_rate: 18,
            purchase_price: 350,
            selling_price: 599,
            opening_stock: 50,
            opening_rate: 350,
            opening_value: 50 * 350,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: uuidv4(),
            company_id: company.id,
            name: 'USB-C Cable 1m',
            sku: 'UC-101',
            stock_group_id: electronicsGroup?.id,
            unit_id: pcsUnit.id,
            hsn_code: '854442',
            gst_rate: 18,
            purchase_price: 80,
            selling_price: 149,
            opening_stock: 200,
            opening_rate: 80,
            opening_value: 200 * 80,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: uuidv4(),
            company_id: company.id,
            name: 'Bluetooth Headphones',
            sku: 'BH-202',
            stock_group_id: electronicsGroup?.id,
            unit_id: pcsUnit.id,
            hsn_code: '851830',
            gst_rate: 18,
            purchase_price: 1200,
            selling_price: 1999,
            opening_stock: 30,
            opening_rate: 1200,
            opening_value: 30 * 1200,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: uuidv4(),
            company_id: company.id,
            name: 'Cotton T-Shirt (M)',
            sku: 'TS-M-001',
            stock_group_id: apparelGroup?.id,
            unit_id: pcsUnit.id,
            hsn_code: '610910',
            gst_rate: 5,
            purchase_price: 250,
            selling_price: 499,
            opening_stock: 100,
            opening_rate: 250,
            opening_value: 100 * 250,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: uuidv4(),
            company_id: company.id,
            name: 'Jeans (Blue, 32)',
            sku: 'JN-B-32',
            stock_group_id: apparelGroup?.id,
            unit_id: pcsUnit.id,
            hsn_code: '610423',
            gst_rate: 12,
            purchase_price: 600,
            selling_price: 1199,
            opening_stock: 40,
            opening_rate: 600,
            opening_value: 40 * 600,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ];
        stockItemList.forEach(item => {
          stockItems.push(item);
          stockSummary.push({
            id: uuidv4(),
            company_id: company.id,
            item_id: item.id,
            quantity: item.opening_stock,
            reserved_stock: 0,
            damaged_stock: 0,
            available_stock: item.opening_stock,
            rate: item.opening_rate,
            amount: item.opening_value,
            created_at: new Date(),
            updated_at: new Date(),
          });
        });
      }
      
      // Add sample vouchers
      const sampleVouchers = [];
      const salesLedger = ledgers.find(l => l.name === 'Sales' && l.company_id === company.id);
      const purchaseLedger = ledgers.find(l => l.name === 'Purchase' && l.company_id === company.id);
      
      if (customers.length > 0 && stockItemList.length > 0 && salesLedger) {
        // Sample Sales Voucher to Amit Enterprises
        const salesDate = new Date();
        salesDate.setDate(salesDate.getDate() - 5);
        
        const salesItems = [
          {
            item_id: stockItemList[0].id,
            quantity: 5,
            rate: stockItemList[0].selling_price,
            amount: 5 * stockItemList[0].selling_price,
            gst_rate: stockItemList[0].gst_rate,
            total_amount: 5 * stockItemList[0].selling_price * (1 + stockItemList[0].gst_rate/100),
          },
          {
            item_id: stockItemList[1].id,
            quantity: 20,
            rate: stockItemList[1].selling_price,
            amount: 20 * stockItemList[1].selling_price,
            gst_rate: stockItemList[1].gst_rate,
            total_amount: 20 * stockItemList[1].selling_price * (1 + stockItemList[1].gst_rate/100),
          },
        ];
        
        const totalTaxable = salesItems.reduce((sum, i) => sum + i.amount, 0);
        const totalGst = salesItems.reduce((sum, i) => sum + (i.amount * i.gst_rate / 100), 0);
        
        sampleVouchers.push({
          id: uuidv4(),
          voucher_number: 'SAL-00001',
          company_id: company.id,
          voucher_type: 'Sales',
          date: salesDate.toISOString().split('T')[0],
          party_ledger_id: customers[0].id,
          narration: 'Sale of wireless mouse and USB cables to Amit Enterprises - Order #AMIT-001',
          total_amount: totalTaxable + totalGst,
          taxable_amount: totalTaxable,
          total_gst: totalGst,
          status: 'pending',
          items: salesItems,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
      
      if (suppliers.length > 0 && stockItemList.length > 0 && purchaseLedger) {
        // Sample Purchase Voucher from Suresh Suppliers
        const purchaseDate = new Date();
        purchaseDate.setDate(purchaseDate.getDate() - 7);
        
        const purchaseItems = [
          {
            item_id: stockItemList[1].id,
            quantity: 100,
            rate: stockItemList[1].purchase_price,
            amount: 100 * stockItemList[1].purchase_price,
            gst_rate: stockItemList[1].gst_rate,
            total_amount: 100 * stockItemList[1].purchase_price * (1 + stockItemList[1].gst_rate/100),
          },
          {
            item_id: stockItemList[3].id,
            quantity: 50,
            rate: stockItemList[3].purchase_price,
            amount: 50 * stockItemList[3].purchase_price,
            gst_rate: stockItemList[3].gst_rate,
            total_amount: 50 * stockItemList[3].purchase_price * (1 + stockItemList[3].gst_rate/100),
          },
        ];
        
        const totalTaxable = purchaseItems.reduce((sum, i) => sum + i.amount, 0);
        const totalGst = purchaseItems.reduce((sum, i) => sum + (i.amount * i.gst_rate / 100), 0);
        
        sampleVouchers.push({
          id: uuidv4(),
          voucher_number: 'PUR-00001',
          company_id: company.id,
          voucher_type: 'Purchase',
          date: purchaseDate.toISOString().split('T')[0],
          party_ledger_id: suppliers[0].id,
          narration: 'Purchase of USB-C cables and T-shirts from Suresh Suppliers - Invoice #SUP-1023',
          total_amount: totalTaxable + totalGst,
          taxable_amount: totalTaxable,
          total_gst: totalGst,
          status: 'pending',
          items: purchaseItems,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
      
      // Create sample vouchers using vouchers.create method
      sampleVouchers.forEach(v => {
        const voucherData = { ...v };
        const count = vouchers.filter(vch => vch.company_id === company.id && vch.voucher_type === voucherData.voucher_type).length;
        const prefix = voucherData.voucher_type.substring(0, 3).toUpperCase();
        const voucherNumber = `${prefix}-${String(count + 1).padStart(5, '0')}`;
        voucherData.voucher_number = voucherNumber;
        
        const voucher = {
          id: uuidv4(),
          voucher_number: voucherData.voucher_number,
          company_id: voucherData.company_id,
          voucher_type: voucherData.voucher_type,
          date: voucherData.date,
          party_ledger_id: voucherData.party_ledger_id,
          narration: voucherData.narration,
          total_amount: voucherData.total_amount,
          taxable_amount: voucherData.taxable_amount,
          total_gst: voucherData.total_gst,
          status: voucherData.status,
          created_at: new Date(),
          updated_at: new Date(),
        };
        
        vouchers.push(voucher);
        
        if (voucherData.items && voucherData.items.length > 0) {
          voucherData.items.forEach(item => {
            voucherItems.push({
              id: uuidv4(),
              voucher_id: voucher.id,
              item_id: item.item_id,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
              gst_rate: item.gst_rate,
              total_amount: item.total_amount,
              created_at: new Date(),
            });
            
            if (item.item_id) {
              let summary = stockSummary.find(s => s.item_id === item.item_id && s.company_id === voucherData.company_id);
              if (summary) {
                const qtyChange = (voucherData.voucher_type === 'Purchase' || voucherData.voucher_type === 'Debit Note') 
                  ? item.quantity 
                  : -item.quantity;
                summary.quantity += qtyChange;
                summary.available_stock += qtyChange;
                summary.updated_at = new Date();
              }
              
              inventoryTransactions.push({
                id: uuidv4(),
                company_id: voucherData.company_id,
                item_id: item.item_id,
                transaction_type: (voucherData.voucher_type === 'Purchase' || voucherData.voucher_type === 'Debit Note') ? 'IN' : 'OUT',
                transaction_date: voucherData.date,
                quantity: item.quantity,
                rate: item.rate,
                amount: item.total_amount,
                voucher_id: voucher.id,
                narration: voucherData.narration,
                created_at: new Date(),
              });
            }
          });
        }
        
        if (voucherData.voucher_type === 'Sales' || voucherData.voucher_type === 'Purchase') {
          const invCount = invoices.filter(i => i.company_id === voucherData.company_id && i.invoice_type === voucherData.voucher_type).length;
          invoices.push({
            id: uuidv4(),
            company_id: voucherData.company_id,
            voucher_id: voucher.id,
            invoice_number: `${voucherData.voucher_type.substring(0, 3).toUpperCase()}-INV-${String(invCount + 1).padStart(5, '0')}`,
            invoice_type: voucherData.voucher_type,
            date: voucherData.date,
            party_ledger_id: voucherData.party_ledger_id,
            taxable_amount: voucherData.taxable_amount || 0,
            total_gst: voucherData.total_gst || 0,
            total_amount: voucherData.total_amount || 0,
            paid_amount: 0,
            balance_amount: voucherData.total_amount || 0,
            status: 'unpaid',
            created_at: new Date(),
            updated_at: new Date(),
          });
        }
      });
      
      return company;
    },
    update: (id, data) => {
      const idx = companies.findIndex(c => c.id === id);
      if (idx !== -1) {
        companies[idx] = { ...companies[idx], ...data, updated_at: new Date() };
        return companies[idx];
      }
      return null;
    },
    delete: (id) => {
      companies = companies.filter(c => c.id !== id);
    },
  },

  ledgers: {
    find: (query) => {
      let results = ledgers.filter(l => l.company_id === query.company_id);
      if (query.search) {
        results = results.filter(l => l.name.toLowerCase().includes(query.search.toLowerCase()));
      }
      if (query.is_customer) {
        results = results.filter(l => l.is_customer === true);
      }
      if (query.is_supplier) {
        results = results.filter(l => l.is_supplier === true);
      }
      return results;
    },
    findOne: (query) => ledgers.find(l => l.id === query.id),
    create: (data) => {
      const ledger = { id: uuidv4(), ...data, created_at: new Date(), updated_at: new Date() };
      ledgers.push(ledger);
      return ledger;
    },
    update: (id, data) => {
      const idx = ledgers.findIndex(l => l.id === id);
      if (idx !== -1) {
        ledgers[idx] = { ...ledgers[idx], ...data, updated_at: new Date() };
        return ledgers[idx];
      }
      return null;
    },
    delete: (id) => {
      ledgers = ledgers.filter(l => l.id !== id);
    },
  },

  ledgerGroups: {
    find: (query) => ledgerGroups.filter(g => g.company_id === query.company_id),
    findOne: (query) => ledgerGroups.find(g => g.id === query.id),
    create: (data) => {
      const group = { id: uuidv4(), ...data, created_at: new Date(), updated_at: new Date() };
      ledgerGroups.push(group);
      return group;
    },
    update: (id, data) => {
      const idx = ledgerGroups.findIndex(g => g.id === id);
      if (idx !== -1) {
        ledgerGroups[idx] = { ...ledgerGroups[idx], ...data, updated_at: new Date() };
        return ledgerGroups[idx];
      }
      return null;
    },
    delete: (id) => {
      ledgerGroups = ledgerGroups.filter(g => g.id !== id);
    },
  },

  stockItems: {
    find: (query) => {
      let results = stockItems.filter(i => i.company_id === query.company_id);
      if (query.search) {
        results = results.filter(i => 
          i.name.toLowerCase().includes(query.search.toLowerCase()) ||
          i.sku?.toLowerCase().includes(query.search.toLowerCase())
        );
      }
      return results;
    },
    findOne: (query) => stockItems.find(i => i.id === query.id),
    create: (data) => {
      const item = { id: uuidv4(), ...data, created_at: new Date(), updated_at: new Date() };
      stockItems.push(item);
      
      if ((data.opening_stock || 0) > 0) {
        stockSummary.push({
          id: uuidv4(),
          company_id: data.company_id,
          item_id: item.id,
          quantity: data.opening_stock || 0,
          reserved_stock: 0,
          damaged_stock: 0,
          available_stock: data.opening_stock || 0,
          rate: data.opening_rate || 0,
          amount: (data.opening_stock || 0) * (data.opening_rate || 0),
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
      
      return item;
    },
    update: (id, data) => {
      const idx = stockItems.findIndex(i => i.id === id);
      if (idx !== -1) {
        stockItems[idx] = { ...stockItems[idx], ...data, updated_at: new Date() };
        return stockItems[idx];
      }
      return null;
    },
    delete: (id) => {
      stockItems = stockItems.filter(i => i.id !== id);
      stockSummary = stockSummary.filter(s => s.item_id !== id);
    },
  },

  stockGroups: {
    find: (query) => stockGroups.filter(g => g.company_id === query.company_id),
    findOne: (query) => stockGroups.find(g => g.id === query.id),
    create: (data) => {
      const group = { id: uuidv4(), ...data, created_at: new Date(), updated_at: new Date() };
      stockGroups.push(group);
      return group;
    },
    update: (id, data) => {
      const idx = stockGroups.findIndex(g => g.id === id);
      if (idx !== -1) {
        stockGroups[idx] = { ...stockGroups[idx], ...data, updated_at: new Date() };
        return stockGroups[idx];
      }
      return null;
    },
    delete: (id) => {
      stockGroups = stockGroups.filter(g => g.id !== id);
    },
  },

  units: {
    find: (query) => units.filter(u => u.company_id === query.company_id),
    create: (data) => {
      const unit = { id: uuidv4(), ...data, created_at: new Date(), updated_at: new Date() };
      units.push(unit);
      return unit;
    },
    update: (id, data) => {
      const idx = units.findIndex(u => u.id === id);
      if (idx !== -1) {
        units[idx] = { ...units[idx], ...data, updated_at: new Date() };
        return units[idx];
      }
      return null;
    },
    delete: (id) => {
      units = units.filter(u => u.id !== id);
    },
  },

  vouchers: {
    find: (query) => {
      let results = vouchers.filter(v => v.company_id === query.company_id);
      if (query.voucher_type) {
        results = results.filter(v => v.voucher_type === query.voucher_type);
      }
      return results;
    },
    findOne: (query) => vouchers.find(v => v.id === query.id),
    create: (data) => {
      const count = vouchers.filter(v => v.company_id === data.company_id && v.voucher_type === data.voucher_type).length;
      const prefix = data.voucher_type.substring(0, 3).toUpperCase();
      const voucherNumber = `${prefix}-${String(count + 1).padStart(5, '0')}`;
      
      const voucher = { 
        id: uuidv4(), 
        voucher_number: voucherNumber,
        ...data, 
        created_at: new Date(), 
        updated_at: new Date() 
      };
      
      vouchers.push(voucher);
      
      if (data.items && data.items.length > 0) {
        data.items.forEach(item => {
          voucherItems.push({
            id: uuidv4(),
            voucher_id: voucher.id,
            ...item,
            created_at: new Date(),
          });
          
          if (item.item_id) {
            let summary = stockSummary.find(s => s.item_id === item.item_id && s.company_id === data.company_id);
            if (summary) {
              const qtyChange = (data.voucher_type === 'Purchase' || data.voucher_type === 'Debit Note') 
                ? item.quantity 
                : -item.quantity;
              summary.quantity += qtyChange;
              summary.available_stock += qtyChange;
              summary.updated_at = new Date();
            }
            
            inventoryTransactions.push({
              id: uuidv4(),
              company_id: data.company_id,
              item_id: item.item_id,
              transaction_type: (data.voucher_type === 'Purchase' || data.voucher_type === 'Debit Note') ? 'IN' : 'OUT',
              transaction_date: data.date,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.total_amount,
              voucher_id: voucher.id,
              created_at: new Date(),
            });
          }
        });
      }
      
      if (data.entries && data.entries.length > 0) {
        data.entries.forEach(entry => {
          voucherEntries.push({
            id: uuidv4(),
            voucher_id: voucher.id,
            ...entry,
            created_at: new Date(),
          });
        });
      }
      
      if (data.voucher_type === 'Sales' || data.voucher_type === 'Purchase') {
        const invCount = invoices.filter(i => i.company_id === data.company_id && i.invoice_type === data.voucher_type).length;
        invoices.push({
          id: uuidv4(),
          company_id: data.company_id,
          voucher_id: voucher.id,
          invoice_number: `${data.voucher_type.substring(0, 3).toUpperCase()}-INV-${String(invCount + 1).padStart(5, '0')}`,
          invoice_type: data.voucher_type,
          date: data.date,
          due_date: data.due_date,
          party_ledger_id: data.party_ledger_id,
          taxable_amount: data.taxable_amount || 0,
          total_gst: data.total_gst || 0,
          total_amount: data.total_amount || 0,
          paid_amount: 0,
          balance_amount: data.total_amount || 0,
          status: 'unpaid',
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
      
      return voucher;
    },
  },

  voucherItems: {
    find: (query) => voucherItems.filter(i => i.voucher_id === query.voucher_id),
    create: (data) => {
      const item = { id: uuidv4(), ...data, created_at: new Date() };
      voucherItems.push(item);
      return item;
    },
  },

  voucherEntries: {
    find: (query) => voucherEntries.filter(e => e.voucher_id === query.voucher_id),
  },

  invoices: {
    find: (query) => {
      let results = invoices.filter(i => i.company_id === query.company_id);
      if (query.invoice_type) {
        results = results.filter(i => i.invoice_type === query.invoice_type);
      }
      return results;
    },
    findOne: (query) => invoices.find(i => i.id === query.id),
    create: (data) => {
      const invoice = { id: uuidv4(), ...data, created_at: new Date(), updated_at: new Date() };
      invoices.push(invoice);
      return invoice;
    },
  },

  stockSummary: {
    find: (query) => {
      let results = stockSummary.filter(s => s.company_id === query.company_id);
      if (query.item_id) {
        results = results.filter(s => s.item_id === query.item_id);
      }
      return results;
    },
    update: (id, data) => {
      const idx = stockSummary.findIndex(s => s.id === id);
      if (idx !== -1) {
        stockSummary[idx] = { ...stockSummary[idx], ...data, updated_at: new Date() };
        return stockSummary[idx];
      }
      return null;
    },
  },

  transactions: {
    find: (query) => transactions.filter(t => t.company_id === query.company_id),
    create: (data) => {
      const tx = { id: uuidv4(), ...data, created_at: new Date() };
      transactions.push(tx);
      return tx;
    },
  },

  inventoryTransactions: {
    find: (query) => {
      let results = inventoryTransactions.filter(t => t.company_id === query.company_id);
      if (query.item_id) {
        results = results.filter(t => t.item_id === query.item_id);
      }
      return results;
    },
    create: (data) => {
      const tx = { id: uuidv4(), ...data, created_at: new Date() };
      inventoryTransactions.push(tx);
      return tx;
    },
  },

  gstRecords: {
    find: (query) => gstRecords.filter(g => g.company_id === query.company_id),
  },

  auditLogs: {
    find: (query) => auditLogs.filter(a => (!query.company_id || a.company_id === query.company_id)),
    create: (data) => {
      const log = { id: uuidv4(), ...data, created_at: new Date() };
      auditLogs.push(log);
      return log;
    },
  },
};

module.exports = db;
