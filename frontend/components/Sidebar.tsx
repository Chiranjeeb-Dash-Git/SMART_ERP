
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '../app/providers';

const navItems = [
  { name: 'Dashboard', icon: '🏠', shortcut: 'D', path: '/dashboard' },
  { name: 'Vouchers', icon: '📝', shortcut: 'V', path: '/vouchers' },
  { name: 'Ledgers', icon: '📊', shortcut: 'L', path: '/ledgers' },
  { name: 'Customers', icon: '👥', shortcut: 'C', path: '/customers' },
  { name: 'Suppliers', icon: '🏭', shortcut: 'S', path: '/suppliers' },
  { name: 'Inventory', icon: '📦', shortcut: 'I', path: '/stock-items' },
  { name: 'Stock Groups', icon: '📂', shortcut: 'G', path: '/stock-groups' },
  { name: 'Units', icon: '📏', shortcut: 'U', path: '/units' },
  { name: 'Invoices', icon: '🧾', shortcut: 'F', path: '/invoices' },
  { name: 'Stock Summary', icon: '📋', shortcut: 'K', path: '/stock-summary' },
  { name: 'Inventory Transactions', icon: '🔄', shortcut: 'T', path: '/inventory-transactions' },
  { name: 'GST', icon: '🏛️', shortcut: 'G', path: '/gst-records' },
  { name: 'Reports', icon: '📈', shortcut: 'R', path: '/reports' },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useApp();

  return (
    <aside className="sidebar slide-in-left flex flex-col">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-2xl pulse-glow border border-white/30">
            SE
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">SmartERP</h1>
            <p className="text-xs text-slate-400">Complete Suite</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item, index) => (
          <button
            key={item.name}
            onClick={() => router.push(item.path)}
            className={`sidebar-item w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${
              pathname === item.path ? 'active' : ''
            }`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="flex-1 text-left font-semibold text-lg text-slate-200">
              {item.name}
            </span>
            <span className={`text-xs px-3 py-1.5 rounded-lg font-bold border ${
              pathname === item.path ? 'bg-purple-500/30 text-purple-200 border-purple-500/30' : 'bg-white/10 text-slate-300 border-white/10'
            }`}>
              {item.shortcut}
            </span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 p-5 rounded-2xl bg-gradient-to-r from-white/5 to-white/0 border border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl font-black shadow-xl">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg text-white">{user?.name || 'User'}</p>
            <p className="text-sm text-slate-400 truncate">{user?.email || ''}</p>
          </div>
          <button
            onClick={() => router.push('/companies')}
            className="p-3 hover:bg-white/10 rounded-xl transition-all text-slate-300 hover:text-white"
            title="Change Company"
          >
            🔄
          </button>
        </div>
      </div>
    </aside>
  );
}
