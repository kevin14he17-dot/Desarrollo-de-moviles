import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Package, ShoppingCart, DollarSign, AlertTriangle, ArrowRight, Zap, Activity } from 'lucide-react';
import { reportsService, inventoryService } from '../services/api';

const KpiCard = ({ title, value, icon: Icon, grad, delay = 0 }) => (
  <div
    className="glass-card rounded-2xl p-5 hover-lift cursor-default"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-start justify-between mb-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${grad})`, boxShadow: `0 4px 15px rgba(0,0,0,0.3)` }}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <Activity className="w-4 h-4 text-slate-600" />
    </div>
    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true); setError('');
      try {
        const [summaryRes, alertsRes] = await Promise.all([
          reportsService.getExecutiveSummary(),
          inventoryService.getStockCritico(),
        ]);
        setStats(summaryRes.data.data);
        setAlerts(alertsRes.data.data.slice(0, 5));
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          <p className="text-slate-400 text-sm animate-pulse">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-up">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <Zap className="w-7 h-7 text-indigo-400" />
            Dashboard
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Bienvenido al sistema de minimarket</p>
        </div>
        <div
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-emerald-400"
          style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)' }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Sistema en línea
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background:'rgba(244,63,94,0.1)', border:'1px solid rgba(244,63,94,0.2)', color:'#fda4af' }}>
          {error}
        </div>
      )}

      {/* ── KPIs ── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard title="Total Ventas"    value={`S/. ${(stats.totalVentasMoneda ?? stats.totalRevenue ?? 0).toFixed(2)}`} icon={ShoppingCart}  grad="#6366f1, #8b5cf6" delay={0}   />
          <KpiCard title="Transacciones"   value={stats.totalVentas ?? stats.totalSales ?? 0}              icon={TrendingUp}    grad="#06b6d4, #4f46e5" delay={50}  />
          <KpiCard title="Productos"       value={stats.totalProductos ?? 0}                              icon={Package}       grad="#f59e0b, #d97706" delay={100} />
          <KpiCard title="Ticket Promedio" value={`S/. ${(stats.ticketPromedio ?? 0).toFixed(2)}`}        icon={DollarSign}    grad="#10b981, #059669" delay={150} />
          <KpiCard title="Stock Crítico"   value={stats.productosCriticos ?? 0}                          icon={AlertTriangle} grad="#f43f5e, #e11d48" delay={200} />
        </div>
      )}

      {/* ── Alertas + Acciones ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Alertas */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Alertas de Stock
            </h2>
            <span className="badge-gold text-xs px-2.5 py-1 rounded-full">{alerts.length} items</span>
          </div>
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((a, i) => (
                <div
                  key={a.ProductID}
                  className="flex items-center justify-between p-3 rounded-xl transition-all-200 hover:bg-white/5"
                  style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.15)', animationDelay:`${i*60}ms` }}
                >
                  <div>
                    <p className="font-medium text-white text-sm">{a.ProductName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Stock: {a.StockActual} — Mínimo: {a.StockMinimo}</p>
                  </div>
                  <span className="badge-rose text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap">
                    -{a.FaltanUnidades} unid.
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center" style={{ background:'rgba(16,185,129,0.1)' }}>
                <Package className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-slate-400 font-medium">¡Stock al día!</p>
              <p className="text-slate-400 text-sm mt-1">No hay alertas de inventario</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-5">Acciones Rápidas</h2>
          <div className="space-y-3">
            {[
              { label:'Abrir Caja',    href:'/cash-drawer', grad:'#10b981, #059669' },
              { label:'Nueva Venta',   href:'/pos',         grad:'#06b6d4, #4f46e5' },
              { label:'Ver Inventario',href:'/inventory',   grad:'#f59e0b, #d97706' },
              { label:'Reportes',      href:'/reports',     grad:'#a855f7, #7c3aed' },
            ].map(btn => (
              <button
                key={btn.label}
                onClick={() => navigate(btn.href)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02] group"
                style={{ background:`linear-gradient(135deg, ${btn.grad})`, boxShadow:'0 4px 12px rgba(0,0,0,0.3)' }}
              >
                {btn.label}
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}