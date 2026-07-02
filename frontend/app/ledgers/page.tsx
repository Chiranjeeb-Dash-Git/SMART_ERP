
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import api, { Ledger, LedgerGroup } from '@/lib/api';

const Particles = () => {
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

const navItems = [
  { name: 'Dashboard', icon: '🏠', shortcut: 'D', path: '/dashboard' },
  { name: 'Vouchers', icon: '📝', shortcut: 'V', path: '/vouchers' },
  { name: 'Ledgers', icon: '📊', shortcut: 'L', path: '/ledgers' },
  { name: 'Inventory', icon: '📦', shortcut: 'I', path: '/stock-items' },
  { name: 'Invoices', icon: '🧾', shortcut: 'F', path: '/invoices' },
  { name: 'Reports', icon: '📈', shortcut: 'R', path: '/reports' },
];

export default function LedgersPage() {
  const { user, selectedCompany } = useApp();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [filteredLedgers, setFilteredLedgers] = useState<Ledger[]>([]);
  const [groups, setGroups] = useState<LedgerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLedger, setEditingLedger] = useState<Ledger | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    group_id: '',
    address: '',
    gst_number: '',
    opening_balance: 0,
    opening_balance_type: 'debit' as const,
    phone: '',
    mobile: '',
    email: '',
    is_customer: false,
    is_supplier: false,
  });

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
  }, [user, selectedCompany, router]);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredLedgers(ledgers);
    } else {
      const searchLower = search.toLowerCase();
      setFilteredLedgers(
        ledgers.filter(
          (l) =>
            l.name.toLowerCase().includes(searchLower) ||
            (l.group_name && l.group_name.toLowerCase().includes(searchLower))
        )
      );
    }
  }, [search, ledgers]);

  const loadData = async () => {
    try {
      const [ledgersData, groupsData] = await Promise.all([
        api.getLedgers(selectedCompany!.id),
        api.getLedgerGroups(selectedCompany!.id),
      ]);
      setLedgers(ledgersData);
      setFilteredLedgers(ledgersData);
      setGroups(groupsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLedger) {
        await api.updateLedger(editingLedger.id, formData);
      } else {
        await api.createLedger({ ...formData, company_id: selectedCompany!.id });
      }
      setShowModal(false);
      setEditingLedger(null);
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (ledger: Ledger) => {
    setEditingLedger(ledger);
    setFormData({
      name: ledger.name,
      group_id: ledger.group_id,
      address: ledger.address || '',
      gst_number: ledger.gst_number || '',
      opening_balance: ledger.opening_balance,
      opening_balance_type: ledger.opening_balance_type,
      phone: ledger.phone || '',
      mobile: ledger.mobile || '',
      email: ledger.email || '',
      is_customer: ledger.is_customer,
      is_supplier: ledger.is_supplier,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this ledger?')) {
      try {
        await api.deleteLedger(id);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      group_id: '',
      address: '',
      gst_number: '',
      opening_balance: 0,
      opening_balance_type: 'debit',
      phone: '',
      mobile: '',
      email: '',
      is_customer: false,
      is_supplier: false,
    });
  };

  if (!user || !selectedCompany) return null;

  return (
    <div className="flex h-screen relative">
      {isClient && <Particles />}

      <aside className="sidebar slide-in-left flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-2xl pulse-glow border border-white/30">
              SE
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">SmartERP</h1>
              <p className="text-xs text-slate-400">Complete Business Suite</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => router.push(item.path)}
              className={`sidebar-item w-full flex items-center gap-3 px-5 py-4 rounded-xl transition-all duration-300 ${
                item.path === '/ledgers' ? 'active' : ''
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="flex-1 text-left font-semibold text-lg text-slate-200">
                {item.name}
              </span>
              {item.path === '/ledgers' && (
                <span className="text-xs bg-purple-500/30 text-purple-200 px-3 py-1.5 rounded-lg font-bold border border-purple-500/30">
                  {item.shortcut}
                </span>
              )}
              {item.path !== '/ledgers' && (
                <span className="text-xs bg-white/10 text-slate-300 px-3 py-1.5 rounded-lg font-semibold border border-white/10">
                  {item.shortcut}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-5 rounded-2xl bg-gradient-to-r from-white/5 to-white/0 border border-white/10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl font-black shadow-xl">
              {user.name[0]}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg text-white">{user.name}</p>
              <p className="text-sm text-slate-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={() => router.push('/companies')}
              className="p-3 hover:bg-white/10 rounded-lg transition-all text-slate-300 hover:text-white"
              title="Change Company"
            >
              🔄
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="header px-10 py-7 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-3xl font-black text-white">Ledgers</h2>
              <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30">
                {selectedCompany.name}
              </span>
            </div>
            <p className="text-slate-400 text-lg">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                🔍
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="glass-input pl-14 pr-6 py-4 rounded-xl text-white placeholder-slate-400 text-lg w-80"
                placeholder="Search ledgers..."
              />
            </div>
            <button
              onClick={() => {
                setEditingLedger(null);
                resetForm();
                setShowModal(true);
              }}
              className="btn-primary flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-lg"
            >
              <span className="text-2xl">+</span>
              Create Ledger
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
              <p className="text-xl font-semibold">Loading ledgers...</p>
            </div>
          ) : (
            <div className="glass-card table-glass rounded-3xl border border-white/10 overflow-hidden fade-in">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Group
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Opening Balance
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLedgers.map((ledger) => (
                    <tr key={ledger.id} className="table-row hover:bg-purple-500/10 transition-all">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="text-lg font-semibold text-white">{ledger.name}</div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="text-slate-300">{ledger.group_name}</span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex gap-2">
                          {ledger.is_customer && (
                            <span className="px-3 py-1.5 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full border border-blue-500/30">
                              Customer
                            </span>
                          )}
                          {ledger.is_supplier && (
                            <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30">
                              Supplier
                            </span>
                          )}
                          {!ledger.is_customer && !ledger.is_supplier && (
                            <span className="px-3 py-1.5 bg-slate-500/20 text-slate-300 text-xs font-bold rounded-full border border-slate-500/30">
                              General
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className={`text-lg font-bold ${
                          ledger.opening_balance_type === 'debit' ? 'text-blue-300' : 'text-emerald-300'
                        }`}>
                          ₹{ledger.opening_balance.toFixed(2)} {ledger.opening_balance_type.toUpperCase()}
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="text-slate-400">
                          {ledger.mobile || ledger.phone || '-'}
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(ledger)}
                            className="text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-amber-500/20 transition-all"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(ledger.id)}
                            className="text-red-300 hover:text-red-200 font-semibold flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-red-500/20 transition-all"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredLedgers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-24 text-center">
                        <div className="text-slate-400 text-7xl mb-4">📊</div>
                        <h3 className="text-2xl font-bold text-slate-200 mb-3">No ledgers found</h3>
                        <p className="text-slate-400 text-lg">
                          {search ? 'Try a different search term' : 'Create your first ledger above!'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/10 scale-in">
            <div className="p-8 border-b border-white/10">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                  <span className="text-purple-400 text-3xl">📊</span>
                  {editingLedger ? 'Edit Ledger' : 'Create New Ledger'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingLedger(null);
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
                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-3">
                    Ledger Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="glass-input w-full px-6 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                    placeholder="Enter ledger name..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-3">
                    Ledger Group <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.group_id}
                    onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                    className="glass-input w-full px-6 py-4 rounded-xl text-white text-lg"
                    required
                  >
                    <option value="">Select a group...</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-5 flex-wrap">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_customer}
                      onChange={(e) => setFormData({ ...formData, is_customer: e.target.checked })}
                      className="w-6 h-6 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-lg font-semibold text-slate-200">Is Customer</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_supplier}
                      onChange={(e) => setFormData({ ...formData, is_supplier: e.target.checked })}
                      className="w-6 h-6 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-lg font-semibold text-slate-200">Is Supplier</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-3">
                      Opening Balance
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.opening_balance}
                      onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                      className="glass-input w-full px-6 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-3">
                      Balance Type
                    </label>
                    <select
                      value={formData.opening_balance_type}
                      onChange={(e) => setFormData({ ...formData, opening_balance_type: e.target.value as 'debit' | 'credit' })}
                      className="glass-input w-full px-6 py-4 rounded-xl text-white text-lg"
                    >
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-3">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="glass-input w-full px-6 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-3">
                      Mobile
                    </label>
                    <input
                      type="text"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="glass-input w-full px-6 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                      placeholder="Mobile number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-3">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="glass-input w-full px-6 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-3">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="glass-input w-full px-6 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                    rows={2}
                    placeholder="Enter address..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-3">
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={formData.gst_number}
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                    className="glass-input w-full px-6 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                    placeholder="GSTIN"
                  />
                </div>

                <div className="flex gap-4 pt-5">
                  <button
                    type="submit"
                    className="btn-primary flex-1 px-8 py-4 rounded-xl font-bold text-xl"
                  >
                    {editingLedger ? '✓ Update Ledger' : '✓ Create Ledger'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingLedger(null);
                      resetForm();
                    }}
                    className="btn-secondary px-8 py-4 rounded-xl font-bold text-xl border border-white/20"
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
