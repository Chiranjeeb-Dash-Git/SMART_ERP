
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
      const data = await api.getStockSummary(selectedCompany!.id);
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
    <div className="erp-page-container flex flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--erp-bg)]">
        <div className="erp-header relative overflow-hidden">
          {/* Subtle decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--erp-teal)] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div>
            <h2 className="erp-title">Stock Summary</h2>
            <div className="text-xs text-[var(--erp-text-muted)] mt-1">{selectedCompany.name}</div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="erp-card px-4 py-2 border-l-4 border-l-[var(--erp-teal)] flex flex-col items-end shadow-sm">
              <div className="text-xs text-[var(--erp-text-muted)] font-medium">Total Stock Value</div>
              <div className="text-lg font-bold text-[var(--erp-teal)]">₹{totalStockValue.toFixed(2)}</div>
            </div>
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
                <th className="text-left px-4 py-2">Item</th>
                <th className="text-left px-4 py-2">SKU</th>
                <th className="text-left px-4 py-2">Current Stock</th>
                <th className="text-left px-4 py-2">Available</th>
                <th className="text-right px-4 py-2">Rate</th>
                <th className="text-right px-4 py-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-[var(--erp-text-muted)]">No stock items found.</td></tr>
              ) : (
                items.map((item) => {
                  const currentStock = item.current_stock || item.opening_stock || 0;
                  const availableStock = item.available_stock || currentStock;
                  const rate = (item.purchase_price || item.opening_rate) || 0;
                  return (
                    <tr key={item.id} className="border-b border-[var(--erp-border)] hover:bg-black/5">
                      <td className="px-4 py-3 font-medium text-[var(--erp-teal)]">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-[var(--erp-text-muted)]">
                        {item.sku || '-'}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-800">
                        {currentStock} <span className="text-xs font-normal text-gray-500">{item.unit_symbol || ''}</span>
                      </td>
                      <td className="px-4 py-3 font-bold">
                        <span className={availableStock > 0 ? 'text-emerald-700' : 'text-red-700'}>
                          {availableStock} <span className="text-xs font-normal text-gray-500">{item.unit_symbol || ''}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--erp-text-muted)]">
                        ₹{(rate || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[var(--erp-teal)]">
                        ₹{((currentStock || 0) * (rate || 0)).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
