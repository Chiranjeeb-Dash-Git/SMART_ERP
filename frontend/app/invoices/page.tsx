
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import api, { Invoice, Ledger, Voucher, StockItem, VoucherItem } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Particles } from '@/components/Particles';



export default function InvoicesPage() {
  const { user, selectedCompany } = useApp();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Voucher>>({
    voucher_type: 'Sales',
    date: new Date().toISOString().split('T')[0],
    party_ledger_id: '',
    narration: '',
    voucher_items: []
  });

  const addVoucherItem = () => {
    const newItem: VoucherItem = {
      id: Date.now().toString(),
      voucher_id: '',
      item_id: '',
      description: '',
      quantity: 1,
      rate: 0,
      discount_percent: 0,
      discount_amount: 0,
      amount: 0,
      hsn_code: '',
      gst_rate: 0,
      igst_amount: 0,
      cgst_amount: 0,
      sgst_amount: 0,
      total_amount: 0
    };
    setFormData({
      ...formData,
      voucher_items: [...(formData.voucher_items || []), newItem]
    });
  };

  const removeVoucherItem = (index: number) => {
    const updatedItems = [...(formData.voucher_items || [])];
    updatedItems.splice(index, 1);
    setFormData({ ...formData, voucher_items: updatedItems });
  };

  const updateVoucherItem = (index: number, field: keyof VoucherItem, value: any) => {
    const updatedItems = [...(formData.voucher_items || [])];
    let item = { ...updatedItems[index] };

    if (field === 'item_id') {
      const selectedItem = items.find(i => i.id === value);
      if (selectedItem) {
        item.item_id = selectedItem.id;
        item.rate = selectedItem.selling_price || 0;
        item.hsn_code = selectedItem.hsn_code || '';
        item.gst_rate = selectedItem.gst_rate || 0;
      }
    } else {
      (item as any)[field] = value;
    }

    // Recalculate amounts
    item.amount = item.quantity * item.rate;
    item.discount_amount = (item.amount * (item.discount_percent || 0)) / 100;
    const taxableAmount = item.amount - item.discount_amount;
    const gstAmount = (taxableAmount * (item.gst_rate || 0)) / 100;
    item.cgst_amount = gstAmount / 2;
    item.sgst_amount = gstAmount / 2;
    item.igst_amount = 0; // Default to CGST+SGST for now
    item.total_amount = taxableAmount + gstAmount;

    updatedItems[index] = item;
    setFormData({ ...formData, voucher_items: updatedItems });
  };

  useEffect(() => {
    if (!user) { router.push('/'); return; }
    if (!selectedCompany) { router.push('/companies'); return; }
    loadData();
  }, [user, selectedCompany, router, filter]);

  const loadData = async () => {
    try {
      const [invoicesData, ledgersData, itemsData] = await Promise.all([
        api.getInvoices(selectedCompany.id, filter || undefined),
        api.getLedgers(selectedCompany.id),
        api.getStockItems(selectedCompany.id)
      ]);
      setInvoices(invoicesData);
      setLedgers(ledgersData);
      setItems(itemsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createVoucher({ ...formData, company_id: selectedCompany!.id });
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      voucher_type: 'Sales',
      date: new Date().toISOString().split('T')[0],
      party_ledger_id: '',
      narration: '',
      voucher_items: []
    });
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      await api.downloadInvoicePdf(selectedCompany!.id, invoice.id);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'partial':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      default:
        return 'bg-red-500/20 text-red-300 border border-red-500/30';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'Sales'
      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
  };

  if (!isClient || !user || !selectedCompany) return null;

  return (
    <div className="flex h-screen relative">
      <Particles />
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="header px-10 py-7 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-3xl font-black text-white">Bill/Invoice Generator</h2>
              <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30">
                {selectedCompany.name}
              </span>
            </div>
            <p className="text-slate-400 text-lg">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="glass-input px-6 py-3 rounded-xl text-white text-lg"
            >
              <option value="">All Invoices</option>
              <option value="Sales">Sales Invoices</option>
              <option value="Purchase">Purchase Invoices</option>
            </select>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="btn-primary flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-500 to-indigo-600"
            >
              <span className="text-xl">+</span> Create New Bill
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-secondary flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-lg border border-white/20"
            >
              ← Back
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="text-7xl mb-5 animate-spin text-purple-400">⏳</div>
              <p className="text-xl font-semibold">Loading invoices...</p>
            </div>
          ) : (
            <div className="glass-card table-glass rounded-3xl border border-white/10 overflow-hidden fade-in">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">Invoice No</th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">Type</th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">Date</th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">Party</th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">Total Amount</th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">Status</th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="table-row hover:bg-purple-500/10 transition-all">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="text-lg font-semibold text-white">{invoice.invoice_number}</div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`px-3 py-1.5 inline-flex text-xs font-bold rounded-full border ${getTypeColor(invoice.invoice_type)}`}>
                          {invoice.invoice_type}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="text-slate-400">{new Date(invoice.date).toLocaleDateString('en-IN')}</div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="text-slate-300">{invoice.party_name || '-'}</div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="text-xl font-black text-white">₹{invoice.total_amount.toFixed(2)}</div>
                        <div className="text-xs text-slate-400">
                          Paid: ₹{invoice.paid_amount.toFixed(2)} | Balance: ₹{invoice.balance_amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`px-3 py-1.5 inline-flex text-xs font-bold rounded-full border ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <button
                          onClick={() => handleDownloadPdf(invoice)}
                          className="text-blue-300 hover:text-blue-200 font-semibold flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-blue-500/20 transition-all"
                        >
                          📄 Download Bill
                        </button>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-8 py-24 text-center">
                        <div className="text-slate-400 text-7xl mb-6">🧾</div>
                        <h3 className="text-2xl font-bold text-slate-200 mb-3">No Bills Yet</h3>
                        <p className="text-slate-400 text-lg mb-6">Create your first bill!</p>
                        <button
                          onClick={() => {
                            resetForm();
                            setShowModal(true);
                          }}
                          className="btn-primary px-8 py-4 rounded-xl font-bold text-lg"
                        >
                          Create New Bill
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
            <div className="glass-card rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10 scale-in">
              <div className="p-8 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black flex items-center gap-3 text-white">
                    <span className="text-blue-400 text-3xl">🧾</span>
                    Create New Bill
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="text-slate-400 hover:text-white text-4xl transition-all"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-200 mb-3">
                        Bill Type
                      </label>
                      <select
                        value={formData.voucher_type}
                        onChange={(e) => setFormData({ ...formData, voucher_type: e.target.value as any })}
                        className="glass-input w-full px-5 py-4 rounded-xl text-white text-lg"
                        required
                      >
                        <option value="Sales">Sales Bill</option>
                        <option value="Purchase">Purchase Bill</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-200 mb-3">
                        Date
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="glass-input w-full px-5 py-4 rounded-xl text-white text-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-200 mb-3">
                        Party
                      </label>
                      <select
                        value={formData.party_ledger_id}
                        onChange={(e) => setFormData({ ...formData, party_ledger_id: e.target.value })}
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
                      value={formData.narration || ''}
                      onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                      className="glass-input w-full px-5 py-4 rounded-xl text-white text-lg"
                      placeholder="Enter narration..."
                      rows={2}
                    />
                  </div>

                  {/* Items Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-lg font-bold text-white">Items</label>
                      <button
                        type="button"
                        onClick={addVoucherItem}
                        className="btn-primary px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                      >
                        <span className="text-xl">+</span> Add Item
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Item</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">HSN</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-200 uppercase tracking-wider">Qty</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Unit</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-200 uppercase tracking-wider">Rate</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-200 uppercase tracking-wider">Disc (%)</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-200 uppercase tracking-wider">GST (%)</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-200 uppercase tracking-wider">Total</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-slate-200 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {formData.voucher_items?.map((item, index) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3">
                                <select
                                  value={item.item_id}
                                  onChange={(e) => updateVoucherItem(index, 'item_id', e.target.value)}
                                  className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
                                >
                                  <option value="">Select item...</option>
                                  {items.map((i) => (
                                    <option key={i.id} value={i.id}>{i.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={item.hsn_code}
                                  onChange={(e) => updateVoucherItem(index, 'hsn_code', e.target.value)}
                                  className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
                                  placeholder="HSN Code"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateVoucherItem(index, 'quantity', Number(e.target.value))}
                                  className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm text-right"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={item.unit || 'PCS'}
                                  onChange={(e) => updateVoucherItem(index, 'unit', e.target.value)}
                                  className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.rate}
                                  onChange={(e) => updateVoucherItem(index, 'rate', Number(e.target.value))}
                                  className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm text-right"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={item.discount_percent}
                                  onChange={(e) => updateVoucherItem(index, 'discount_percent', Number(e.target.value))}
                                  className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm text-right"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={item.gst_rate}
                                  onChange={(e) => updateVoucherItem(index, 'gst_rate', Number(e.target.value))}
                                  className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm text-right"
                                />
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-white">
                                ₹{item.total_amount.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeVoucherItem(index)}
                                  className="text-red-400 hover:text-red-300 text-xl"
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          ))}
                          {formData.voucher_items?.length === 0 && (
                            <tr>
                              <td colSpan={9} className="px-8 py-8 text-center text-slate-400">
                                No items added. Click "Add Item" to add items to the bill.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Totals Section */}
                  {formData.voucher_items?.length > 0 && (
                    <div className="bg-white/5 rounded-2xl p-6">
                      <div className="flex justify-end space-y-3">
                        <div className="flex justify-between w-64">
                          <span className="text-slate-300 font-semibold">Subtotal:</span>
                          <span className="text-white font-bold">
                            ₹{formData.voucher_items.reduce((sum, i) => sum + i.amount, 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between w-64">
                          <span className="text-slate-300 font-semibold">Discount:</span>
                          <span className="text-white font-bold">
                            -₹{formData.voucher_items.reduce((sum, i) => sum + (i.discount_amount || 0), 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between w-64">
                          <span className="text-slate-300 font-semibold">CGST:</span>
                          <span className="text-white font-bold">
                            ₹{formData.voucher_items.reduce((sum, i) => sum + (i.cgst_amount || 0), 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between w-64">
                          <span className="text-slate-300 font-semibold">SGST:</span>
                          <span className="text-white font-bold">
                            ₹{formData.voucher_items.reduce((sum, i) => sum + (i.sgst_amount || 0), 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between w-64 pt-3 border-t border-white/20">
                          <span className="text-lg font-bold text-white">Grand Total:</span>
                          <span className="text-xl font-black text-emerald-400">
                            ₹{formData.voucher_items.reduce((sum, i) => sum + i.total_amount, 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="btn-primary flex-1 px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-500 to-indigo-600"
                    >
                      ✓ Create Bill
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
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
      </main>
    </div>
  );
}
