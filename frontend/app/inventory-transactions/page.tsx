
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import api, { InventoryTransaction, StockItem } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Particles } from '@/components/Particles';

export default function InventoryTransactionsPage() {
  const { user, selectedCompany } = useApp();
  const router = useRouter();
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [filterItemId, setFilterItemId] = useState<string>('');

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
  }, [user, selectedCompany, router, filterItemId]);

  const loadData = async () => {
    try {
      const [txData, itemsData] = await Promise.all([
        api.getInventoryTransactions(selectedCompany.id, { item_id: filterItemId || undefined }),
        api.getStockItems(selectedCompany.id),
      ]);
      setTransactions(txData);
      setItems(itemsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
              <h2 className="text-3xl font-black text-white">Inventory Transactions</h2>
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
            <select
              value={filterItemId}
              onChange={(e) => setFilterItemId(e.target.value)}
              className="glass-input px-6 py-3 rounded-xl text-white text-lg"
            >
              <option value="">All Items</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
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
              <p className="text-xl font-semibold">Loading inventory transactions...</p>
            </div>
          ) : (
            <div className="glass-card table-glass rounded-3xl border border-white/10 overflow-hidden fade-in">
              {transactions.length === 0 ? (
                <div className="p-24 text-center">
                  <div className="text-slate-400 text-7xl mb-6">📦</div>
                  <h3 className="text-2xl font-bold text-slate-200 mb-3">No Inventory Transactions Yet</h3>
                  <p className="text-slate-400 text-lg">Transactions will appear here as you create purchase and sales vouchers.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="table-row hover:bg-purple-500/10 transition-all">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="text-slate-300">
                            {new Date(tx.transaction_date).toLocaleDateString('en-IN')}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-lg font-semibold text-white">{tx.item_name || '-'}</div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span
                            className={`px-3 py-1.5 inline-flex text-xs font-bold rounded-full border ${
                              tx.transaction_type === 'IN'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-red-500/20 text-red-300 border-red-500/30'
                            }`}
                          >
                            {tx.transaction_type}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div
                            className={`text-lg font-semibold ${
                              tx.transaction_type === 'IN' ? 'text-emerald-300' : 'text-red-300'
                            }`}
                          >
                            {tx.transaction_type === 'IN' ? '+' : '-'}{tx.quantity} {tx.unit_symbol || ''}
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="text-slate-300">₹{(tx.rate || 0).toFixed(2)}</span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-lg font-semibold text-white">₹{(tx.amount || 0).toFixed(2)}</div>
                        </td>
                      </tr>
                    ))}
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
