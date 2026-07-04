'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import api, { Invoice, Ledger, Voucher, StockItem, VoucherItem } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';

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
    items: []
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
      total_amount: 0,
      created_at: new Date().toISOString()
    };
    setFormData({
      ...formData,
      items: [...(formData.items || []), newItem]
    });
  };

  const removeVoucherItem = (index: number) => {
    const updatedItems = [...(formData.items || [])];
    updatedItems.splice(index, 1);
    setFormData({ ...formData, items: updatedItems });
  };

  const updateVoucherItem = (index: number, field: keyof VoucherItem, value: any) => {
    const updatedItems = [...(formData.items || [])];
    const item = { ...updatedItems[index] };

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
    setFormData({ ...formData, items: updatedItems });
  };

  useEffect(() => {
    if (!user) { router.push('/'); return; }
    if (!selectedCompany) { router.push('/companies'); return; }
    loadData();
  }, [user, selectedCompany, router, filter]);

  const loadData = async () => {
    try {
      const [invoicesData, ledgersData, itemsData] = await Promise.all([
        api.getInvoices(selectedCompany!.id, filter || undefined),
        api.getLedgers(selectedCompany!.id),
        api.getStockItems(selectedCompany!.id)
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
      items: []
    });
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      await api.downloadInvoicePdf(selectedCompany!.id, invoice.id);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isClient || !user || !selectedCompany) return null;

  return (
    <div className="erp-page-container flex flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col p-6 overflow-hidden bg-[var(--erp-bg)]">
        
        <header className="erp-header">
          <div>
            <h2 className="erp-title">Bill/Invoice Generator</h2>
            <div className="text-xs text-[var(--erp-text-muted)] mt-1">
              {selectedCompany.name} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="erp-input px-4 py-2"
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
              className="erp-btn erp-btn-primary"
            >
              + Create New Bill
            </button>
          </div>
        </header>

        <div className="erp-table-container mt-6">
          <table className="erp-table min-w-full">
            <thead>
              <tr>
                <th className="text-left px-4 py-2">Invoice No</th>
                <th className="text-left px-4 py-2">Type</th>
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-left px-4 py-2">Party</th>
                <th className="text-right px-4 py-2">Total Amount</th>
                <th className="text-center px-4 py-2">Status</th>
                <th className="text-center px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8">Loading invoices...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8">No invoices found.</td></tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-[var(--erp-border)] hover:bg-black/5 group">
                    <td className="px-4 py-3 font-medium text-[var(--erp-teal)]">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded border ${invoice.invoice_type === 'Sales' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {invoice.invoice_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--erp-text-muted)]">
                      {new Date(invoice.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {invoice.party_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-bold">₹{invoice.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-xs text-[var(--erp-text-muted)] mt-1">
                        Paid: ₹{invoice.paid_amount.toFixed(2)} | Bal: ₹{invoice.balance_amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-1 rounded border ${
                        invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        invoice.status === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDownloadPdf(invoice)}
                        className="text-[var(--erp-teal)] hover:underline text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Voucher Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => { setShowModal(false); resetForm(); }}>
            <div className="erp-card w-full max-w-4xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--erp-border)]">
                <h3 className="text-xl font-semibold" style={{ color: 'var(--erp-teal)' }}>
                  Create New Bill
                </h3>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500 hover:text-black">
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-3 gap-5">
                  <div>
                    <label className="erp-label">Bill Type</label>
                    <select
                      value={formData.voucher_type}
                      onChange={(e) => setFormData({ ...formData, voucher_type: e.target.value as any })}
                      className="erp-input w-full"
                      required
                    >
                      <option value="Sales">Sales Bill</option>
                      <option value="Purchase">Purchase Bill</option>
                    </select>
                  </div>
                  <div>
                    <label className="erp-label">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="erp-input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="erp-label">Party</label>
                    <select
                      value={formData.party_ledger_id}
                      onChange={(e) => setFormData({ ...formData, party_ledger_id: e.target.value })}
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
                    value={formData.narration || ''}
                    onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                    className="erp-input w-full"
                    placeholder="Enter narration..."
                    rows={2}
                  />
                </div>

                {/* Items Section */}
                <div>
                  <div className="flex items-center justify-between mb-3 mt-4">
                    <label className="font-semibold text-lg" style={{ color: 'var(--erp-teal)' }}>Items</label>
                    <button
                      type="button"
                      onClick={addVoucherItem}
                      className="erp-btn erp-btn-secondary text-sm"
                    >
                      + Add Item
                    </button>
                  </div>
                  
                  <div className="border border-[var(--erp-border)] rounded overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-[var(--erp-border)]">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Item</th>
                          <th className="px-3 py-2 font-semibold">HSN</th>
                          <th className="px-3 py-2 font-semibold text-right">Qty</th>
                          <th className="px-3 py-2 font-semibold">Unit</th>
                          <th className="px-3 py-2 font-semibold text-right">Rate</th>
                          <th className="px-3 py-2 font-semibold text-right">Disc %</th>
                          <th className="px-3 py-2 font-semibold text-right">GST %</th>
                          <th className="px-3 py-2 font-semibold text-right">Total</th>
                          <th className="px-3 py-2 font-semibold text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--erp-border)]">
                        {formData.items?.map((item, index) => (
                          <tr key={item.id}>
                            <td className="px-2 py-2">
                              <select
                                value={item.item_id}
                                onChange={(e) => updateVoucherItem(index, 'item_id', e.target.value)}
                                className="erp-input w-full text-sm px-2 py-1"
                              >
                                <option value="">Select item...</option>
                                {items.map((i) => (
                                  <option key={i.id} value={i.id}>{i.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-2 py-2 w-24">
                              <input
                                type="text"
                                value={item.hsn_code}
                                onChange={(e) => updateVoucherItem(index, 'hsn_code', e.target.value)}
                                className="erp-input w-full text-sm px-2 py-1"
                              />
                            </td>
                            <td className="px-2 py-2 w-20">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateVoucherItem(index, 'quantity', Number(e.target.value))}
                                className="erp-input w-full text-sm px-2 py-1 text-right"
                              />
                            </td>
                            <td className="px-2 py-2 w-20">
                              <input
                                type="text"
                                value={item.unit || 'PCS'}
                                onChange={(e) => updateVoucherItem(index, 'unit', e.target.value)}
                                className="erp-input w-full text-sm px-2 py-1"
                              />
                            </td>
                            <td className="px-2 py-2 w-24">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.rate}
                                onChange={(e) => updateVoucherItem(index, 'rate', Number(e.target.value))}
                                className="erp-input w-full text-sm px-2 py-1 text-right"
                              />
                            </td>
                            <td className="px-2 py-2 w-20">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.discount_percent}
                                onChange={(e) => updateVoucherItem(index, 'discount_percent', Number(e.target.value))}
                                className="erp-input w-full text-sm px-2 py-1 text-right"
                              />
                            </td>
                            <td className="px-2 py-2 w-20">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.gst_rate}
                                onChange={(e) => updateVoucherItem(index, 'gst_rate', Number(e.target.value))}
                                className="erp-input w-full text-sm px-2 py-1 text-right"
                              />
                            </td>
                            <td className="px-2 py-2 text-right font-medium">
                              {item.total_amount.toFixed(2)}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeVoucherItem(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                &times;
                              </button>
                            </td>
                          </tr>
                        ))}
                        {(!formData.items || formData.items.length === 0) && (
                          <tr>
                            <td colSpan={9} className="px-4 py-6 text-center text-[var(--erp-text-muted)] text-sm">
                              No items added. Click "+ Add Item" to begin.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals Section */}
                {formData.items && formData.items.length > 0 && (
                  <div className="bg-gray-50 border border-[var(--erp-border)] rounded p-4">
                    <div className="flex justify-end space-y-2 text-sm">
                      <div className="flex justify-between w-64">
                        <span className="font-medium text-[var(--erp-text-muted)]">Subtotal:</span>
                        <span className="font-semibold text-right">
                          ₹{formData.items.reduce((sum: number, i: any) => sum + i.amount, 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between w-64">
                        <span className="font-medium text-[var(--erp-text-muted)]">Discount:</span>
                        <span className="font-semibold text-right text-red-600">
                          -₹{formData.items.reduce((sum: number, i: any) => sum + (i.discount_amount || 0), 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between w-64">
                        <span className="font-medium text-[var(--erp-text-muted)]">CGST:</span>
                        <span className="font-semibold text-right">
                          ₹{formData.items.reduce((sum: number, i: any) => sum + (i.cgst_amount || 0), 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between w-64">
                        <span className="font-medium text-[var(--erp-text-muted)]">SGST:</span>
                        <span className="font-semibold text-right">
                          ₹{formData.items.reduce((sum: number, i: any) => sum + (i.sgst_amount || 0), 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between w-64 pt-2 border-t border-[var(--erp-border)] mt-2">
                        <span className="text-base font-bold text-gray-900">Grand Total:</span>
                        <span className="text-lg font-bold" style={{ color: 'var(--erp-teal)' }}>
                          ₹{formData.items.reduce((sum: number, i: any) => sum + i.total_amount, 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="erp-btn erp-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="erp-btn erp-btn-primary"
                  >
                    Create Bill
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
