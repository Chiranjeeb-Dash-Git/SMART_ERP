
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import api, { Voucher, Ledger, StockItem, VoucherItem } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Particles } from '@/components/Particles';

const ParticlesComponent = () => {
  const particles = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: `${12 + Math.random() * 15}s`,
      delay: `${Math.random() * 8}s`,
    }));
  }, []);

  return (
    <div className="particles">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: particle.left,
            animationDuration: particle.duration,
            animationDelay: particle.delay,
          }}
        />
      ))}
    </div>
  );
};

export default function VouchersPage() {
  const { user, selectedCompany } = useApp();
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [filter, setFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [items, setItems] = useState<StockItem[]>([]);
  const [formData, setFormData] = useState<Partial<Voucher>>({
    voucher_type: 'Sales',
    date: new Date().toISOString().split('T')[0],
    party_ledger_id: '',
    narration: '',
    items: []
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

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
  }, [user, selectedCompany, router, filter]);

  const loadData = async () => {
    if (!selectedCompany) return;
    try {
      const [vouchersData, ledgersData, itemsData] = await Promise.all([
        api.getVouchers(selectedCompany!.id, filter || undefined),
        api.getLedgers(selectedCompany!.id),
        api.getStockItems(selectedCompany!.id)
      ]);
      setVouchers(vouchersData);
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
      if (editingVoucher) {
        await api.updateVoucher(editingVoucher.id, { ...formData, company_id: selectedCompany!.id });
      } else {
        await api.createVoucher({ ...formData, company_id: selectedCompany!.id });
      }
      setShowModal(false);
      setEditingVoucher(null);
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

  const handleEdit = async (voucher: Voucher) => {
    try {
      const fullVoucher = await api.getVoucher(selectedCompany!.id, voucher.id);
      setEditingVoucher(fullVoucher);
      setFormData({
        voucher_type: fullVoucher.voucher_type,
        date: fullVoucher.date.split('T')[0],
        party_ledger_id: fullVoucher.party_ledger_id,
        narration: fullVoucher.narration || '',
        items: fullVoucher.items || []
      });
      setShowModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPdf = async (voucher: Voucher) => {
    try {
      await api.downloadVoucherPdf(selectedCompany!.id, voucher.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportExcel = async () => {
    try {
      await api.exportVouchersExcel(selectedCompany!.id, filter || undefined);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isClient || !user || !selectedCompany) return null;

  return (
    <div className="erp-page-container flex flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col p-6 overflow-hidden bg-[var(--erp-bg)]">
        
        <div className="erp-header">
          <div>
            <h2 className="erp-title">Vouchers Master</h2>
            <div className="text-xs text-[var(--erp-text-muted)] mt-1">{selectedCompany.name}</div>
          </div>
          <div className="flex gap-4 items-center">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="erp-input px-4 py-2"
            >
              <option value="">All Vouchers</option>
              <option value="Sales">Sales</option>
              <option value="Purchase">Purchase</option>
              <option value="Payment">Payment</option>
              <option value="Receipt">Receipt</option>
              <option value="Contra">Contra</option>
              <option value="Journal">Journal</option>
              <option value="Credit Note">Credit Note</option>
              <option value="Debit Note">Debit Note</option>
            </select>
            <button
              onClick={() => {
                setEditingVoucher(null);
                resetForm();
                setShowModal(true);
              }}
              className="erp-btn erp-btn-primary"
            >
              + Create Voucher
            </button>
            <button
              onClick={handleExportExcel}
              className="erp-btn erp-btn-secondary"
            >
              📥 Export Excel
            </button>
          </div>
        </div>

        <div className="erp-table-container">
          <table className="erp-table min-w-full">
            <thead>
              <tr>
                <th className="text-left px-4 py-2">Voucher No</th>
                <th className="text-left px-4 py-2">Type</th>
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-left px-4 py-2">Party</th>
                <th className="text-right px-4 py-2">Amount</th>
                <th className="text-center px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
              ) : vouchers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-[var(--erp-text-muted)]">No vouchers found. Create your first voucher above!</td></tr>
              ) : (
                vouchers.map((voucher) => (
                  <tr key={voucher.id} className="border-b border-[var(--erp-border)] hover:bg-black/5 group">
                    <td className="px-4 py-2 font-medium text-[var(--erp-teal)]">
                      {voucher.voucher_number}
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 border border-gray-200">
                        {voucher.voucher_type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-[var(--erp-text-muted)]">
                      {new Date(voucher.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-2 font-medium">
                      {voucher.party_name || '-'}
                    </td>
                    <td className="px-4 py-2 text-right font-bold">
                      ₹{(voucher.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2 text-center flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleEdit(voucher)}
                        className="text-blue-600 hover:underline text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDownloadPdf(voucher)}
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

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => { setShowModal(false); setEditingVoucher(null); resetForm(); }}>
            <div className="erp-card w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--erp-border)]">
                <h3 className="text-xl font-semibold" style={{ color: 'var(--erp-teal)' }}>
                  {editingVoucher ? 'Edit Voucher' : 'Create Voucher'}
                </h3>
                <button onClick={() => { setShowModal(false); setEditingVoucher(null); resetForm(); }} className="text-gray-500 hover:text-black">
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="erp-label">Voucher Type</label>
                    <select
                      value={formData.voucher_type}
                      onChange={(e) => setFormData({ ...formData, voucher_type: e.target.value as any })}
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
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="erp-input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="erp-label">Party Ledger</label>
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
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-6 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingVoucher(null);
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
                    {editingVoucher ? 'Update' : 'Create'} Voucher
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
