'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import {
  Brain,
  LayoutDashboard,
  Monitor,
  BarChart3,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard#monitor', label: 'Monitor', icon: Monitor },
  { href: '/dashboard#analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const logout = useAppStore((s) => s.logout);
  const user = useAppStore((s) => s.user);
  const wsConnected = useAppStore((s) => s.wsConnected);
  const stressScore = useAppStore((s) => s.stressScore);
  const isMonitoring = useAppStore((s) => s.isMonitoring);

  return (
    <aside className="w-60 h-screen flex flex-col border-r border-white/5 bg-[#06080f] sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-bold font-heading gradient-text">NeuroBalance</span>
        </Link>
      </div>

      {/* Status */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className={`flex items-center gap-2 text-xs ${wsConnected ? 'text-green-400' : 'text-white/30'}`}>
          <div className="relative">
            <div className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-white/20'}`} />
            {wsConnected && (
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 absolute inset-0 status-ping" />
            )}
          </div>
          {wsConnected ? 'Connected' : 'Offline'}
          {isMonitoring && (
            <span className="ml-auto text-primary text-[10px] font-medium">LIVE</span>
          )}
        </div>
        {isMonitoring && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${stressScore}%`,
                  background: stressScore < 35 ? '#22c55e' : stressScore < 65 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
            <span className="text-[10px] text-white/30">{Math.round(stressScore)}</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href.startsWith('/dashboard') && pathname === '/dashboard');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                active
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-white/40 group-hover:text-white'}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-white/5">
        {user && (
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">
                {(user.name || user.email)[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user.name || 'User'}</p>
              <p className="text-[10px] text-white/30 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
