
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './providers';

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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600">{selectedCompany.name}</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{title} Under Construction</h2>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}
