
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { AuthResponse, Company } from '@/lib/api';

interface AppContextType {
  user: AuthResponse | null;
  setUser: (user: AuthResponse | null) => void;
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedCompany = localStorage.getItem('selectedCompany');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedCompany) {
      setSelectedCompany(JSON.parse(savedCompany));
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', user.token);
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }, [user]);

  useEffect(() => {
    if (selectedCompany) {
      localStorage.setItem('selectedCompany', JSON.stringify(selectedCompany));
    } else {
      localStorage.removeItem('selectedCompany');
    }
  }, [selectedCompany]);

  const logout = () => {
    setUser(null);
    setSelectedCompany(null);
    localStorage.clear();
  };

  return (
    <AppContext.Provider value={{ user, setUser, selectedCompany, setSelectedCompany, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
