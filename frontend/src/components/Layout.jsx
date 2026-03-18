import { useState } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  Menu, X, LogOut, Home, Package, ShoppingCart,
  DollarSign, BarChart3, ChevronDown, Store, Bell, Zap, Settings, Layers
} from 'lucide-react';
import useAuth from '../hooks/useAuth';

export default function Layout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const menuItems = [
    { icon: Home,         label: 'Dashboard', href: '/dashboard',   roles: ['Administrador','Gerente','Cajero'], grad: '#6366f1, #8b5cf6' },
    { icon: ShoppingCart, label: 'POS',        href: '/pos',         roles: ['Cajero','Administrador'],          grad: '#06b6d4, #4f46e5' },
    { icon: DollarSign,   label: 'Caja',       href: '/cash-drawer', roles: ['Cajero','Administrador','Gerente'], grad: '#10b981, #059669' },
    { icon: Layers,       label: 'Stock',      href: '/inventory',   roles: ['Administrador','Gerente'],         grad: '#f59e0b, #d97706' },
    { icon: Package,      label: 'Catálogo',    href: '/products',    roles: ['Administrador'],                   grad: '#f43f5e, #be123c' },
    { icon: BarChart3,    label: 'Reportes',   href: '/reports',     roles: ['Administrador','Gerente'],         grad: '#a855f7, #7c3aed' },
    { icon: Settings,     label: 'Config QR',  href: '/settings',    roles: ['Administrador'],                   grad: '#64748b, #475569' },
  ];

  const userRole = user?.role_name || user?.roleName || user?.RoleName || '';
  const userFullName = user?.full_name || user?.fullName || user?.FullName || '';
  const filtered = menuItems.filter(i => i.roles.includes(userRole));
  const isActive = (href) => location.pathname === href;
  const initials = userFullName.split(' ').slice(0,2).map(n=>n[0]).join('') || 'U';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg,#0a0f1e 0%,#0f172a 60%,#12082b 100%)' }}>

      {/* ── SIDEBAR ── */}
      <aside
        className={`relative flex flex-col flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}
        style={{ background:'linear-gradient(180deg,#0d1117 0%,#131028 100%)', borderRight:'1px solid rgba(255,255,255,0.06)', boxShadow:'4px 0 24px rgba(0,0,0,0.4)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 flex-shrink-0" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          {sidebarOpen && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow:'0 0 16px rgba(99,102,241,0.5)' }}>
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm leading-tight">Minimarket</p>
                <p className="text-xs font-bold gradient-text">PRO</p>
              </div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg transition-all-200 text-slate-400 hover:text-white flex items-center justify-center flex-shrink-0"
            style={{ background:'rgba(255,255,255,0.05)' }}>
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filtered.map((item, idx) => (
            <Link key={item.label} to={item.href} title={!sidebarOpen ? item.label : undefined}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive(item.href) ? 'sidebar-link-active' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              style={{ animationDelay:`${idx*50}ms` }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                style={isActive(item.href)
                  ? { background:`linear-gradient(135deg,${item.grad})`, boxShadow:'0 4px 12px rgba(0,0,0,0.3)' }
                  : { background:'rgba(255,255,255,0.05)' }
                }>
                <item.icon className={`w-4 h-4 ${isActive(item.href) ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
              </div>
              {sidebarOpen && (
                <span className={`text-sm font-medium ${isActive(item.href) ? 'text-indigo-300' : ''}`}>{item.label}</span>
              )}
              {isActive(item.href) && sidebarOpen && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              )}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-3 flex-shrink-0" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="relative">
            <button onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all-200">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow:'0 0 10px rgba(99,102,241,0.4)' }}>
                {initials}
              </div>
              {sidebarOpen && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-white truncate">{userFullName||'Usuario'}</p>
                    <p className="text-xs text-indigo-400 truncate">{userRole||'Sin rol'}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${dropdownOpen?'rotate-180':''}`} />
                </>
              )}
            </button>
            {dropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl overflow-hidden z-50 animate-scale-in"
                style={{ background:'#1a1a2e', border:'1px solid rgba(255,255,255,0.1)', boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-500/10 transition-all-200 text-sm font-medium">
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 flex-shrink-0"
          style={{ background:'rgba(10,15,30,0.85)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-indigo-400" />
            <h1 className="text-base font-semibold text-white">Sistema Minimarket</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden md:block">
              {new Date().toLocaleDateString('es-PE',{weekday:'short',year:'numeric',month:'short',day:'numeric'})}
            </span>
            <button className="relative p-2 rounded-xl transition-all-200 text-slate-400 hover:text-white"
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full"
                style={{ background:'linear-gradient(135deg,#f43f5e,#e11d48)', boxShadow:'0 0 6px rgba(244,63,94,0.6)' }} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
