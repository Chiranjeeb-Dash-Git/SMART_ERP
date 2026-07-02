
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import api, { StockItem } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Particles } from '@/components/Particles';

export default function StockSummaryPage() {
  const { user, selectedCompany } = useApp();
  const router = useRouter();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

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
      const data = await api.getStockSummary(selectedCompany.id);
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isClient || !user || !selectedCompany) return null;

  const totalStockValue = items.reduce((sum, item) => {
    const stock = (item.current_stock || 0) || (item.opening_stock || 0);
    const rate = (item.purchase_price || 0) || (item.opening_rate || 0);
    return sum + (stock * rate || 0);
  }, 0);

  return (
    <div className="flex h-screen relative">
      <Particles />
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="header px-10 py-7 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-3xl font-black text-white">Stock Summary</h2>
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
            <div className="glass-card rounded-xl border border-white/10 px-8 py-4">
              <div className="text-sm text-slate-400">Total Stock Value</div>
              <div className="text-3xl font-black text-emerald-300">₹{totalStockValue.toFixed(2)}</div>
            </div>
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
              <p className="text-xl font-semibold">Loading stock summary...</p>
            </div>
          ) : (
            <div className="glass-card table-glass rounded-3xl border border-white/10 overflow-hidden fade-in">
              {items.length === 0 ? (
                <div className="p-24 text-center">
                  <div className="text-slate-400 text-7xl mb-6">📦</div>
                  <h3 className="text-2xl font-bold text-slate-200 mb-3">No Stock Items Yet</h3>
                  <p className="text-slate-400 text-lg">Add stock items to see the summary here.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Current Stock
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Available
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {items.map((item) => {
                      const currentStock = item.current_stock || item.opening_stock || 0;
                      const availableStock = item.available_stock || currentStock;
                      const rate = (item.purchase_price || item.opening_rate) || 0;
                      return (
                        <tr key={item.id} className="table-row hover:bg-purple-500/10 transition-all">
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="text-lg font-semibold text-white">{item.name}</div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <span className="text-slate-300">{item.sku || '-'}</span>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="text-lg font-semibold text-white">
                              {currentStock} {item.unit_symbol || ''}
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div
                              className={`text-lg font-semibold ${
                                availableStock > 0 ? 'text-emerald-300' : 'text-red-300'
                              }`}
                            >
                              {availableStock} {item.unit_symbol || ''}
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <span className="text-slate-300">₹{(rate || 0).toFixed(2)}</span>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="text-lg font-semibold text-white">
                              ₹{((currentStock || 0) * (rate || 0)).toFixed(2)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
