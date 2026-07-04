
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import api, { Ledger, LedgerGroup } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';



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
    opening_balance_type: 'debit' as 'debit' | 'credit',
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
    <div className="erp-page-container flex flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col p-6 overflow-hidden bg-[var(--erp-bg)]">
        
        <div className="erp-header">
          <div>
            <h2 className="erp-title">Ledgers Master</h2>
            <div className="text-xs text-[var(--erp-text-muted)] mt-1">{selectedCompany.name}</div>
          </div>
          <div className="flex gap-4 items-center">
            <input 
              type="text" 
              placeholder="Search ledgers..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="erp-input w-64"
            />
            <button className="erp-btn erp-btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
              + Create Ledger
            </button>
          </div>
        </div>

        <div className="erp-table-container">
          <table className="erp-table min-w-full">
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                <th className="text-left px-4 py-2">Ledger Name</th>
                <th className="text-left px-4 py-2">Under Group</th>
                <th className="text-left px-4 py-2">Contact</th>
                <th className="text-right px-4 py-2">Opening Balance</th>
                <th className="w-24 text-center px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
              ) : filteredLedgers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8">No ledgers found.</td></tr>
              ) : (
                filteredLedgers.map((ledger, i) => (
                  <tr key={ledger.id} className="border-b border-[var(--erp-border)] hover:bg-black/5 group">
                    <td className="text-center text-[var(--erp-text-muted)] py-2">{i + 1}</td>
                    <td className="font-medium text-[var(--erp-teal)] px-4 py-2">{ledger.name}</td>
                    <td className="text-[var(--erp-text-muted)] px-4 py-2">{ledger.group_name}</td>
                    <td className="text-[var(--erp-text-muted)] px-4 py-2">{ledger.phone || ledger.email || '-'}</td>
                    <td className="text-right font-medium px-4 py-2">
                      {new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(ledger.opening_balance))}
                      <span className="ml-1 text-xs opacity-70">
                        {ledger.opening_balance_type === 'debit' ? 'Dr' : 'Cr'}
                      </span>
                    </td>
                    <td className="text-center px-4 py-2">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(ledger)} className="text-[var(--erp-teal)] hover:underline text-xs">Edit</button>
                        <button onClick={() => handleDelete(ledger.id)} className="text-[var(--erp-danger)] hover:underline text-xs">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => { setShowModal(false); resetForm(); }}>
            <div className="erp-card w-full max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-[var(--erp-border)]">
                <span className="font-semibold text-lg" style={{ color: 'var(--erp-teal)' }}>{editingLedger ? 'Edit Ledger' : 'Create New Ledger'}</span>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500 hover:text-black text-xl">&times;</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="erp-label">Ledger Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="erp-input w-full" required />
                </div>
                <div>
                  <label className="erp-label">Group</label>
                  <select value={formData.group_id} onChange={e => setFormData({ ...formData, group_id: e.target.value })} className="erp-input w-full" required>
                    <option value="">Select group...</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-6 py-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={formData.is_customer} onChange={e => setFormData({ ...formData, is_customer: e.target.checked })} /> Is Customer
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={formData.is_supplier} onChange={e => setFormData({ ...formData, is_supplier: e.target.checked })} /> Is Supplier
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="erp-label">Opening Balance</label>
                    <input type="number" step="0.01" value={formData.opening_balance} onChange={e => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })} className="erp-input w-full" />
                  </div>
                  <div>
                    <label className="erp-label">Balance Type</label>
                    <select value={formData.opening_balance_type} onChange={e => setFormData({ ...formData, opening_balance_type: e.target.value as 'debit' | 'credit' })} className="erp-input w-full">
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="erp-label">Phone</label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="erp-input w-full" />
                  </div>
                  <div>
                    <label className="erp-label">Mobile</label>
                    <input type="text" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} className="erp-input w-full" />
                  </div>
                </div>
                <div>
                  <label className="erp-label">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="erp-input w-full" />
                </div>
                <div>
                  <label className="erp-label">Address</label>
                  <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="erp-input w-full" rows={2}></textarea>
                </div>
                <div>
                  <label className="erp-label">GST Number</label>
                  <input type="text" value={formData.gst_number} onChange={e => setFormData({ ...formData, gst_number: e.target.value })} className="erp-input w-full" />
                </div>
                
                <div className="flex gap-3 justify-end pt-4 mt-2 border-t border-[var(--erp-border)]">
                  <button type="button" className="erp-btn erp-btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="erp-btn erp-btn-primary">{editingLedger ? 'Update' : 'Create'} Ledger</button>
                </div>
              </form>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
