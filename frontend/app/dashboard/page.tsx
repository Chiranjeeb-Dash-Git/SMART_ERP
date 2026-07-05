'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import api, { Ledger, StockItem, LedgerGroup, Unit, StockGroup, Voucher } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';

export default function DashboardPage() {
  const { user, selectedCompany } = useApp();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showStockItemModal, setShowStockItemModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [editingLedger, setEditingLedger] = useState<Ledger | null>(null);
  const [editingStockItem, setEditingStockItem] = useState<StockItem | null>(null);
  const [ledgerGroups, setLedgerGroups] = useState<LedgerGroup[]>([]);
  const [stockGroups, setStockGroups] = useState<StockGroup[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  
  const [voucherFormData, setVoucherFormData] = useState<Partial<Voucher>>({
    voucher_type: 'Sales',
    date: new Date().toISOString().split('T')[0],
    party_ledger_id: '',
    narration: '',
    items: []
  });
  
  const [ledgerFormData, setLedgerFormData] = useState<Partial<Ledger>>({
    name: '', group_id: '', opening_balance: 0, opening_balance_type: 'debit',
    is_active: true, is_supplier: false, is_customer: false
  });
  
  const [stockFormData, setStockFormData] = useState<Partial<StockItem>>({
    name: '', stock_group_id: '', unit_id: '', hsn_code: '', gst_rate: 0,
    purchase_price: 0, selling_price: 0, opening_stock: 0, opening_rate: 0, opening_value: 0,
    is_active: true
  });

  const loadData = useCallback(async () => {
    if (!selectedCompany) return;
    try {
      const [groupsData, stockGroupsData, unitsData, ledgersData, vouchersData, stockItemsData] = await Promise.all([
        api.getLedgerGroups(selectedCompany!.id),
        api.getStockGroups(selectedCompany!.id),
        api.getUnits(selectedCompany!.id),
        api.getLedgers(selectedCompany!.id),
        api.getVouchers(selectedCompany!.id),
        api.getStockItems(selectedCompany!.id)
      ]);
      setLedgerGroups(groupsData);
      setStockGroups(stockGroupsData);
      setUnits(unitsData);
      setLedgers(ledgersData);
      setVouchers(vouchersData);
      setStockItems(stockItemsData);
    } catch (err) {
      console.error(err);
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    if (!selectedCompany) {
      router.push('/companies');
      return;
    }
    loadData();
  }, [user, selectedCompany, router, loadData]);

  const handleLedgerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLedger) {
        await api.updateLedger(editingLedger.id, ledgerFormData);
      } else {
        await api.createLedger({ ...ledgerFormData, company_id: selectedCompany!.id });
      }
      setShowLedgerModal(false);
      setEditingLedger(null);
      resetLedgerForm();
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetLedgerForm = () => {
    setLedgerFormData({ name: '', group_id: '', opening_balance: 0, opening_balance_type: 'debit', is_active: true, is_supplier: false, is_customer: false });
  };

  const handleStockItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStockItem) {
        await api.updateStockItem(editingStockItem.id, stockFormData);
      } else {
        await api.createStockItem({ ...stockFormData, company_id: selectedCompany!.id });
      }
      setShowStockItemModal(false);
      setEditingStockItem(null);
      resetStockItemForm();
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetStockItemForm = () => {
    setStockFormData({ name: '', stock_group_id: '', unit_id: '', hsn_code: '', gst_rate: 0, purchase_price: 0, selling_price: 0, opening_stock: 0, opening_rate: 0, opening_value: 0, is_active: true });
  };

  const handleVoucherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createVoucher({ ...voucherFormData, company_id: selectedCompany!.id });
      setShowVoucherModal(false);
      resetVoucherForm();
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetVoucherForm = () => {
    setVoucherFormData({
      voucher_type: 'Sales',
      date: new Date().toISOString().split('T')[0],
      party_ledger_id: '',
      narration: '',
      items: []
    });
  };

  const calculateStats = () => {
    const totalVouchers = vouchers.length;
    const salesVouchers = vouchers.filter(v => v.voucher_type === 'Sales');
    const totalSales = salesVouchers.reduce((sum, v) => sum + (v.total_amount || 0), 0);
    const totalStockValue = stockItems.reduce((sum, item) => sum + (item.opening_value || 0), 0);
    const activeLedgers = ledgers.filter(l => l.is_active).length;

    return {
      totalVouchers,
      totalSales,
      totalStockValue,
      activeLedgers
    };
  };

  const stats = calculateStats();

  if (!isClient || !user || !selectedCompany) return null;

  return (
    <div className="erp-page-container flex flex-row p-0">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--erp-bg)]">
        
        <header className="erp-header relative overflow-hidden">
          {/* Subtle decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--erp-teal)] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          
          <div className="flex justify-between items-start w-full relative z-10">
            <div className="flex flex-col gap-4 w-full">
              <div className="flex justify-between items-end w-full">
                <div>
                  <h2 className="text-4xl font-black text-[var(--erp-teal)] tracking-tight mb-1">{selectedCompany.name}</h2>
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
                    Dashboard Showcase • {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => { setEditingLedger(null); resetLedgerForm(); setShowLedgerModal(true); }} className="erp-btn erp-btn-secondary">
                    + Create Ledger
                  </button>
                  <button onClick={() => { setEditingStockItem(null); resetStockItemForm(); setShowStockItemModal(true); }} className="erp-btn erp-btn-secondary">
                    + Add Item
                  </button>
                  <button onClick={() => { resetVoucherForm(); setShowVoucherModal(true); }} className="erp-btn erp-btn-primary shadow-lg shadow-teal-900/20">
                    + Create Voucher
                  </button>
                </div>
              </div>

              {/* Cinematic Company Details Card */}
              <div className="mt-4 p-6 rounded-2xl bg-[var(--erp-teal)] border-transparent shadow-xl shadow-teal-900/10 flex gap-12 items-center">
                <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <div className="text-xs font-bold text-teal-100 uppercase mb-1 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">pin_drop</span> Address</div>
                    <div className="text-sm font-medium text-white leading-snug">{selectedCompany.address || '-'}, {selectedCompany.city || ''} <br/> {selectedCompany.state || ''} {selectedCompany.pincode || ''}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-teal-100 uppercase mb-1 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">account_balance</span> Tax Info</div>
                    <div className="text-sm font-medium text-white"><span className="text-teal-200">GST:</span> {selectedCompany.gst_number || '-'}</div>
                    <div className="text-sm font-medium text-white"><span className="text-teal-200">PAN:</span> {selectedCompany.pan_number || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-teal-100 uppercase mb-1 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">contact_mail</span> Contact</div>
                    <div className="text-sm font-medium text-white">{selectedCompany.email || '-'}</div>
                    <div className="text-sm font-medium text-white">{selectedCompany.phone || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-teal-100 uppercase mb-1 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">calendar_today</span> Financial Year</div>
                    <div className="text-sm font-medium text-white bg-white/10 inline-block px-2 py-1 rounded border border-transparent mt-1">
                      {selectedCompany.financial_year_start ? new Date(selectedCompany.financial_year_start).getFullYear() : '2023'} - {selectedCompany.financial_year_end ? new Date(selectedCompany.financial_year_end).getFullYear() : '2024'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div 
              className="erp-card cursor-pointer group fade-in bg-[var(--erp-teal)] border-transparent shadow-xl shadow-teal-900/10"
              onClick={() => router.push('/vouchers')}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-white">receipt_long</span>
                </div>
                <span className="text-xs font-bold text-white bg-white/20 px-2 py-1 rounded-full">Active</span>
              </div>
              <div className="text-sm font-bold text-teal-100 uppercase tracking-wider mb-1">Total Vouchers</div>
              <div className="text-4xl font-black text-white truncate" title={String(stats.totalVouchers)}>{stats.totalVouchers}</div>
            </div>

            <div 
              className="erp-card cursor-pointer group relative overflow-hidden fade-in bg-[var(--erp-teal)] border-transparent shadow-xl shadow-teal-900/10"
              onClick={() => router.push('/invoices')}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
              <div className="flex justify-between items-center mb-4 relative z-10">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-white">trending_up</span>
                </div>
              </div>
              <div className="text-sm font-bold text-teal-100 uppercase tracking-wider mb-1 relative z-10">Total Sales</div>
              <div className="text-4xl font-black text-white relative z-10 truncate" title={`₹${stats.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>₹{stats.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>

            <div 
              className="erp-card cursor-pointer group fade-in bg-[var(--erp-teal)] border-transparent shadow-xl shadow-teal-900/10"
              onClick={() => router.push('/stock-summary')}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-white">inventory_2</span>
                </div>
              </div>
              <div className="text-sm font-bold text-teal-100 uppercase tracking-wider mb-1">Stock Value</div>
              <div className="text-4xl font-black text-white truncate" title={`₹${stats.totalStockValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>₹{stats.totalStockValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>

            <div 
              className="erp-card cursor-pointer group fade-in bg-[var(--erp-teal)] border-transparent shadow-xl shadow-teal-900/10"
              onClick={() => router.push('/ledgers')}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-white">group</span>
                </div>
              </div>
              <div className="text-sm font-bold text-teal-100 uppercase tracking-wider mb-1">Active Ledgers</div>
              <div className="text-4xl font-black text-white truncate" title={String(stats.activeLedgers)}>{stats.activeLedgers}</div>
            </div>
          </div>
          
          <div className="erp-card fade-in">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--erp-teal)]">bolt</span> 
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <button onClick={() => router.push('/vouchers')} className="p-4 border border-gray-200 rounded-xl hover:border-[var(--erp-teal)] hover:bg-teal-50 transition-colors text-left flex items-center gap-4 group">
                 <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white"><span className="material-symbols-outlined text-gray-500 group-hover:text-[var(--erp-teal)]">add_shopping_cart</span></div>
                 <div className="font-semibold text-gray-700 group-hover:text-[var(--erp-teal)]">Record Sale</div>
               </button>
               <button onClick={() => router.push('/vouchers')} className="p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-left flex items-center gap-4 group">
                 <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white"><span className="material-symbols-outlined text-gray-500 group-hover:text-blue-600">inventory</span></div>
                 <div className="font-semibold text-gray-700 group-hover:text-blue-600">Record Purchase</div>
               </button>
               <button onClick={() => router.push('/invoices')} className="p-4 border border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-colors text-left flex items-center gap-4 group">
                 <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white"><span className="material-symbols-outlined text-gray-500 group-hover:text-purple-600">request_quote</span></div>
                 <div className="font-semibold text-gray-700 group-hover:text-purple-600">Generate Invoice</div>
               </button>
               <button onClick={() => router.push('/reports')} className="p-4 border border-gray-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-colors text-left flex items-center gap-4 group">
                 <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white"><span className="material-symbols-outlined text-gray-500 group-hover:text-amber-600">analytics</span></div>
                 <div className="font-semibold text-gray-700 group-hover:text-amber-600">View Reports</div>
               </button>
            </div>
          </div>
        </div>

        {/* Ledger Modal */}
        {showLedgerModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => { setShowLedgerModal(false); setEditingLedger(null); resetLedgerForm(); }}>
            <div className="erp-card w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--erp-border)]">
                <h3 className="text-xl font-semibold" style={{ color: 'var(--erp-teal)' }}>
                  {editingLedger ? 'Edit Ledger' : 'Create Ledger'}
                </h3>
                <button onClick={() => { setShowLedgerModal(false); setEditingLedger(null); resetLedgerForm(); }} className="text-gray-500 hover:text-black">
                  &times;
                </button>
              </div>

              <form onSubmit={handleLedgerSubmit} className="space-y-4">
                <div>
                  <label className="erp-label">Ledger Name</label>
                  <input
                    type="text" value={ledgerFormData.name}
                    onChange={(e) => setLedgerFormData({ ...ledgerFormData, name: e.target.value })}
                    className="erp-input w-full"
                    placeholder="Enter ledger name..." required
                  />
                </div>

                <div>
                  <label className="erp-label">Group</label>
                  <select
                    value={ledgerFormData.group_id}
                    onChange={(e) => setLedgerFormData({ ...ledgerFormData, group_id: e.target.value })}
                    className="erp-input w-full"
                    required
                  >
                    <option value="">Select a group...</option>
                    {ledgerGroups.map((group) => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-6 py-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={ledgerFormData.is_customer}
                      onChange={(e) => setLedgerFormData({ ...ledgerFormData, is_customer: e.target.checked })}
                    />
                    Is Customer
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={ledgerFormData.is_supplier}
                      onChange={(e) => setLedgerFormData({ ...ledgerFormData, is_supplier: e.target.checked })}
                    />
                    Is Supplier
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="erp-label">Opening Balance</label>
                    <input
                      type="number" step="0.01" value={ledgerFormData.opening_balance}
                      onChange={(e) => setLedgerFormData({ ...ledgerFormData, opening_balance: parseFloat(e.target.value) || 0 })}
                      className="erp-input w-full"
                    />
                  </div>
                  <div>
                    <label className="erp-label">Balance Type</label>
                    <select
                      value={ledgerFormData.opening_balance_type}
                      onChange={(e) => setLedgerFormData({ ...ledgerFormData, opening_balance_type: e.target.value as 'debit' | 'credit' })}
                      className="erp-input w-full"
                    >
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 justify-end">
                  <button type="button" onClick={() => { setShowLedgerModal(false); setEditingLedger(null); resetLedgerForm(); }} className="erp-btn erp-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="erp-btn erp-btn-primary">
                    {editingLedger ? 'Update' : 'Create'} Ledger
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stock Item Modal */}
        {showStockItemModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => { setShowStockItemModal(false); setEditingStockItem(null); resetStockItemForm(); }}>
            <div className="erp-card w-full max-w-xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--erp-border)]">
                <h3 className="text-xl font-semibold" style={{ color: 'var(--erp-teal)' }}>
                  {editingStockItem ? 'Edit Stock Item' : 'Add Stock Item'}
                </h3>
                <button onClick={() => { setShowStockItemModal(false); setEditingStockItem(null); resetStockItemForm(); }} className="text-gray-500 hover:text-black">
                  &times;
                </button>
              </div>

              <form onSubmit={handleStockItemSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="erp-label">Item Name</label>
                    <input
                      type="text" value={stockFormData.name}
                      onChange={(e) => setStockFormData({ ...stockFormData, name: e.target.value })}
                      className="erp-input w-full"
                      placeholder="Enter item name..." required
                    />
                  </div>
                  <div>
                    <label className="erp-label">SKU</label>
                    <input
                      type="text" value={stockFormData.sku || ''}
                      onChange={(e) => setStockFormData({ ...stockFormData, sku: e.target.value })}
                      className="erp-input w-full"
                      placeholder="ABC-123"
                    />
                  </div>
                  <div>
                    <label className="erp-label">HSN Code</label>
                    <input
                      type="text" value={stockFormData.hsn_code || ''}
                      onChange={(e) => setStockFormData({ ...stockFormData, hsn_code: e.target.value })}
                      className="erp-input w-full"
                      placeholder="HSN"
                    />
                  </div>
                  <div>
                    <label className="erp-label">Stock Group</label>
                    <select
                      value={stockFormData.stock_group_id}
                      onChange={(e) => setStockFormData({ ...stockFormData, stock_group_id: e.target.value })}
                      className="erp-input w-full"
                    >
                      <option value="">Select group...</option>
                      {stockGroups.map((group) => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="erp-label">Unit</label>
                    <select
                      value={stockFormData.unit_id}
                      onChange={(e) => setStockFormData({ ...stockFormData, unit_id: e.target.value })}
                      className="erp-input w-full"
                    >
                      <option value="">Select unit...</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>{unit.name} ({unit.symbol})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="erp-label">Purchase Price</label>
                    <input
                      type="number" step="0.01" value={stockFormData.purchase_price}
                      onChange={(e) => setStockFormData({ ...stockFormData, purchase_price: parseFloat(e.target.value) || 0 })}
                      className="erp-input w-full"
                    />
                  </div>
                  <div>
                    <label className="erp-label">Selling Price</label>
                    <input
                      type="number" step="0.01" value={stockFormData.selling_price}
                      onChange={(e) => setStockFormData({ ...stockFormData, selling_price: parseFloat(e.target.value) || 0 })}
                      className="erp-input w-full"
                    />
                  </div>
                  <div>
                    <label className="erp-label">GST Rate (%)</label>
                    <input
                      type="number" value={stockFormData.gst_rate}
                      onChange={(e) => setStockFormData({ ...stockFormData, gst_rate: parseFloat(e.target.value) || 0 })}
                      className="erp-input w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-6 justify-end">
                  <button type="button" onClick={() => { setShowStockItemModal(false); setEditingStockItem(null); resetStockItemForm(); }} className="erp-btn erp-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="erp-btn erp-btn-primary">
                    {editingStockItem ? 'Update' : 'Add'} Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Voucher Modal */}
        {showVoucherModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => { setShowVoucherModal(false); resetVoucherForm(); }}>
            <div className="erp-card w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--erp-border)]">
                <h3 className="text-xl font-semibold" style={{ color: 'var(--erp-teal)' }}>
                  Create Voucher
                </h3>
                <button onClick={() => { setShowVoucherModal(false); resetVoucherForm(); }} className="text-gray-500 hover:text-black">
                  &times;
                </button>
              </div>

              <form onSubmit={handleVoucherSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="erp-label">Voucher Type</label>
                    <select
                      value={voucherFormData.voucher_type}
                      onChange={(e) => setVoucherFormData({ ...voucherFormData, voucher_type: e.target.value as any })}
                      className="erp-input w-full"
                      required
                    >
                      <option value="Sales">Sales</option>
                      <option value="Purchase">Purchase</option>
                      <option value="Payment">Payment</option>
                      <option value="Receipt">Receipt</option>
                      <option value="Contra">Contra</option>
                      <option value="Journal">Journal</option>
                      <option value="Credit Note">Credit Note</option>
                      <option value="Debit Note">Debit Note</option>
                    </select>
                  </div>
                  <div>
                    <label className="erp-label">Date</label>
                    <input
                      type="date"
                      value={voucherFormData.date}
                      onChange={(e) => setVoucherFormData({ ...voucherFormData, date: e.target.value })}
                      className="erp-input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="erp-label">Party Ledger</label>
                    <select
                      value={voucherFormData.party_ledger_id}
                      onChange={(e) => setVoucherFormData({ ...voucherFormData, party_ledger_id: e.target.value })}
                      className="erp-input w-full"
                      required
                    >
                      <option value="">Select party...</option>
                      {ledgers.map((ledger) => (
                        <option key={ledger.id} value={ledger.id}>
                          {ledger.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="erp-label">Narration</label>
                  <textarea
                    value={voucherFormData.narration || ''}
                    onChange={(e) => setVoucherFormData({ ...voucherFormData, narration: e.target.value })}
                    className="erp-input w-full"
                    placeholder="Enter narration..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-6 justify-end">
                  <button type="button" onClick={() => { setShowVoucherModal(false); resetVoucherForm(); }} className="erp-btn erp-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="erp-btn erp-btn-primary">
                    Create Voucher
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
