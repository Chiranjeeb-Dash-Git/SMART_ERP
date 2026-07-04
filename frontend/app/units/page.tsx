'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import api, { Unit } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Pencil, Trash2, Plus } from 'lucide-react';

export default function UnitsPage() {
  const { user, selectedCompany } = useApp();
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState<Partial<Unit>>({
    name: '',
    symbol: '',
    description: '',
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
  }, [user, selectedCompany, router]);

  const loadData = async () => {
    try {
      const data = await api.getUnits(selectedCompany!.id);
      setUnits(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUnit) {
        await api.updateUnit(editingUnit.id, formData);
      } else {
        await api.createUnit({ ...formData, company_id: selectedCompany!.id });
      }
      setShowModal(false);
      setEditingUnit(null);
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData(unit);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this unit?')) {
      try {
        await api.deleteUnit(id);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      symbol: '',
      description: '',
    });
  };

  if (!isClient || !user || !selectedCompany) return null;

  return (
    <div className="erp-page-container flex flex-row">
      <Sidebar />

      <main className="flex-1 flex flex-col p-6 overflow-hidden bg-[var(--erp-bg)]">
        <div className="erp-header">
          <div>
            <h2 className="erp-title">Units of Measurement</h2>
            <div className="text-xs text-[var(--erp-text-muted)] mt-1">{selectedCompany.name}</div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setEditingUnit(null);
                resetForm();
                setShowModal(true);
              }}
              className="erp-btn erp-btn-primary"
            >
              + Create Unit
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="erp-btn erp-btn-secondary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                <th className="text-left">Name</th>
                <th className="text-left">Symbol</th>
                <th className="text-left">Description</th>
                <th className="w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">Loading...</td>
                </tr>
              ) : units.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">No units found.</td>
                </tr>
              ) : (
                units.map((unit, i) => (
                  <tr key={unit.id} className="group">
                    <td className="text-center text-[var(--erp-text-muted)]">{i + 1}</td>
                    <td className="font-medium text-[var(--erp-teal)]">{unit.name}</td>
                    <td className="font-medium">{unit.symbol}</td>
                    <td className="text-[var(--erp-text-muted)]">{unit.description || '-'}</td>
                    <td className="text-center">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(unit)} className="text-[var(--erp-teal)] hover:underline text-xs">Edit</button>
                        <button onClick={() => handleDelete(unit.id)} className="text-[var(--erp-danger)] hover:underline text-xs">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="erp-modal-overlay">
          <div className="erp-modal-content max-w-md">
            <div className="erp-modal-header">
              <h2 className="text-lg">
                {editingUnit ? 'Edit Unit' : 'Create New Unit'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingUnit(null); resetForm(); }} className="hover:opacity-80">
                ✕
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="erp-label">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="erp-input"
                    required
                  />
                </div>

                <div>
                  <label className="erp-label">Symbol *</label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="erp-input"
                    required
                  />
                </div>

                <div>
                  <label className="erp-label">Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="erp-input"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--erp-border)] mt-6">
                  <button type="button" onClick={() => { setShowModal(false); setEditingUnit(null); resetForm(); }} className="erp-btn erp-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="erp-btn erp-btn-primary">
                    {editingUnit ? 'Update' : 'Save'}
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
