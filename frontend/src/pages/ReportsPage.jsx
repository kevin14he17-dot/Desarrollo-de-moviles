import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Calendar, TrendingUp, Package, CreditCard, BarChart3 } from 'lucide-react';
import { reportsService } from '../services/api';

const COLORS = ['#6366f1','#06b6d4','#f59e0b','#f43f5e','#10b981','#a855f7'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'rgba(15,23,42,0.95)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:12, padding:'10px 14px' }}>
      <p style={{ color:'#94a3b8', fontSize:12, marginBottom:4 }}>{label}</p>
      {payload.map((p,i) => <p key={i} style={{ color:p.color, fontSize:13, fontWeight:600 }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</p>)}
    </div>
  );
};

export default function ReportsPage() {
  const [salesData, setSalesData]           = useState([]);
  const [productsData, setProductsData]     = useState([]);
  const [paymentData, setPaymentData]       = useState([]);
  const [dailyReport, setDailyReport]       = useState(null);
  const [dateRange, setDateRange]           = useState('week');
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      const days = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 365;
      try {
        const [ventasRes, prodRes, pagosRes, resumenRes] = await Promise.all([
          reportsService.getSalesReport(days), reportsService.getTopProducts(10),
          reportsService.getPaymentMethodsAnalysis(), reportsService.getExecutiveSummary()
        ]);
        const ventas = ventasRes.data.data || [];
        if (ventas.length > 0)
          setSalesData(ventas.map(i => ({ fecha: i.fechaVenta ? new Date(i.fechaVenta).toLocaleDateString('es-PE',{month:'short',day:'numeric'}) : '', total: parseFloat(i.total||0), cantidad: 1 })));
        const prods = prodRes.data.data || [];
        if (prods.length > 0)
          setProductsData(prods.map(i => ({ name: (i.productName||i.ProductName||'').substring(0,15), cantidad: i.totalVendido||0, monto: parseFloat(i.montoTotal||0) })));
        const pagosObj = pagosRes.data.data || pagosRes.data || {};
        const pagosArr = Array.isArray(pagosObj) ? pagosObj : Object.values(pagosObj);
        if (pagosArr.length > 0)
          setPaymentData(pagosArr.map(i => ({ name: i.metodoPago||i.MetodoPago||'', value: parseFloat(i.montoTotal||i.Monto||0), percentage: 0 })));
        if (resumenRes.data.data) setDailyReport(resumenRes.data.data);
        else if (resumenRes.data) setDailyReport(resumenRes.data);
      } catch (err) { setError('Error al cargar reportes: ' + err.message); }
      finally { setLoading(false); }
    })();
  }, [dateRange]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm animate-pulse">Cargando reportes...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-purple-400" />Reportes de Venta
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Analisis y estadisticas del negocio</p>
        </div>
        <div className="flex gap-2 p-1 rounded-xl" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
          {['week','month','year'].map(r => (
            <button key={r} onClick={() => setDateRange(r)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={dateRange === r ? { background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', boxShadow:'0 4px 12px rgba(99,102,241,0.3)' } : { color:'#94a3b8' }}>
              {r === 'week' ? 'Semana' : r === 'month' ? 'Mes' : 'Ano'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-xl px-4 py-3 text-sm" style={{ background:'rgba(244,63,94,0.1)', border:'1px solid rgba(244,63,94,0.2)', color:'#fda4af' }}>{error}</div>}

      {/* KPIs */}
      {dailyReport && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label:'Total Ventas',      value:'S/. ' + parseFloat(dailyReport.TotalVentas||0).toFixed(2), icon: TrendingUp, grad:'#6366f1, #8b5cf6' },
            { label:'Transacciones',     value: dailyReport.CantidadTransacciones||0,                       icon: CreditCard, grad:'#06b6d4, #4f46e5' },
            { label:'Ticket Promedio',   value:'S/. ' + parseFloat(dailyReport.TicketPromedio||0).toFixed(2),icon: Calendar,   grad:'#f59e0b, #d97706' },
            { label:'Productos Vendidos',value: dailyReport.ProductosVendidos||0,                           icon: Package,    grad:'#10b981, #059669' },
          ].map(kpi => (
            <div key={kpi.label} className="glass-card rounded-2xl p-5 hover-lift">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-xs uppercase tracking-wider">{kpi.label}</p>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,' + kpi.grad + ')' }}>
                  <kpi.icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-xl font-bold text-white">{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Ventas por dia */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4 text-sm">Ventas por Dia</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="fecha" tick={{ fill:'#94a3b8', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#94a3b8', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" name="Total S/." stroke="#6366f1" strokeWidth={2} fill="url(#gTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Metodos de pago */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4 text-sm">Metodos de Pago</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={paymentData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span style={{ color:'#94a3b8', fontSize:12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Productos */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-semibold text-white mb-4 text-sm">Top Productos Vendidos</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={productsData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" tick={{ fill:'#94a3b8', fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill:'#94a3b8', fontSize:11 }} axisLine={false} tickLine={false} width={90} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cantidad" name="Unidades" fill="url(#barGrad)" radius={[0,6,6,0]}>
              {productsData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}