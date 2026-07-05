'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import api, { Company } from '@/lib/api';
import { Building2, Pencil, Trash2, LogOut, Plus } from 'lucide-react';

export default function CompaniesPage() {
  const { user, setSelectedCompany, logout } = useApp();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    gst_number: '',
    financial_year_start: '',
    financial_year_end: '',
    state: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    loadCompanies();
  }, [user, router]);

  const loadCompanies = async () => {
    try {
      const data = await api.getCompanies();
      setCompanies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await api.updateCompany(editingCompany.id, formData);
      } else {
        await api.createCompany(formData);
      }
      setShowModal(false);
      setEditingCompany(null);
      resetForm();
      loadCompanies();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      gst_number: '',
      financial_year_start: '',
      financial_year_end: '',
      state: '',
      phone: '',
      email: '',
    });
  }

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      address: company.address || '',
      gst_number: company.gst_number || '',
      financial_year_start: company.financial_year_start || '',
      financial_year_end: company.financial_year_end || '',
      state: company.state || '',
      phone: company.phone || '',
      email: company.email || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this company?')) {
      try {
        await api.deleteCompany(id);
        loadCompanies();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const selectCompany = (company: Company) => {
    setSelectedCompany(company);
    router.push('/dashboard');
  };

  if (!user || !isClient) return null;

  return (
    <div className="erp-page-container bg-[var(--erp-bg)]">
      
      <header className="erp-header relative overflow-hidden">
        {/* Subtle decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--erp-teal)] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="flex justify-between items-start w-full relative z-10 flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-4xl font-black text-[var(--erp-teal)] tracking-tight">Select Company</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--erp-text-muted)' }}>SmartERP Gateway</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-[var(--erp-sidebar-active)]">
                {user.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-semibold text-black">{user.name}</div>
                <div className="text-xs text-[var(--erp-text-muted)]">{user.email}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="erp-btn flex items-center gap-2 border border-[var(--erp-border)] text-black hover:bg-black/5"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6 pt-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-lg font-semibold">Your Companies</h2>
          <button
            onClick={() => {
              setEditingCompany(null);
              resetForm();
              setShowModal(true);
            }}
            disabled={companies.length >= 5}
            className="erp-btn erp-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Company
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-[var(--erp-text-muted)]">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className="erp-card hover:shadow-md transition-all flex flex-col"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded bg-[var(--erp-bg)] flex items-center justify-center text-xl font-bold" style={{ color: 'var(--erp-teal)' }}>
                    {company.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate" style={{ color: 'var(--erp-teal)' }}>{company.name}</h3>
                    {company.gst_number && (
                      <p className="text-xs text-[var(--erp-text-muted)] mt-1">
                        GST: {company.gst_number}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-sm text-[var(--erp-text-muted)] mb-4 flex-1">
                  {company.address ? <p className="truncate">{company.address}</p> : <p className="italic">No address provided</p>}
                </div>

                <div className="flex gap-2 mt-auto pt-4 border-t border-[var(--erp-border)]">
                  <button
                    onClick={() => selectCompany(company)}
                    className="flex-1 erp-btn erp-btn-primary justify-center"
                  >
                    Select
                  </button>
                  <button
                    onClick={() => handleEdit(company)}
                    className="erp-btn erp-btn-secondary"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(company.id)}
                    className="erp-btn erp-btn-danger"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {companies.length === 0 && (
              <div className="col-span-full erp-card text-center py-16 text-[var(--erp-text-muted)]">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-black mb-2">No companies found</h3>
                <p>Click "Create Company" to get started.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="erp-modal-overlay">
          <div className="erp-modal-content max-w-2xl">
            <div className="erp-modal-header">
              <h2 className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {editingCompany ? 'Edit Company' : 'Create Company'}
              </h2>
              <button onClick={() => setShowModal(false)} className="hover:opacity-80">
                ✕
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="erp-label">Company Name *</label>
                  <input
                    type="text" value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="erp-input"
                    required
                  />
                </div>
                
                <div>
                  <label className="erp-label">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="erp-input"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="erp-label">GST Number</label>
                    <input
                      type="text" value={formData.gst_number}
                      onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                      className="erp-input"
                    />
                  </div>
                  <div>
                    <label className="erp-label">State</label>
                    <input
                      type="text" value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="erp-input"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="erp-label">Financial Year Start</label>
                    <input
                      type="date" value={formData.financial_year_start}
                      onChange={(e) => setFormData({ ...formData, financial_year_start: e.target.value })}
                      className="erp-input"
                    />
                  </div>
                  <div>
                    <label className="erp-label">Financial Year End</label>
                    <input
                      type="date" value={formData.financial_year_end}
                      onChange={(e) => setFormData({ ...formData, financial_year_end: e.target.value })}
                      className="erp-input"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="erp-label">Phone Number</label>
                    <input
                      type="text" value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="erp-input"
                    />
                  </div>
                  <div>
                    <label className="erp-label">Email</label>
                    <input
                      type="email" value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="erp-input"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--erp-border)] mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="erp-btn erp-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="erp-btn erp-btn-primary">
                    {editingCompany ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
