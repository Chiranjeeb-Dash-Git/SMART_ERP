
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import api, { Unit } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Particles } from '@/components/Particles';

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
      const data = await api.getUnits(selectedCompany.id);
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
    <div className="flex h-screen relative">
      <Particles />
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="header px-10 py-7 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-3xl font-black text-white">Units of Measurement</h2>
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
            <button
              onClick={() => {
                setEditingUnit(null);
                resetForm();
                setShowModal(true);
              }}
              className="btn-primary flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-lg"
            >
              <span className="text-2xl">+</span> Create Unit
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-secondary flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-lg border border-white/20"
            >
              ← Back
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="text-7xl mb-5 animate-spin text-purple-400">⏳</div>
              <p className="text-xl font-semibold">Loading units...</p>
            </div>
          ) : (
            <div className="glass-card table-glass rounded-3xl border border-white/10 overflow-hidden fade-in">
              {units.length === 0 ? (
                <div className="p-24 text-center">
                  <div className="text-slate-400 text-7xl mb-6">📏</div>
                  <h3 className="text-2xl font-bold text-slate-200 mb-3">No Units Yet</h3>
                  <p className="text-slate-400 text-lg mb-6">Create your first unit to get started</p>
                  <button
                    onClick={() => {
                      setEditingUnit(null);
                      resetForm();
                      setShowModal(true);
                    }}
                    className="btn-primary px-8 py-4 rounded-xl font-bold text-lg"
                  >
                    Create Unit
                  </button>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Symbol
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {units.map((unit) => (
                      <tr key={unit.id} className="table-row hover:bg-purple-500/10 transition-all">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-lg font-semibold text-white">{unit.name}</div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="text-slate-300 font-mono">{unit.symbol}</span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="text-slate-300">{unit.description || '-'}</span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(unit)}
                              className="text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-amber-500/20 transition-all"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(unit.id)}
                              className="text-red-300 hover:text-red-200 font-semibold flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-red-500/20 transition-all"
                            >
                              🗑️ Delete
                            </button>
                          </div>
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
            <div className="glass-card rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/10 scale-in">
              <div className="p-8 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black flex items-center gap-3 text-white">
                    <span className="text-blue-400 text-3xl">📏</span>
                    {editingUnit ? 'Edit Unit' : 'Create New Unit'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingUnit(null);
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
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="glass-input w-full px-6 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                      placeholder="Enter unit name..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-3">
                      Symbol <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.symbol}
                      onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                      className="glass-input w-full px-6 py-4 rounded-xl text-white placeholder-slate-400 text-lg font-mono"
                      placeholder="Enter unit symbol..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-3">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="glass-input w-full px-6 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                      rows={2}
                      placeholder="Enter description..."
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="btn-primary flex-1 px-8 py-4 rounded-xl font-bold text-lg"
                    >
                      {editingUnit ? '✓ Update Unit' : '✓ Create Unit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingUnit(null);
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
