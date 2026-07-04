
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { AuthResponse, Company } from '@/lib/api';
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts';

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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedCompany = localStorage.getItem('selectedCompany');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
    if (savedCompany) {
      try {
        setSelectedCompany(JSON.parse(savedCompany));
      } catch (e) {
        console.error('Failed to parse saved company', e);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', user.token);
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }, [user, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    if (selectedCompany) {
      localStorage.setItem('selectedCompany', JSON.stringify(selectedCompany));
    } else {
      localStorage.removeItem('selectedCompany');
    }
  }, [selectedCompany, isInitialized]);

  const logout = () => {
    setUser(null);
    setSelectedCompany(null);
    localStorage.clear();
  };

  if (!isInitialized) {
    return null; // Prevents premature rendering and redirection of children
  }

  return (
    <AppContext.Provider value={{ user, setUser, selectedCompany, setSelectedCompany, logout }}>
      <KeyboardShortcuts />
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
