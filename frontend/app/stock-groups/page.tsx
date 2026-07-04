'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import api, { StockGroup } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';

export default function StockGroupsPage() {
  const { user, selectedCompany } = useApp();
  const router = useRouter();
  const [groups, setGroups] = useState<StockGroup[]>([]);
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
      const data = await api.getStockGroups(selectedCompany!.id);
      setGroups(data);
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

      <main className="flex-1 flex flex-col p-6 overflow-hidden bg-[var(--erp-bg)]">
        <div className="erp-header">
          <div>
            <h2 className="erp-title">Stock Groups</h2>
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
                <th className="text-left">Name</th>
                <th className="text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center py-8">Loading...</td>
                </tr>
              ) : groups.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8">No stock groups found.</td>
                </tr>
              ) : (
                groups.map((group, i) => (
                  <tr key={group.id}>
                    <td className="text-center text-[var(--erp-text-muted)]">{i + 1}</td>
                    <td className="font-medium text-[var(--erp-teal)]">{group.name}</td>
                    <td className="text-[var(--erp-text-muted)]">{group.description || '-'}</td>
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
