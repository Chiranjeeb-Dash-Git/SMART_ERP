
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import api, { Ledger, StockItem, LedgerGroup, Unit, StockGroup, Voucher } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Particles } from '@/components/Particles';

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
    voucher_items: []
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
        api.getLedgerGroups(selectedCompany.id),
        api.getStockGroups(selectedCompany.id),
        api.getUnits(selectedCompany.id),
        api.getLedgers(selectedCompany.id),
        api.getVouchers(selectedCompany.id),
        api.getStockItems(selectedCompany.id)
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
      voucher_items: []
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
    <div className="flex h-screen relative">
      <Particles />
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="header px-10 py-7 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-3xl font-black text-white">{selectedCompany.name}</h2>
              <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30">
                Active
              </span>
            </div>
            <p className="text-slate-400 text-lg">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setEditingLedger(null);
                resetLedgerForm();
                setShowLedgerModal(true);
              }}
              className="btn-primary flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-lg"
            >
              <span className="text-xl">+</span> Create Ledger
            </button>
            <button
              onClick={() => {
                setEditingStockItem(null);
                resetStockItemForm();
                setShowStockItemModal(true);
              }}
              className="btn-primary flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              <span className="text-xl">📦</span> Add Item
            </button>
            <button
              onClick={() => {
                resetVoucherForm();
                setShowVoucherModal(true);
              }}
              className="btn-primary flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-500 to-indigo-600"
            >
              <span className="text-xl">📝</span> Create Voucher
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div 
              className="glass-card rounded-3xl p-8 border border-white/10 fade-in cursor-pointer hover:scale-105 transition-all"
              onClick={() => router.push('/vouchers')}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl shadow-2xl">
                  📑
                </div>
                <div className="flex-1">
                  <p className="text-slate-400 font-semibold text-sm mb-1">Total Vouchers</p>
                  <p className="text-4xl font-black text-white">{stats.totalVouchers}</p>
                </div>
              </div>
            </div>

            <div 
              className="glass-card rounded-3xl p-8 border border-white/10 fade-in cursor-pointer hover:scale-105 transition-all"
              onClick={() => router.push('/invoices')}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white text-3xl shadow-2xl">
                  💰
                </div>
                <div className="flex-1">
                  <p className="text-slate-400 font-semibold text-sm mb-1">Total Sales</p>
                  <p className="text-4xl font-black text-white">₹{stats.totalSales.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div 
              className="glass-card rounded-3xl p-8 border border-white/10 fade-in cursor-pointer hover:scale-105 transition-all"
              onClick={() => router.push('/stock-summary')}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl shadow-2xl">
                  📦
                </div>
                <div className="flex-1">
                  <p className="text-slate-400 font-semibold text-sm mb-1">Stock Value</p>
                  <p className="text-4xl font-black text-white">₹{stats.totalStockValue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div 
              className="glass-card rounded-3xl p-8 border border-white/10 fade-in cursor-pointer hover:scale-105 transition-all"
              onClick={() => router.push('/ledgers')}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-600 flex items-center justify-center text-white text-3xl shadow-2xl">
                  👤
                </div>
                <div className="flex-1">
                  <p className="text-slate-400 font-semibold text-sm mb-1">Active Ledgers</p>
                  <p className="text-4xl font-black text-white">{stats.activeLedgers}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showLedgerModal && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 scale-in">
            <div className="p-8 border-b border-white/10">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black flex items-center gap-3 text-white">
                  <span className="text-blue-400 text-3xl">📊</span>
                  {editingLedger ? 'Edit Ledger' : 'Create Ledger'}
                </h2>
                <button
                  onClick={() => { setShowLedgerModal(false); setEditingLedger(null); resetLedgerForm(); }}
                  className="text-slate-400 hover:text-white text-4xl transition-all"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-8">
              <form onSubmit={handleLedgerSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-3">Ledger Name</label>
                  <input
                    type="text" value={ledgerFormData.name}
                    onChange={(e) => setLedgerFormData({ ...ledgerFormData, name: e.target.value })}
                    className="glass-input w-full px-5 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                    placeholder="Enter ledger name..." required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-3">Group</label>
                  <select
                    value={ledgerFormData.group_id}
                    onChange={(e) => setLedgerFormData({ ...ledgerFormData, group_id: e.target.value })}
                    className="glass-input w-full px-5 py-4 rounded-xl text-white text-lg"
                    required
                  >
                    <option value="">Select a group...</option>
                    {ledgerGroups.map((group) => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-5 flex-wrap">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={ledgerFormData.is_customer}
                      onChange={(e) => setLedgerFormData({ ...ledgerFormData, is_customer: e.target.checked })}
                      className="w-6 h-6 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-lg font-semibold text-slate-200">Is Customer</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={ledgerFormData.is_supplier}
                      onChange={(e) => setLedgerFormData({ ...ledgerFormData, is_supplier: e.target.checked })}
                      className="w-6 h-6 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-lg font-semibold text-slate-200">Is Supplier</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-3">Opening Balance</label>
                    <input
                      type="number" step="0.01" value={ledgerFormData.opening_balance}
                      onChange={(e) => setLedgerFormData({ ...ledgerFormData, opening_balance: parseFloat(e.target.value) || 0 })}
                      className="glass-input w-full px-5 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-3">Balance Type</label>
                    <select
                      value={ledgerFormData.opening_balance_type}
                      onChange={(e) => setLedgerFormData({ ...ledgerFormData, opening_balance_type: e.target.value as 'debit' | 'credit' })}
                      className="glass-input w-full px-5 py-4 rounded-xl text-white text-lg"
                    >
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="btn-primary flex-1 px-7 py-4 rounded-xl font-bold text-lg"
                  >
                    {editingLedger ? '✓ Update Ledger' : '✓ Create Ledger'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowLedgerModal(false); setEditingLedger(null); resetLedgerForm(); }}
                    className="btn-secondary px-7 py-4 rounded-xl font-bold text-lg border border-white/20"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showStockItemModal && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 scale-in">
            <div className="p-8 border-b border-white/10">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black flex items-center gap-3 text-white">
                  <span className="text-emerald-400 text-3xl">📦</span>
                  {editingStockItem ? 'Edit Stock Item' : 'Add Stock Item'}
                </h2>
                <button
                  onClick={() => { setShowStockItemModal(false); setEditingStockItem(null); resetStockItemForm(); }}
                  className="text-slate-400 hover:text-white text-4xl transition-all"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-8">
              <form onSubmit={handleStockItemSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-200 mb-3">Item Name</label>
                    <input
                      type="text" value={stockFormData.name}
                      onChange={(e) => setStockFormData({ ...stockFormData, name: e.target.value })}
                      className="glass-input w-full px-5 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                      placeholder="Enter item name..." required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-3">SKU</label>
                    <input
                      type="text" value={stockFormData.sku || ''}
                      onChange={(e) => setStockFormData({ ...stockFormData, sku: e.target.value })}
                      className="glass-input w-full px-5 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                      placeholder="ABC-123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-3">HSN Code</label>
                    <input
                      type="text" value={stockFormData.hsn_code || ''}
                      onChange={(e) => setStockFormData({ ...stockFormData, hsn_code: e.target.value })}
                      className="glass-input w-full px-5 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                      placeholder="HSN"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-3">Stock Group</label>
                    <select
                      value={stockFormData.stock_group_id}
                      onChange={(e) => setStockFormData({ ...stockFormData, stock_group_id: e.target.value })}
                      className="glass-input w-full px-5 py-4 rounded-xl text-white text-lg"
                    >
                      <option value="">Select group...</option>
                      {stockGroups.map((group) => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-3">Unit</label>
                    <select
                      value={stockFormData.unit_id}
                      onChange={(e) => setStockFormData({ ...stockFormData, unit_id: e.target.value })}
                      className="glass-input w-full px-5 py-4 rounded-xl text-white text-lg"
                    >
                      <option value="">Select unit...</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>{unit.name} ({unit.symbol})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-3">Purchase Price</label>
                    <input
                      type="number" step="0.01" value={stockFormData.purchase_price}
                      onChange={(e) => setStockFormData({ ...stockFormData, purchase_price: parseFloat(e.target.value) || 0 })}
                      className="glass-input w-full px-5 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-3">Selling Price</label>
                    <input
                      type="number" step="0.01" value={stockFormData.selling_price}
                      onChange={(e) => setStockFormData({ ...stockFormData, selling_price: parseFloat(e.target.value) || 0 })}
                      className="glass-input w-full px-5 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-3">GST Rate (%)</label>
                    <input
                      type="number" value={stockFormData.gst_rate}
                      onChange={(e) => setStockFormData({ ...stockFormData, gst_rate: parseFloat(e.target.value) || 0 })}
                      className="glass-input w-full px-5 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                      placeholder="18"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="btn-primary flex-1 px-7 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-emerald-500 to-teal-600"
                  >
                    {editingStockItem ? '✓ Update Item' : '✓ Add Item'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowStockItemModal(false); setEditingStockItem(null); resetStockItemForm(); }}
                    className="btn-secondary px-7 py-4 rounded-xl font-bold text-lg border border-white/20"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showVoucherModal && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10 scale-in">
            <div className="p-8 border-b border-white/10">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black flex items-center gap-3 text-white">
                  <span className="text-blue-400 text-3xl">📝</span>
                  Create Voucher
                </h2>
                <button
                  onClick={() => { setShowVoucherModal(false); resetVoucherForm(); }}
                  className="text-slate-400 hover:text-white text-4xl transition-all"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-8">
              <form onSubmit={handleVoucherSubmit} className="space-y-6">
                <div className="grid grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-3">
                      Voucher Type
                    </label>
                    <select
                      value={voucherFormData.voucher_type}
                      onChange={(e) => setVoucherFormData({ ...voucherFormData, voucher_type: e.target.value as any })}
                      className="glass-input w-full px-5 py-4 rounded-xl text-white text-lg"
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
                    <label className="block text-sm font-bold text-slate-200 mb-3">
                      Date
                    </label>
                    <input
                      type="date"
                      value={voucherFormData.date}
                      onChange={(e) => setVoucherFormData({ ...voucherFormData, date: e.target.value })}
                      className="glass-input w-full px-5 py-4 rounded-xl text-white text-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-3">
                      Party Ledger
                    </label>
                    <select
                      value={voucherFormData.party_ledger_id}
                      onChange={(e) => setVoucherFormData({ ...voucherFormData, party_ledger_id: e.target.value })}
                      className="glass-input w-full px-5 py-4 rounded-xl text-white text-lg"
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
                  <label className="block text-sm font-bold text-slate-200 mb-3">
                    Narration
                  </label>
                  <textarea
                    value={voucherFormData.narration || ''}
                    onChange={(e) => setVoucherFormData({ ...voucherFormData, narration: e.target.value })}
                    className="glass-input w-full px-5 py-4 rounded-xl text-white text-lg"
                    placeholder="Enter narration..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="btn-primary flex-1 px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-500 to-indigo-600"
                  >
                    ✓ Create Voucher
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowVoucherModal(false); resetVoucherForm(); }}
                    className="btn-secondary px-8 py-4 rounded-xl font-bold text-lg border border-white/20"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
