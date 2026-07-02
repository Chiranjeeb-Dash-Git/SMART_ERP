
const API_BASE = 'http://localhost:5001/api';

export interface AuthResponse {
  id: string;
  email: string;
  name: string;
  token: string;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  gst_number?: string;
  pan_number?: string;
  financial_year_start?: string;
  financial_year_end?: string;
  phone?: string;
  email?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface LedgerGroup {
  id: string;
  company_id: string;
  name: string;
  parent_id?: string;
  nature?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ledger {
  id: string;
  company_id: string;
  name: string;
  group_id: string;
  opening_balance: number;
  opening_balance_type: 'debit' | 'credit';
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  gst_number?: string;
  pan_number?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  credit_limit?: number;
  credit_days?: number;
  is_active: boolean;
  is_supplier: boolean;
  is_customer: boolean;
  group_name?: string;
  created_at: string;
  updated_at: string;
}

export interface StockGroup {
  id: string;
  company_id: string;
  name: string;
  parent_id?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  company_id: string;
  name: string;
  symbol: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface StockItem {
  id: string;
  company_id: string;
  name: string;
  sku?: string;
  stock_group_id?: string;
  unit_id?: string;
  hsn_code?: string;
  gst_rate: number;
  igst_rate?: number;
  cgst_rate?: number;
  sgst_rate?: number;
  purchase_price?: number;
  selling_price?: number;
  opening_stock: number;
  opening_rate: number;
  opening_value: number;
  reorder_level?: number;
  description?: string;
  is_active: boolean;
  unit_symbol?: string;
  stock_group_name?: string;
  current_stock?: number;
  reserved_stock?: number;
  damaged_stock?: number;
  available_stock?: number;
  created_at: string;
  updated_at: string;
}

export interface VoucherEntry {
  id: string;
  voucher_id: string;
  ledger_id: string;
  debit: number;
  credit: number;
  ledger_name?: string;
  created_at: string;
}

export interface VoucherItem {
  id: string;
  voucher_id: string;
  item_id?: string;
  ledger_id?: string;
  description?: string;
  quantity: number;
  rate: number;
  discount_percent?: number;
  discount_amount?: number;
  amount: number;
  hsn_code?: string;
  gst_rate?: number;
  igst_amount?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  total_amount: number;
  item_name?: string;
  unit?: string;
  created_at: string;
}

export interface Voucher {
  id: string;
  company_id: string;
  voucher_number: string;
  voucher_type: string;
  date: string;
  due_date?: string;
  reference_number?: string;
  party_ledger_id?: string;
  sales_account_id?: string;
  purchase_account_id?: string;
  narration?: string;
  total_amount: number;
  taxable_amount?: number;
  total_gst?: number;
  round_off?: number;
  status: string;
  created_by?: string;
  party_name?: string;
  entries?: VoucherEntry[];
  items?: VoucherItem[];
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  company_id: string;
  invoice_number: string;
  invoice_type: string;
  voucher_id?: string;
  date: string;
  due_date?: string;
  party_ledger_id?: string;
  billing_address?: string;
  shipping_address?: string;
  taxable_amount: number;
  igst_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  total_gst: number;
  round_off: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: string;
  notes?: string;
  terms?: string;
  party_name?: string;
  party_address?: string;
  party_gst?: string;
  company_name?: string;
  company_address?: string;
  company_gst?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  company_id: string;
  transaction_type: string;
  transaction_date: string;
  reference_number?: string;
  ledger_id?: string;
  amount: number;
  debit_credit: 'debit' | 'credit';
  voucher_id?: string;
  invoice_id?: string;
  narration?: string;
  ledger_name?: string;
  created_at: string;
}

export interface InventoryTransaction {
  id: string;
  company_id: string;
  item_id: string;
  transaction_type: string;
  transaction_date: string;
  quantity: number;
  rate: number;
  amount: number;
  voucher_id?: string;
  reference_number?: string;
  narration?: string;
  item_name?: string;
  unit_symbol?: string;
  created_at: string;
}

export interface GstRecord {
  id: string;
  company_id: string;
  voucher_id?: string;
  invoice_id?: string;
  transaction_date: string;
  gst_type: string;
  hsn_code?: string;
  taxable_amount: number;
  gst_rate: number;
  igst_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  total_gst: number;
  place_of_supply?: string;
  reverse_charge: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  company_id?: string;
  user_id?: string;
  action: string;
  module?: string;
  record_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  user_name?: string;
  created_at: string;
}

export type Item = StockItem;

const api = {
  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  },

  async register(data: { email: string; password: string; name: string }): Promise<AuthResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getCompanies(): Promise<Company[]> {
    return this.request('/companies');
  },

  async createCompany(data: Partial<Company>): Promise<Company> {
    return this.request('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCompany(id: string, data: Partial<Company>): Promise<Company> {
    return this.request(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteCompany(id: string): Promise<void> {
    return this.request(`/companies/${id}`, { method: 'DELETE' });
  },

  async getLedgerGroups(companyId: string): Promise<LedgerGroup[]> {
    return this.request(`/ledgers/groups/${companyId}`);
  },

  async getLedgers(companyId: string, filters?: { 
    search?: string; 
    is_customer?: boolean; 
    is_supplier?: boolean;
  }): Promise<Ledger[]> {
    let url = `/ledgers/${companyId}`;
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.is_customer !== undefined) params.append('is_customer', String(filters.is_customer));
    if (filters?.is_supplier !== undefined) params.append('is_supplier', String(filters.is_supplier));
    if (params.toString()) url += `?${params.toString()}`;
    return this.request(url);
  },

  async getLedger(companyId: string, id: string): Promise<Ledger> {
    return this.request(`/ledgers/${companyId}/${id}`);
  },

  async createLedger(data: Partial<Ledger>): Promise<Ledger> {
    return this.request('/ledgers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateLedger(id: string, data: Partial<Ledger>): Promise<Ledger> {
    return this.request(`/ledgers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteLedger(id: string): Promise<void> {
    return this.request(`/ledgers/${id}`, { method: 'DELETE' });
  },

  async getCustomers(companyId: string): Promise<Ledger[]> {
    return this.request(`/customers/${companyId}`);
  },

  async getSuppliers(companyId: string): Promise<Ledger[]> {
    return this.request(`/suppliers/${companyId}`);
  },

  async getUnits(companyId: string): Promise<Unit[]> {
    return this.request(`/units/${companyId}`);
  },

  async createUnit(data: Partial<Unit>): Promise<Unit> {
    return this.request('/units', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateUnit(id: string, data: Partial<Unit>): Promise<Unit> {
    return this.request(`/units/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteUnit(id: string): Promise<void> {
    return this.request(`/units/${id}`, { method: 'DELETE' });
  },

  async getStockGroups(companyId: string): Promise<StockGroup[]> {
    return this.request(`/stock-groups/${companyId}`);
  },

  async getStockItems(companyId: string, search?: string): Promise<StockItem[]> {
    let url = `/stock-items/${companyId}`;
    if (search) url += `?search=${encodeURIComponent(search)}`;
    return this.request(url);
  },

  async getStockItem(companyId: string, id: string): Promise<StockItem> {
    return this.request(`/stock-items/${companyId}/${id}`);
  },

  async createStockItem(data: Partial<StockItem>): Promise<StockItem> {
    return this.request('/stock-items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateStockItem(id: string, data: Partial<StockItem>): Promise<StockItem> {
    return this.request(`/stock-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteStockItem(id: string): Promise<void> {
    return this.request(`/stock-items/${id}`, { method: 'DELETE' });
  },

  // Aliases for ItemsPage compatibility
  getItems: (companyId: string, search?: string) => this.getStockItems(companyId, search),
  createItem: (data: Partial<Item>) => this.createStockItem(data),
  updateItem: (id: string, data: Partial<Item>) => this.updateStockItem(id, data),
  deleteItem: (id: string) => this.deleteStockItem(id),

  async getStockSummary(companyId: string): Promise<StockItem[]> {
    return this.request(`/stock-summary/${companyId}`);
  },

  async getVouchers(companyId: string, type?: string): Promise<Voucher[]> {
    const url = type ? `/vouchers/${companyId}?type=${encodeURIComponent(type)}` : `/vouchers/${companyId}`;
    return this.request(url);
  },

  async getVoucher(companyId: string, id: string): Promise<Voucher> {
    return this.request(`/vouchers/${companyId}/${id}`);
  },

  async createVoucher(data: Partial<Voucher>): Promise<Voucher> {
    return this.request('/vouchers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async downloadVoucherPdf(companyId: string, id: string): Promise<void> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/vouchers/${companyId}/${id}/pdf`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voucher-${id}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  async exportVouchersExcel(companyId: string, type?: string): Promise<void> {
    const token = localStorage.getItem('token');
    let url = `${API_BASE}/vouchers/${companyId}/export-excel`;
    if (type) url += `?type=${encodeURIComponent(type)}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const blob = await response.blob();
    const urlObj = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlObj;
    a.download = `vouchers-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(urlObj);
  },

  async getInvoices(companyId: string, type?: string): Promise<Invoice[]> {
    const url = type ? `/invoices/${companyId}?type=${encodeURIComponent(type)}` : `/invoices/${companyId}`;
    return this.request(url);
  },

  async getInvoice(companyId: string, id: string): Promise<Invoice> {
    return this.request(`/invoices/${companyId}/${id}`);
  },

  async downloadInvoicePdf(companyId: string, id: string): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/invoices/${companyId}/${id}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF download failed:', response.status, errorText);
        alert(`Failed to download invoice PDF: ${response.status} ${response.statusText}`);
        return;
      }
      
      const blob = await response.blob();
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = `invoice-${id}.pdf`;
      a.click();
    } catch (err) {
      console.error('Error downloading invoice PDF:', err);
      alert('Error downloading invoice PDF. Please check console for details.');
    }
  },

  async getInventoryTransactions(companyId: string, filters?: { 
    item_id?: string; 
  }): Promise<InventoryTransaction[]> {
    let url = `/inventory-transactions/${companyId}`;
    const params = new URLSearchParams();
    if (filters?.item_id) params.append('item_id', filters.item_id);
    if (params.toString()) url += `?${params.toString()}`;
    return this.request(url);
  },

  async createInventoryTransaction(data: Partial<InventoryTransaction>): Promise<InventoryTransaction> {
    return this.request('/inventory-transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getStockSummaryReport(companyId: string): Promise<any[]> {
    return this.request(`/reports/${companyId}/stock-summary`);
  },

  async getSalesSummaryReport(companyId: string): Promise<any> {
    return this.request(`/reports/${companyId}/sales-summary`);
  },

  async getPurchaseSummaryReport(companyId: string): Promise<any> {
    return this.request(`/reports/${companyId}/purchase-summary`);
  },

  async getProfitLossReport(companyId: string): Promise<any> {
    return this.request(`/reports/${companyId}/profit-loss`);
  },

  async getAuditLogs(companyId: string): Promise<AuditLog[]> {
    return this.request(`/audit-logs/${companyId}`);
  },

  async createAuditLog(data: Partial<AuditLog>): Promise<AuditLog> {
    return this.request('/audit-logs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getGstRecords(companyId: string): Promise<GstRecord[]> {
    return this.request(`/gst-records/${companyId}`);
  },

  async getTransactions(companyId: string): Promise<Transaction[]> {
    return this.request(`/transactions/${companyId}`);
  },
};

export default api;
