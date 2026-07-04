'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '../app/providers';
import { 
  Home, FileText, BookOpen, Users, Factory, Package, 
  FolderTree, Ruler, Receipt, ClipboardList, RefreshCw, 
  Building2, TrendingUp, Settings, Database 
} from 'lucide-react';

const navGroups = [
  {
    label: null,
    items: [
      { name: 'Gateway of ERP', icon: Home, path: '/dashboard' },
    ]
  },
  {
    label: 'Masters',
    items: [
      { name: 'Ledgers', icon: BookOpen, path: '/ledgers' },
      { name: 'Customers', icon: Users, path: '/customers' },
      { name: 'Suppliers', icon: Factory, path: '/suppliers' },
      { name: 'Inventory', icon: Package, path: '/stock-items' },
      { name: 'Stock Groups', icon: FolderTree, path: '/stock-groups' },
      { name: 'Units', icon: Ruler, path: '/units' },
    ]
  },
  {
    label: 'Transactions',
    items: [
      { name: 'Vouchers', icon: FileText, path: '/vouchers' },
      { name: 'Invoices', icon: Receipt, path: '/invoices' },
      { name: 'Inventory Tx', icon: RefreshCw, path: '/inventory-transactions' },
    ]
  },
  {
    label: 'Reports',
    items: [
      { name: 'Stock Summary', icon: ClipboardList, path: '/stock-summary' },
      { name: 'GST Records', icon: Building2, path: '/gst-records' },
      { name: 'Reports', icon: TrendingUp, path: '/reports' },
    ]
  }
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useApp();

  return (
    <aside className="w-64 h-screen flex flex-col flex-shrink-0 border-r border-black/10" style={{ backgroundColor: 'var(--erp-sidebar)', color: 'white' }}>
      <div className="p-6 border-b border-white/10 flex items-center justify-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">SmartERP</h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-4">
          {navGroups.map((group, i) => (
            <li key={i}>
              {group.label && (
                <div className="px-6 py-1 text-xs font-bold uppercase tracking-wider text-white/50">
                  {group.label}
                </div>
              )}
              <ul className="space-y-0.5 mt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  return (
                    <li key={item.name}>
                      <button
                        onClick={() => router.push(item.path)}
                        className={`w-full flex items-center px-6 py-2 transition-colors ${
                          isActive ? 'bg-white/10 border-l-4 border-white' : 'hover:bg-white/5 border-l-4 border-transparent text-white/80 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-3 opacity-80" />
                        <span className="flex-1 text-left text-sm font-medium">{item.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </nav>

      {user && (
        <div className="p-4 border-t border-white/10 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user.name}</div>
              <div className="text-xs text-white/60 truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={() => router.push('/companies')}
            className="text-xs px-4 py-2 mt-2 bg-white/10 hover:bg-white/20 rounded transition-colors w-full font-medium"
          >
            Change Company
          </button>
        </div>
      )}
    </aside>
  );
}
