import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BedDouble, BarChart3, ClipboardList, KeyRound, LayoutGrid, ListChecks, LogOut, Menu, Users, Wrench, X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { departmentLabel } from '../utils/statusHelpers';
import NotificationBell from '../components/dashboard/NotificationBell';
import ChangePasswordDialog from '../components/common/ChangePasswordDialog';

const NAV = {
  FRONT_DESK: [
    { to: '/frontdesk', label: 'Overview', icon: LayoutGrid, end: true },
    { to: '/frontdesk/rooms', label: 'Rooms', icon: BedDouble },
    { to: '/frontdesk/tickets', label: 'Turnover tickets', icon: ClipboardList },
    { to: '/frontdesk/repairs', label: 'Repairs', icon: Wrench },
    { to: '/frontdesk/users', label: 'Users', icon: Users },
    { to: '/frontdesk/checklists', label: 'Checklists', icon: ListChecks },
    { to: '/frontdesk/reports', label: 'Reports', icon: BarChart3 },
  ],
  HOUSEKEEPING: [{ to: '/housekeeping', label: 'My rooms', icon: BedDouble }],
  ENGINEERING: [{ to: '/engineering', label: 'Repair board', icon: Wrench }],
};

function NavItems({ items, onNavigate }) {
  return (
    <ul className="space-y-0.5">
      {items.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink to={to} end={end} onClick={onNavigate}
            className={({ isActive }) => `flex items-center gap-2.5 rounded-md border-l-2 px-3 py-2 text-sm ${isActive
              ? 'border-brass bg-white/10 font-semibold text-white'
              : 'border-transparent text-harbor-100 hover:bg-white/5 hover:text-white'}`}>
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const location = useLocation();
  const items = NAV[user?.department] || [];
  const mustChange = !!user?.must_change_password;

  const brand = (
    <Link to="/" className="flex items-center gap-2 px-3 text-white">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-white/10 text-sm font-bold">H</span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold">Room Turnover</span>
        <span className="block text-2xs text-harbor-100">{departmentLabel(user?.department)}</span>
      </span>
    </Link>
  );

  return (
    <div className="min-h-screen lg:pl-[var(--sidebar-width)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
      <aside className="fixed inset-y-0 left-0 hidden w-[var(--sidebar-width)] flex-col bg-harbor-700 py-4 lg:flex" aria-label="Main navigation">
        {brand}
        <nav className="mt-6 flex-1 px-2"><NavItems items={items} /></nav>
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-harbor-900/50" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-harbor-700 py-4">
            <div className="flex items-center justify-between pr-3">
              {brand}
              <button type="button" onClick={() => setMenuOpen(false)} className="text-white" aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            <nav className="mt-6 px-2"><NavItems items={items} onNavigate={() => setMenuOpen(false)} /></nav>
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-mist bg-white/95 px-4 backdrop-blur sm:px-6">
        <button type="button" className="text-harbor-700 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex-1" />
        <NotificationBell key={location.pathname.split('/')[1]} />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight">{user?.display_name}</p>
          <p className="text-2xs text-gray-500">{user?.user_id} | {departmentLabel(user?.department)}</p>
        </div>
        <button type="button" onClick={() => setPwOpen(true)} className="rounded p-2 text-gray-600 hover:bg-gray-100" aria-label="Change password" title="Change password">
          <KeyRound className="h-4 w-4" />
        </button>
        <button type="button" onClick={logout} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
          <LogOut className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">Sign out</span>
        </button>
      </header>

      <main id="main" className="mx-auto max-w-[96rem] px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <ChangePasswordDialog open={pwOpen || mustChange} forced={mustChange} onClose={() => setPwOpen(false)} />
    </div>
  );
}
