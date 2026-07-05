
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import api, { StockItem, StockGroup, Unit } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Particles } from '@/components/Particles';

export default function StockItemsPage() {
  const { user, selectedCompany } = useApp();
  const router = useRouter();
  const [items, setItems] = useState<StockItem[]>([]);
  const [groups, setGroups] = useState<StockGroup[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [formData, setFormData] = useState<Partial<StockItem>>({
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
        api.getStockItems(selectedCompany!.id),
        api.getStockGroups(selectedCompany!.id),
        api.getUnits(selectedCompany!.id),
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
        await api.updateStockItem(editingItem.id, formData);
      } else {
        await api.createStockItem({ ...formData, company_id: selectedCompany!.id });
      }
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this stock item?')) {
      try {
        await api.deleteStockItem(id);
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
    <div className="erp-page-container flex flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--erp-bg)]">
        
        <div className="erp-header relative overflow-hidden">
          {/* Subtle decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--erp-teal)] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div>
            <h2 className="erp-title">Stock Items Master</h2>
            <div className="text-xs text-[var(--erp-text-muted)] mt-1">{selectedCompany.name}</div>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => {
                setEditingItem(null);
                resetForm();
                setShowModal(true);
              }}
              className="erp-btn erp-btn-primary"
            >
              + Add Stock Item
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="erp-btn erp-btn-secondary"
            >
              ← Back
            </button>
          </div>
        </div>

        <div className="erp-table-container">
          <table className="erp-table min-w-full">
            <thead>
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Stock Group</th>
                <th className="text-left px-4 py-2">Current Stock</th>
                <th className="text-left px-4 py-2">GST Rate</th>
                <th className="text-center px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-[var(--erp-text-muted)]">No stock items found.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--erp-border)] hover:bg-black/5 group">
                    <td className="px-4 py-3 font-medium text-[var(--erp-teal)]">
                      {item.name}
                      {item.hsn_code && <div className="text-xs text-[var(--erp-text-muted)] font-normal">HSN: {item.hsn_code}</div>}
                    </td>
                    <td className="px-4 py-3 text-[var(--erp-text-muted)]">
                      {item.stock_group_name || '-'}
                    </td>
                    <td className="px-4 py-3 font-bold">
                      <span className={(item.current_stock || item.opening_stock) > 0 ? 'text-emerald-700' : 'text-red-700'}>
                        {item.current_stock || item.opening_stock || 0} {item.unit_symbol || ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--erp-text-muted)]">
                      {(item.gst_rate || 0)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-[var(--erp-teal)] hover:underline text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:underline text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Delete
                        </button>
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
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => { setShowModal(false); setEditingItem(null); resetForm(); }}>
            <div className="erp-card w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--erp-border)]">
                <h3 className="text-xl font-semibold" style={{ color: 'var(--erp-teal)' }}>
                  {editingItem ? 'Edit Stock Item' : 'Add Stock Item'}
                </h3>
                <button onClick={() => { setShowModal(false); setEditingItem(null); resetForm(); }} className="text-gray-500 hover:text-black">
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="erp-label">Item Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="erp-input w-full"
                      placeholder="Enter item name..."
                      required
                    />
                  </div>

                  <div>
                    <label className="erp-label">SKU</label>
                    <input
                      type="text"
                      value={formData.sku || ''}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="erp-input w-full"
                      placeholder="ABC-123"
                    />
                  </div>
                  <div>
                    <label className="erp-label">HSN Code</label>
                    <input
                      type="text"
                      value={formData.hsn_code || ''}
                      onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                      className="erp-input w-full"
                      placeholder="HSN"
                    />
                  </div>

                  <div>
                    <label className="erp-label">Stock Group</label>
                    <select
                      value={formData.stock_group_id}
                      onChange={(e) => setFormData({ ...formData, stock_group_id: e.target.value })}
                      className="erp-input w-full"
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
                    <label className="erp-label">Unit</label>
                    <select
                      value={formData.unit_id}
                      onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                      className="erp-input w-full"
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

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="erp-label">Purchase Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) =>
                        setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })
                      }
                      className="erp-input w-full"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="erp-label">Selling Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={(e) =>
                        setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })
                      }
                      className="erp-input w-full"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="erp-label">GST Rate (%)</label>
                    <input
                      type="number"
                      value={formData.gst_rate}
                      onChange={(e) =>
                        setFormData({ ...formData, gst_rate: parseFloat(e.target.value) || 0 })
                      }
                      className="erp-input w-full"
                      placeholder="18"
                    />
                  </div>
                </div>

                {!editingItem && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="erp-label">Opening Stock</label>
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
                        className="erp-input w-full"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="erp-label">Opening Rate</label>
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
                        className="erp-input w-full"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingItem(null);
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
                    {editingItem ? 'Update' : 'Add'} Item
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
