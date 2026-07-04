
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
        api.getStockSummaryReport(selectedCompany!.id),
        api.getSalesSummaryReport(selectedCompany!.id),
        api.getPurchaseSummaryReport(selectedCompany!.id),
        api.getProfitLossReport(selectedCompany!.id)
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
    <div className="erp-page-container flex flex-row p-0">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden bg-[var(--erp-bg)]">
        <header className="erp-header relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--erp-teal)] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          
          <div className="flex justify-between items-start w-full relative z-10">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h2 className="text-4xl font-black text-[var(--erp-teal)] tracking-tight">Reports</h2>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded border border-emerald-100 uppercase tracking-widest">
                  {selectedCompany.name}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
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
                className="erp-btn erp-btn-secondary"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--erp-text-muted)]">
              <div className="text-5xl mb-4 animate-spin text-[var(--erp-teal)]"><span className="material-symbols-outlined text-[48px]">sync</span></div>
              <p className="text-lg font-semibold">Loading reports...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profit & Loss */}
              <div className="erp-card fade-in">
                <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2 uppercase tracking-wide">
                  <span className="material-symbols-outlined text-[var(--erp-teal)]">monitoring</span>
                  Profit & Loss
                </h2>
                {profitLoss ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-xl border border-emerald-100 shadow-sm">
                      <div className="text-xs text-emerald-700 font-bold uppercase tracking-wider mb-2">Total Income</div>
                      <div className="text-3xl font-black text-gray-900 truncate" title={`₹${(profitLoss.total_income || 0).toFixed(2)}`}>₹{(profitLoss.total_income || 0).toFixed(2)}</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-white p-5 rounded-xl border border-red-100 shadow-sm">
                      <div className="text-xs text-red-600 font-bold uppercase tracking-wider mb-2">Total Expenses</div>
                      <div className="text-3xl font-black text-gray-900 truncate" title={`₹${(profitLoss.total_expenses || 0).toFixed(2)}`}>₹{(profitLoss.total_expenses || 0).toFixed(2)}</div>
                    </div>
                    <div className={`p-5 rounded-xl border shadow-sm ${(profitLoss.net_profit || 0) >= 0 
                      ? 'bg-gradient-to-br from-blue-50 to-white border-blue-100' 
                      : 'bg-gradient-to-br from-red-50 to-white border-red-100'}`}>
                      <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${(profitLoss.net_profit || 0) >= 0 
                        ? 'text-blue-700' 
                        : 'text-red-600'}`}>
                        {(profitLoss.net_profit || 0) >= 0 ? 'Net Profit' : 'Net Loss'}
                      </div>
                      <div className={`text-3xl font-black truncate ${(profitLoss.net_profit || 0) >= 0 
                        ? 'text-blue-800' 
                        : 'text-red-700'}`} title={`₹${(profitLoss.net_profit || 0).toFixed(2)}`}>
                        ₹{(profitLoss.net_profit || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-gray-400">No data yet</div>
                )}
              </div>

              {/* Sales Summary */}
              <div className="erp-card fade-in">
                <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2 uppercase tracking-wide">
                  <span className="material-symbols-outlined text-[var(--erp-teal)]">point_of_sale</span>
                  Sales Summary
                </h2>
                {salesSummary ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 shadow-sm text-center">
                      <div className="text-3xl font-black text-[var(--erp-teal)] truncate">{salesSummary.voucher_count || 0}</div>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-2">Sales Transactions</div>
                    </div>
                    <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 shadow-sm text-center">
                      <div className="text-3xl font-black text-emerald-700 truncate" title={`₹${(salesSummary.total_sales || 0).toFixed(2)}`}>₹{(salesSummary.total_sales || 0).toFixed(2)}</div>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-2">Total Sales</div>
                    </div>
                    <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 shadow-sm text-center">
                      <div className="text-3xl font-black text-amber-600 truncate" title={`₹${(salesSummary.total_tax || 0).toFixed(2)}`}>₹{(salesSummary.total_tax || 0).toFixed(2)}</div>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-2">Total GST</div>
                    </div>
                    <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 shadow-sm text-center">
                      <div className="text-3xl font-black text-[var(--erp-teal)] truncate" title={`₹${(salesSummary.total_net || 0).toFixed(2)}`}>₹{(salesSummary.total_net || 0).toFixed(2)}</div>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-2">Net Amount</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-gray-400">No sales data yet</div>
                )}
              </div>

              {/* Purchase Summary */}
              <div className="erp-card fade-in">
                <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2 uppercase tracking-wide">
                  <span className="material-symbols-outlined text-[var(--erp-teal)]">inventory_2</span>
                  Purchase Summary
                </h2>
                {purchaseSummary ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 shadow-sm text-center">
                      <div className="text-3xl font-black text-blue-700 truncate">{purchaseSummary.voucher_count || 0}</div>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-2">Purchase Transactions</div>
                    </div>
                    <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 shadow-sm text-center">
                      <div className="text-3xl font-black text-red-600 truncate" title={`₹${(purchaseSummary.total_purchases || 0).toFixed(2)}`}>₹{(purchaseSummary.total_purchases || 0).toFixed(2)}</div>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-2">Total Purchases</div>
                    </div>
                    <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 shadow-sm text-center">
                      <div className="text-3xl font-black text-amber-600 truncate" title={`₹${(purchaseSummary.total_tax || 0).toFixed(2)}`}>₹{(purchaseSummary.total_tax || 0).toFixed(2)}</div>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-2">Total GST</div>
                    </div>
                    <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 shadow-sm text-center">
                      <div className="text-3xl font-black text-[var(--erp-teal)] truncate" title={`₹${(purchaseSummary.total_net || 0).toFixed(2)}`}>₹{(purchaseSummary.total_net || 0).toFixed(2)}</div>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-2">Net Amount</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-gray-400">No purchase data yet</div>
                )}
              </div>

              {/* Stock Summary */}
              <div className="erp-card fade-in flex flex-col">
                <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <span className="material-symbols-outlined text-[var(--erp-teal)]">inventory</span>
                  Stock Summary
                </h2>
                {stockReport.length > 0 ? (
                  <div className="erp-table-container">
                    <table className="erp-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>SKU</th>
                          <th>Stock</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockReport.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <div className="font-bold text-gray-900">{item.item_name}</div>
                            </td>
                            <td>{item.sku || '-'}</td>
                            <td>
                              <span className="erp-badge">{item.current_stock || 0} units</span>
                            </td>
                            <td>
                              <span className="font-bold">₹{(item.value || 0).toFixed(2)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-gray-400">No stock items yet</div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
