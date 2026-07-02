
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
    voucher_items: []
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
    try {
      const [vouchersData, ledgersData, itemsData] = await Promise.all([
        api.getVouchers(selectedCompany.id, filter || undefined),
        api.getLedgers(selectedCompany.id),
        api.getStockItems(selectedCompany.id)
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
        // TODO: Add update voucher endpoint
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
      voucher_items: []
    });
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
    <div className="flex h-screen relative">
      <Particles />
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="header px-10 py-7 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-3xl font-black text-white">Vouchers</h2>
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
              <option value="">All Vouchers</option>
              <option value="Sales">Sales Vouchers</option>
              <option value="Purchase">Purchase Vouchers</option>
              <option value="Payment">Payment Vouchers</option>
              <option value="Receipt">Receipt Vouchers</option>
              <option value="Contra">Contra Vouchers</option>
              <option value="Journal">Journal Vouchers</option>
              <option value="Credit Note">Credit Notes</option>
              <option value="Debit Note">Debit Notes</option>
            </select>
            <button
              onClick={() => {
                setEditingVoucher(null);
                resetForm();
                setShowModal(true);
              }}
              className="btn-primary flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-500 to-indigo-600"
            >
              <span className="text-xl">+</span> Create Voucher
            </button>
            <button
              onClick={handleExportExcel}
              className="btn-secondary flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-lg border border-white/20"
            >
              📥 Export Excel
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
              <p className="text-xl font-semibold">Loading vouchers...</p>
            </div>
          ) : (
            <div className="glass-card table-glass rounded-3xl border border-white/10 overflow-hidden fade-in">
              {vouchers.length === 0 ? (
                <div className="p-24 text-center">
                  <div className="text-slate-400 text-7xl mb-6">📝</div>
                  <h3 className="text-2xl font-bold text-slate-200 mb-3">No vouchers yet</h3>
                  <p className="text-slate-400 text-lg mb-6">Create your first voucher!</p>
                  <button
                    onClick={() => {
                      setEditingVoucher(null);
                      resetForm();
                      setShowModal(true);
                    }}
                    className="btn-primary px-8 py-4 rounded-xl font-bold text-lg"
                  >
                    Create Voucher
                  </button>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Voucher No
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Party
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {vouchers.map((voucher) => (
                      <tr key={voucher.id} className="table-row hover:bg-purple-500/10 transition-all">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-lg font-semibold text-white">{voucher.voucher_number}</div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className={`px-4 py-2 inline-flex text-xs font-bold rounded-full border ${
                            voucher.voucher_type === 'Sales' 
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                              : voucher.voucher_type === 'Purchase'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                              : voucher.voucher_type === 'Payment'
                              ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' 
                              : voucher.voucher_type === 'Receipt'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : voucher.voucher_type === 'Contra'
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                              : voucher.voucher_type === 'Journal'
                              ? 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                              : voucher.voucher_type === 'Credit Note'
                              ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}>
                            {voucher.voucher_type}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="text-slate-300">
                            {new Date(voucher.date).toLocaleDateString('en-IN')}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-lg font-semibold text-white">
                            {voucher.party_name || '-'}
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-xl font-black text-white">
                            ₹{(voucher.total_amount || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <button
                            onClick={() => handleDownloadPdf(voucher)}
                            className="text-blue-300 hover:text-blue-200 font-semibold flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-blue-500/20 transition-all"
                          >
                            📄 Download PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
            <div className="glass-card rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10 scale-in">
              <div className="p-8 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black flex items-center gap-3 text-white">
                    <span className="text-blue-400 text-3xl">📝</span>
                    {editingVoucher ? 'Edit Voucher' : 'Create Voucher'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingVoucher(null);
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
                        Voucher Type
                      </label>
                      <select
                        value={formData.voucher_type}
                        onChange={(e) => setFormData({ ...formData, voucher_type: e.target.value as any })}
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
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="glass-input w-full px-5 py-4 rounded-xl text-white text-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-200 mb-3">
                        Party Ledger
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
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="btn-primary flex-1 px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-500 to-indigo-600"
                    >
                      {editingVoucher ? '✓ Update Voucher' : '✓ Create Voucher'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingVoucher(null);
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
