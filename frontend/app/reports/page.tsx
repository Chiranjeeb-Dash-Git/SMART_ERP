
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import api from '../../lib/api';
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

export default function ReportsPage() {
  const { selectedCompany, user } = useApp();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [stockReport, setStockReport] = useState<any[]>([]);
  const [salesSummary, setSalesSummary] = useState<any>(null);
  const [purchaseSummary, setPurchaseSummary] = useState<any>(null);
  const [profitLoss, setProfitLoss] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    loadReports();
  }, [selectedCompany, router, user]);

  const loadReports = async () => {
    try {
      const [stockData, salesData, purchaseData, plData] = await Promise.all([
        api.getStockSummaryReport(selectedCompany.id),
        api.getSalesSummaryReport(selectedCompany.id),
        api.getPurchaseSummaryReport(selectedCompany.id),
        api.getProfitLossReport(selectedCompany.id)
      ]);
      setStockReport(stockData);
      setSalesSummary(salesData);
      setPurchaseSummary(purchaseData);
      setProfitLoss(plData);
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
              <h2 className="text-3xl font-black text-white">Reports</h2>
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
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-secondary flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-lg border border-white/20"
            >
              ← Back to Dashboard
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="text-7xl mb-5 animate-spin text-purple-400">⏳</div>
              <p className="text-xl font-semibold">Loading reports...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Profit & Loss */}
              <div className="glass-card rounded-3xl p-8 border border-white/10 fade-in">
                <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                  <span className="text-emerald-400 text-3xl">📊</span>
                  Profit & Loss
                </h2>
                {profitLoss ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-6 rounded-2xl border border-emerald-500/20">
                      <div className="text-sm text-emerald-400 font-semibold mb-2">Total Income</div>
                      <div className="text-3xl font-black text-white">₹{(profitLoss.total_income || 0).toFixed(2)}</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 p-6 rounded-2xl border border-red-500/20">
                      <div className="text-sm text-red-400 font-semibold mb-2">Total Expenses</div>
                      <div className="text-3xl font-black text-white">₹{(profitLoss.total_expenses || 0).toFixed(2)}</div>
                    </div>
                    <div className={`p-6 rounded-2xl border ${(profitLoss.net_profit || 0) >= 0 
                      ? 'bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20' 
                      : 'bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20'}`}>
                      <div className={`text-sm font-semibold mb-2 ${(profitLoss.net_profit || 0) >= 0 
                        ? 'text-blue-400' 
                        : 'text-red-400'}`}>
                        {(profitLoss.net_profit || 0) >= 0 ? 'Net Profit' : 'Net Loss'}
                      </div>
                      <div className={`text-3xl font-black ${(profitLoss.net_profit || 0) >= 0 
                        ? 'text-blue-400' 
                        : 'text-red-400'}`}>
                        ₹{(profitLoss.net_profit || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-lg">No data yet</div>
                )}
              </div>

              {/* Sales Summary */}
              <div className="glass-card rounded-3xl p-8 border border-white/10 fade-in">
                <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                  <span className="text-blue-400 text-3xl">💰</span>
                  Sales Summary
                </h2>
                {salesSummary ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="p-6 border border-blue-500/20 rounded-2xl bg-blue-500/5 text-center">
                      <div className="text-4xl font-black text-blue-400">{salesSummary.voucher_count || 0}</div>
                      <div className="text-sm text-slate-400 font-semibold mt-2">Sales Transactions</div>
                    </div>
                    <div className="p-6 border border-emerald-500/20 rounded-2xl bg-emerald-500/5 text-center">
                      <div className="text-4xl font-black text-emerald-400">₹{(salesSummary.total_sales || 0).toFixed(2)}</div>
                      <div className="text-sm text-slate-400 font-semibold mt-2">Total Sales</div>
                    </div>
                    <div className="p-6 border border-orange-500/20 rounded-2xl bg-orange-500/5 text-center">
                      <div className="text-4xl font-black text-orange-400">₹{(salesSummary.total_tax || 0).toFixed(2)}</div>
                      <div className="text-sm text-slate-400 font-semibold mt-2">Total GST</div>
                    </div>
                    <div className="p-6 border border-purple-500/20 rounded-2xl bg-purple-500/5 text-center">
                      <div className="text-4xl font-black text-purple-400">₹{(salesSummary.total_net || 0).toFixed(2)}</div>
                      <div className="text-sm text-slate-400 font-semibold mt-2">Net Amount</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-lg">No sales data yet</div>
                )}
              </div>

              {/* Purchase Summary */}
              <div className="glass-card rounded-3xl p-8 border border-white/10 fade-in">
                <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                  <span className="text-orange-400 text-3xl">📦</span>
                  Purchase Summary
                </h2>
                {purchaseSummary ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="p-6 border border-blue-500/20 rounded-2xl bg-blue-500/5 text-center">
                      <div className="text-4xl font-black text-blue-400">{purchaseSummary.voucher_count || 0}</div>
                      <div className="text-sm text-slate-400 font-semibold mt-2">Purchase Transactions</div>
                    </div>
                    <div className="p-6 border border-red-500/20 rounded-2xl bg-red-500/5 text-center">
                      <div className="text-4xl font-black text-red-400">₹{(purchaseSummary.total_purchases || 0).toFixed(2)}</div>
                      <div className="text-sm text-slate-400 font-semibold mt-2">Total Purchases</div>
                    </div>
                    <div className="p-6 border border-orange-500/20 rounded-2xl bg-orange-500/5 text-center">
                      <div className="text-4xl font-black text-orange-400">₹{(purchaseSummary.total_tax || 0).toFixed(2)}</div>
                      <div className="text-sm text-slate-400 font-semibold mt-2">Total GST</div>
                    </div>
                    <div className="p-6 border border-purple-500/20 rounded-2xl bg-purple-500/5 text-center">
                      <div className="text-4xl font-black text-purple-400">₹{(purchaseSummary.total_net || 0).toFixed(2)}</div>
                      <div className="text-sm text-slate-400 font-semibold mt-2">Net Amount</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-lg">No purchase data yet</div>
                )}
              </div>

              {/* Stock Summary */}
              <div className="glass-card rounded-3xl p-8 border border-white/10 fade-in">
                <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                  <span className="text-cyan-400 text-3xl">📋</span>
                  Stock Summary
                </h2>
                {stockReport.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-8 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Item</th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">SKU</th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Stock</th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {stockReport.map((item, idx) => (
                          <tr key={idx} className="table-row hover:bg-purple-500/10 transition-all">
                            <td className="px-8 py-4 whitespace-nowrap">
                              <div className="text-lg font-semibold text-white">{item.item_name}</div>
                            </td>
                            <td className="px-8 py-4 whitespace-nowrap text-slate-400">{item.sku || '-'}</td>
                            <td className="px-8 py-4 whitespace-nowrap text-slate-300">
                              {item.current_stock || 0} units
                            </td>
                            <td className="px-8 py-4 whitespace-nowrap text-lg font-semibold text-white">
                              ₹{(item.value || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-slate-400 text-lg">No stock items yet</div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
