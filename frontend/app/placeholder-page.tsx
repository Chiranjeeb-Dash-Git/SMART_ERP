'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './providers';
import { Sidebar } from '@/components/Sidebar';

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  const { selectedCompany } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!selectedCompany) {
      router.push('/companies');
    }
  }, [selectedCompany, router]);

  if (!selectedCompany) return null;

  return (
    <div className="erp-page-container flex flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col p-6 overflow-hidden bg-[var(--erp-bg)]">
        
        <div className="erp-header">
          <div>
            <h2 className="erp-title">{title}</h2>
            <div className="text-xs text-[var(--erp-text-muted)] mt-1">{selectedCompany.name}</div>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="erp-btn erp-btn-secondary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="erp-card text-center py-16 px-24">
            <div className="text-4xl mb-4">🚧</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--erp-teal)' }}>{title} Under Construction</h2>
            <p style={{ color: 'var(--erp-text-muted)' }}>{description}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
