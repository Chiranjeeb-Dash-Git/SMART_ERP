'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import api from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';

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
    <div className="erp-page-container flex flex-row">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden bg-[var(--erp-bg)]">
        <div className="erp-header relative overflow-hidden">
          {/* Subtle decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--erp-teal)] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div>
            <h2 className="erp-title">Suppliers</h2>
            <div className="text-xs text-[var(--erp-text-muted)] mt-1">{selectedCompany.name}</div>
          </div>
          <div className="flex items-center gap-4">
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
                <th className="text-left">Supplier Name</th>
                <th className="text-left">Group</th>
                <th className="text-right">Opening Balance</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">Loading...</td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">No suppliers found. Create one in Ledgers.</td>
                </tr>
              ) : (
                suppliers.map((supplier, i) => (
                  <tr key={supplier.id}>
                    <td className="text-center text-[var(--erp-text-muted)]">{i + 1}</td>
                    <td className="font-medium text-[var(--erp-teal)]">{supplier.name}</td>
                    <td className="text-[var(--erp-text-muted)]">{supplier.group_name}</td>
                    <td className="text-right font-medium">
                      {new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(Number(supplier.opening_balance || 0))}
                      <span className="ml-1 text-xs opacity-70">
                        {supplier.opening_balance_type === 'debit' ? 'Dr' : 'Cr'}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={supplier.is_active ? 'erp-badge' : 'erp-badge erp-badge-danger'}>
                        {supplier.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
