
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../providers';
import api, { Company } from '@/lib/api';

// Particles component
const Particles = () => {
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
    contact_info: '',
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
      setFormData({
        name: '',
        address: '',
        gst_number: '',
        financial_year_start: '',
        financial_year_end: '',
        state: '',
        contact_info: '',
      });
      loadCompanies();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      address: company.address || '',
      gst_number: company.gst_number || '',
      financial_year_start: company.financial_year_start || '',
      financial_year_end: company.financial_year_end || '',
      state: company.state || '',
      contact_info: company.contact_info || '',
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex flex-col relative">
      {isClient && <Particles />}

      <header className="header px-10 py-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl">
            SE
          </div>
          <h1 className="text-4xl font-black gradient-text">Select Company</h1>
        </div>
        <div className="flex items-center space-x-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-2xl">
              {user.name.charAt(0)}
            </div>
            <span className="text-slate-200 font-bold text-xl">{user.name}</span>
          </div>
          <button
            onClick={logout}
            className="btn-secondary flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-lg border border-white/20"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 p-10 max-w-7xl mx-auto w-full">
        <div className="flex justify-end mb-10">
          <button
            onClick={() => {
              setEditingCompany(null);
              setFormData({
                name: '',
                address: '',
                gst_number: '',
                financial_year_start: '',
                financial_year_end: '',
                state: '',
                contact_info: '',
              });
              setShowModal(true);
            }}
            disabled={companies.length >= 5}
            className="btn-primary flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-xl disabled:opacity-50"
          >
            <span className="text-2xl">+</span>
            Create Company
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="text-7xl mb-5 animate-spin text-purple-400">⏳</div>
            <p className="text-2xl font-semibold text-slate-400">Loading your companies...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {companies.map((company) => (
              <div
                key={company.id}
                className="glass-card rounded-3xl border border-white/10 p-8 hover:scale-105 transition-all duration-300 hover:shadow-2xl fade-in"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl">
                    {company.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white mb-1">{company.name}</h3>
                  </div>
                </div>

                {company.address && (
                  <p className="text-slate-300 text-lg mb-2">{company.address}</p>
                )}
                {company.gst_number && (
                  <p className="text-slate-400 text-sm mb-6">
                    GST: {company.gst_number}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => selectCompany(company)}
                    className="flex-1 btn-primary py-4 rounded-2xl font-bold text-xl"
                  >
                    Select
                  </button>
                  <button
                    onClick={() => handleEdit(company)}
                    className="px-5 py-4 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-2xl transition-all font-bold text-xl border border-amber-500/30"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(company.id)}
                    className="px-5 py-4 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-2xl transition-all font-bold text-xl border border-red-500/30"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}

            {companies.length === 0 && (
              <div className="col-span-full glass-card rounded-3xl border border-white/10 p-16 text-center fade-in">
                <div className="text-8xl mb-6">🏢</div>
                <h3 className="text-3xl font-black text-white mb-4">No companies yet</h3>
                <p className="text-slate-400 text-xl">Create your first company to get started!</p>
              </div>
            )}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 scale-in">
            <div className="p-8 border-b border-white/10">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black flex items-center gap-3">
                  <span className="text-purple-400 text-3xl">🏢</span>
                  {editingCompany ? 'Edit Company' : 'Create New Company'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white text-4xl transition-all"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-3">Company Name</label>
                  <input
                    type="text" value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="glass-input w-full px-6 py-4 rounded-2xl text-white placeholder-slate-400 text-xl"
                    placeholder="Enter company name..." required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-3">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="glass-input w-full px-6 py-4 rounded-2xl text-white placeholder-slate-400 text-lg"
                    rows={3} placeholder="Enter company address..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-3">GST Number</label>
                    <input
                      type="text" value={formData.gst_number}
                      onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                      className="glass-input w-full px-6 py-4 rounded-2xl text-white placeholder-slate-400 text-lg"
                      placeholder="GSTIN"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-3">State</label>
                    <input
                      type="text" value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="glass-input w-full px-6 py-4 rounded-2xl text-white placeholder-slate-400 text-lg"
                      placeholder="State"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-3">Financial Year Start</label>
                    <input
                      type="date" value={formData.financial_year_start}
                      onChange={(e) => setFormData({ ...formData, financial_year_start: e.target.value })}
                      className="glass-input w-full px-6 py-4 rounded-2xl text-white placeholder-slate-400 text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-200 mb-3">Financial Year End</label>
                    <input
                      type="date" value={formData.financial_year_end}
                      onChange={(e) => setFormData({ ...formData, financial_year_end: e.target.value })}
                      className="glass-input w-full px-6 py-4 rounded-2xl text-white placeholder-slate-400 text-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-3">Contact Info</label>
                  <input
                    type="text" value={formData.contact_info}
                    onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                    className="glass-input w-full px-6 py-4 rounded-2xl text-white placeholder-slate-400 text-lg"
                    placeholder="Phone, email, etc."
                  />
                </div>
                
                <div className="flex gap-4 pt-5">
                  <button
                    type="submit"
                    className="btn-primary flex-1 px-8 py-4 rounded-2xl font-bold text-xl"
                  >
                    {editingCompany ? '✓ Update Company' : '✓ Create Company'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary px-8 py-4 rounded-2xl font-bold text-xl border border-white/20"
                  >
                    Cancel
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
