'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './providers';
import api from '@/lib/api';

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useApp();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let user;
      if (isLogin) {
        user = await api.login({ email, password });
      } else {
        user = await api.register({ email, password, name });
      }
      
      // Explicitly set localStorage to prevent race condition before navigation
      if (user && user.token) {
        localStorage.setItem('token', user.token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      setUser(user);
      router.push('/companies');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--erp-bg)' }}>
      {/* Left Branding Panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center items-center p-12 text-center" style={{ backgroundColor: 'var(--erp-sidebar)', color: 'white' }}>
        <h1 className="text-5xl font-bold mb-6 tracking-tight">SmartERP</h1>
        <p className="text-xl opacity-80 max-w-md font-light">
          Professional Ledger & Financial Management System
        </p>
        <div className="mt-12 opacity-50 text-sm">
          Enterprise Resource Planning • Accounting • Inventory
        </div>
      </div>
      
      {/* Right Login Panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12">
        <div className="w-full max-w-md bg-white p-8 rounded shadow-sm border" style={{ borderColor: 'var(--erp-border)' }}>
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--erp-teal)' }}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-sm" style={{ color: 'var(--erp-text-muted)' }}>
              {isLogin ? 'Sign in to continue to SmartERP' : 'Register a new account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--erp-text-muted)' }}>Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full border rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-700"
                  style={{ borderColor: 'var(--erp-border)' }}
                  required 
                  placeholder="John Doe"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--erp-text-muted)' }}>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="w-full border rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-700"
                style={{ borderColor: 'var(--erp-border)' }}
                required 
                placeholder="admin@smarterp.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--erp-text-muted)' }}>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full border rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-700"
                style={{ borderColor: 'var(--erp-border)' }}
                required 
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm p-3 rounded font-medium" style={{ backgroundColor: '#FEE2E2', color: 'var(--erp-danger)' }}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2.5 px-4 rounded font-medium text-black transition-colors flex justify-center items-center mt-2"
              style={{ backgroundColor: loading ? 'var(--erp-sidebar-hover)' : 'var(--erp-teal)' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (isLogin ? 'Sign In' : 'Register')}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm hover:underline"
              style={{ color: 'var(--erp-teal)' }}
            >
              {isLogin ? 'Need an account? Register' : 'Already have an account? Sign In'}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t text-center text-xs" style={{ borderColor: 'var(--erp-border)', color: 'var(--erp-text-muted)' }}>
            &copy; {new Date().getFullYear()} SmartERP Systems. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
