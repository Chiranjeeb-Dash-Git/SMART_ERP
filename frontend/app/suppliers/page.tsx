
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import api from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Particles } from '@/components/Particles';

export default function SuppliersPage() {
  const { user, selectedCompany } = useApp();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
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
    loadSuppliers();
  }, [user, selectedCompany, router]);

  const loadSuppliers = async () => {
    try {
      const data = await api.getLedgers(selectedCompany!.id, { is_supplier: true });
      setSuppliers(data);
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
              <h2 className="text-3xl font-black text-white">Suppliers</h2>
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
              <p className="text-xl font-semibold">Loading suppliers...</p>
            </div>
          ) : (
            <div className="glass-card table-glass rounded-3xl border border-white/10 overflow-hidden fade-in">
              {suppliers.length === 0 ? (
                <div className="p-24 text-center">
                  <div className="text-slate-400 text-7xl mb-6">🏭</div>
                  <h3 className="text-2xl font-bold text-slate-200 mb-3">No Suppliers Yet</h3>
                  <p className="text-slate-400 text-lg mb-6">Create your first supplier from the Ledgers page</p>
                  <button
                    onClick={() => router.push('/ledgers')}
                    className="btn-primary px-8 py-4 rounded-xl font-bold text-lg"
                  >
                    Go to Ledgers
                  </button>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Supplier Name
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Group
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Opening Balance
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {suppliers.map((supplier) => (
                      <tr key={supplier.id} className="table-row hover:bg-purple-500/10 transition-all">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-lg font-semibold text-white">{supplier.name}</div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="text-slate-300">{supplier.group_name}</span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className={`text-lg font-bold ${
                            supplier.opening_balance_type === 'debit' ? 'text-blue-300' : 'text-emerald-300'
                          }`}>
                            ₹{Number(supplier.opening_balance || 0).toFixed(2)} {supplier.opening_balance_type?.toUpperCase()}
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className={`px-3 py-1.5 inline-flex text-xs font-bold rounded-full border ${
                            supplier.is_active
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 border-red-500/30'
                          }`}>
                            {supplier.is_active ? 'Active' : 'Inactive'}
                          </span>
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
