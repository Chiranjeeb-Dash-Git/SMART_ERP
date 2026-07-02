
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import api, { Item, StockGroup, Unit } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Particles } from '@/components/Particles';

export default function ItemsPage() {
  const { user, selectedCompany } = useApp();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [groups, setGroups] = useState<StockGroup[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState<Partial<Item>>({
    name: '',
    stock_group_id: '',
    unit_id: '',
    hsn_code: '',
    gst_rate: 0,
    purchase_price: 0,
    selling_price: 0,
    opening_stock: 0,
    opening_rate: 0,
    opening_value: 0,
    is_active: true,
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
      const [itemsData, groupsData, unitsData] = await Promise.all([
        api.getItems(selectedCompany.id),
        api.getStockGroups(selectedCompany.id),
        api.getUnits(selectedCompany.id),
      ]);
      setItems(itemsData);
      setGroups(groupsData);
      setUnits(unitsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.updateItem(editingItem.id, formData);
      } else {
        await api.createItem({ ...formData, company_id: selectedCompany!.id });
      }
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await api.deleteItem(id);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      stock_group_id: '',
      unit_id: '',
      hsn_code: '',
      gst_rate: 0,
      purchase_price: 0,
      selling_price: 0,
      opening_stock: 0,
      opening_rate: 0,
      opening_value: 0,
      is_active: true,
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
              <h2 className="text-3xl font-black text-white">Items / Stock</h2>
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
                setEditingItem(null);
                resetForm();
                setShowModal(true);
              }}
              className="btn-primary flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              <span className="text-2xl">+</span> Add Item
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
              <p className="text-xl font-semibold">Loading items...</p>
            </div>
          ) : (
            <div className="glass-card table-glass rounded-3xl border border-white/10 overflow-hidden fade-in">
              {items.length === 0 ? (
                <div className="p-24 text-center">
                  <div className="text-slate-400 text-7xl mb-6">📦</div>
                  <h3 className="text-2xl font-bold text-slate-200 mb-3">No Items Yet</h3>
                  <p className="text-slate-400 text-lg mb-6">Create your first item to get started</p>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      resetForm();
                      setShowModal(true);
                    }}
                    className="btn-primary px-8 py-4 rounded-xl font-bold text-lg"
                  >
                    Add Item
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
                        Stock Group
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Current Stock
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        GST Rate
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {items.map((item) => (
                      <tr key={item.id} className="table-row hover:bg-purple-500/10 transition-all">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-lg font-semibold text-white">{item.name}</div>
                          {item.hsn_code && (
                            <div className="text-xs text-slate-400">HSN: {item.hsn_code}</div>
                          )}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="text-slate-300">{item.stock_group_name || '-'}</span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div
                            className={`text-lg font-bold ${
                              (item.current_stock || item.opening_stock) > 0 ? 'text-emerald-300' : 'text-red-300'
                            }`}
                          >
                            {item.current_stock || item.opening_stock || 0} {item.unit_symbol || ''}
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="text-slate-300">{(item.gst_rate || 0)}%</span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-amber-500/20 transition-all"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
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
            <div className="glass-card rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 scale-in">
              <div className="p-8 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black flex items-center gap-3 text-white">
                    <span className="text-emerald-400 text-3xl">📦</span>
                    {editingItem ? 'Edit Item' : 'Add Item'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingItem(null);
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
                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-slate-200 mb-3">
                        Item Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="glass-input w-full px-6 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                        placeholder="Enter item name..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-200 mb-3">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={formData.sku || ''}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="glass-input w-full px-6 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                        placeholder="ABC-123"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-200 mb-3">
                        HSN Code
                      </label>
                      <input
                        type="text"
                        value={formData.hsn_code || ''}
                        onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                        className="glass-input w-full px-6 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                        placeholder="HSN"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-200 mb-3">
                        Stock Group
                      </label>
                      <select
                        value={formData.stock_group_id}
                        onChange={(e) => setFormData({ ...formData, stock_group_id: e.target.value })}
                        className="glass-input w-full px-6 py-4 rounded-xl text-white text-lg"
                      >
                        <option value="">Select group...</option>
                        {groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-200 mb-3">
                        Unit
                      </label>
                      <select
                        value={formData.unit_id}
                        onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                        className="glass-input w-full px-6 py-4 rounded-xl text-white text-lg"
                      >
                        <option value="">Select unit...</option>
                        {units.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.name} ({unit.symbol})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-200 mb-3">
                        Purchase Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.purchase_price}
                        onChange={(e) =>
                          setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })
                        }
                        className="glass-input w-full px-6 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-200 mb-3">
                        Selling Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.selling_price}
                        onChange={(e) =>
                          setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })
                        }
                        className="glass-input w-full px-6 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-200 mb-3">
                        GST Rate (%)
                      </label>
                      <input
                        type="number"
                        value={formData.gst_rate}
                        onChange={(e) =>
                          setFormData({ ...formData, gst_rate: parseFloat(e.target.value) || 0 })
                        }
                        className="glass-input w-full px-6 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                        placeholder="18"
                      />
                    </div>
                  </div>

                  {!editingItem && (
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold text-slate-200 mb-3">
                          Opening Stock
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.opening_stock}
                          onChange={(e) => {
                            const qty = parseFloat(e.target.value) || 0;
                            const rate = formData.opening_rate || 0;
                            setFormData({
                              ...formData,
                              opening_stock: qty,
                              opening_value: qty * rate,
                            });
                          }}
                          className="glass-input w-full px-6 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-200 mb-3">
                          Opening Rate
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.opening_rate}
                          onChange={(e) => {
                            const rate = parseFloat(e.target.value) || 0;
                            const qty = formData.opening_stock || 0;
                            setFormData({
                              ...formData,
                              opening_rate: rate,
                              opening_value: qty * rate,
                            });
                          }}
                          className="glass-input w-full px-6 py-4 rounded-xl text-white placeholder-slate-400 text-lg"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="btn-primary flex-1 px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-emerald-500 to-teal-600"
                    >
                      {editingItem ? '✓ Update Item' : '✓ Add Item'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingItem(null);
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
