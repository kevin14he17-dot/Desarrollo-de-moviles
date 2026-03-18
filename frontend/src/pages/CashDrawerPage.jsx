import { useEffect, useState } from 'react';
import { Plus, X, DollarSign, Clock, CheckCircle, AlertCircle, Wallet, History, TrendingUp, RefreshCw } from 'lucide-react';
import { cashDrawerService } from '../services/api';
import usePOSStore from '../stores/posStore';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-card w-full max-w-md p-6 animate-scale-in" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function CashDrawerPage() {
  const { cashDrawerId, setCashDrawerId } = usePOSStore();
  const [drawer, setDrawer] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openAmount, setOpenAmount] = useState('');
  const [closeNote, setCloseNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      // 1. Intentar obtener caja actual si no hay ID guardado
      let activeId = cashDrawerId;
      if (!activeId) {
        try {
          const r = await cashDrawerService.getCurrentCashDrawer();
          activeId = r.data?.data?.cashDrawerId;
          if (activeId) setCashDrawerId(activeId);
        } catch { /* sin caja abierta — normal */ }
      }

      const [drawerRes, histRes] = await Promise.all([
        activeId ? cashDrawerService.getCashSummary(activeId).catch(() => null) : Promise.resolve(null),
        cashDrawerService.getCashDrawerHistory().catch(() => ({ data: { data: [] } }))
      ]);
      setDrawer(drawerRes?.data?.data || null);
      setHistory(histRes?.data?.data || []);
    } catch {
      setError('Error cargando datos de caja');
    } finally {
      setLoading(false);
    }
  }

  async function handleOpen() {
    if (!openAmount || isNaN(openAmount)) { setError('Ingresa un monto válido'); return; }
    setSaving(true); setError('');
    try {
      const res = await cashDrawerService.openCashDrawer({ montoInicial: parseFloat(openAmount) });
      setCashDrawerId(res.data?.data?.cashDrawerId || res.data?.cashDrawerId);
      setShowOpenModal(false);
      setOpenAmount('');
      await loadData();
    } catch { setError('Error al abrir la caja'); }
    finally { setSaving(false); }
  }

  async function handleClose() {
    setSaving(true); setError('');
    try {
      const totalVentas = parseFloat(drawer?.totalVentas || 0);
      await cashDrawerService.closeCashDrawer({
        cashDrawerId,
        montoEfectivo: String(totalVentas),
        montoTarjeta: '0',
        montoQR: '0',
        observaciones: closeNote
      });
      setCashDrawerId(null);
      setDrawer(null);
      setShowCloseModal(false);
      setCloseNote('');
      await loadData();
    } catch (e) { setError(e?.response?.data?.error?.message || 'Error al cerrar la caja'); }
    finally { setSaving(false); }
  }

  const fmt = (n) => `S/ ${parseFloat(n || 0).toFixed(2)}`;

  const kpis = drawer ? [
    { label: 'Monto Inicial', value: fmt(drawer.montoInicial), icon: DollarSign, grad: 'from-indigo-500 to-violet-500' },
    { label: 'Total Ventas', value: fmt(drawer.totalVentas), icon: TrendingUp, grad: 'from-cyan-500 to-indigo-500' },
    { label: 'Total Ingresos', value: fmt(drawer.totalIngresos), icon: CheckCircle, grad: 'from-emerald-500 to-cyan-500' },
    { label: 'Balance', value: fmt((parseFloat(drawer.montoInicial) || 0) + (parseFloat(drawer.totalVentas) || 0)), icon: Wallet, grad: 'from-amber-500 to-orange-500' },
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0f1e, #0f172a, #12082b)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Cargando datos de caja...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen space-y-6" style={{ background: 'linear-gradient(135deg, #0a0f1e, #0f172a, #12082b)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
            <Wallet size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Caja</h1>
            <p className="text-slate-400 text-sm">Gestión de apertura y cierre</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="btn-ghost p-2 rounded-lg text-slate-400 hover:text-white" title="Refrescar">
            <RefreshCw size={18} />
          </button>
          {!cashDrawerId ? (
            <button onClick={() => { setShowOpenModal(true); setError(''); }} className="btn-emerald flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm">
              <Plus size={16} />Abrir Caja
            </button>
          ) : (
            <button onClick={() => { setShowCloseModal(true); setError(''); }} className="btn-rose flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm">
              <X size={16} />Cerrar Caja
            </button>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="glass-card border border-rose-500/30 p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-rose-400 shrink-0" />
          <p className="text-rose-300 text-sm">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {[{ id: 'current', icon: DollarSign, label: 'Caja Actual' }, { id: 'history', icon: History, label: 'Historial' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
            <tab.icon size={15} />{tab.label}
          </button>
        ))}
      </div>

      {/* Current Drawer Tab */}
      {activeTab === 'current' && (
        <div className="space-y-6">
          {!cashDrawerId ? (
            <div className="glass-card p-12 text-center">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 mb-4">
                <Wallet size={40} className="text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Caja Cerrada</h3>
              <p className="text-slate-400 text-sm mb-6">Abre la caja para comenzar a operar y registrar ventas.</p>
              <button onClick={() => { setShowOpenModal(true); setError(''); }} className="btn-emerald flex items-center gap-2 px-6 py-3 rounded-xl font-medium mx-auto">
                <Plus size={16} />Abrir Caja Ahora
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-sm font-medium">Caja Abierta</span>
                {drawer?.fechaApertura && (
                  <span className="text-slate-400 text-xs ml-2 flex items-center gap-1">
                    <Clock size={12} />{new Date(drawer.fechaApertura).toLocaleString('es-PE')}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(k => (
                  <div key={k.label} className="glass-card p-5 hover:scale-[1.02] transition-transform duration-200">
                    <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${k.grad} shadow-lg mb-3`}>
                      <k.icon size={18} className="text-white" />
                    </div>
                    <p className="text-slate-400 text-xs mb-1">{k.label}</p>
                    <p className="text-white text-xl font-bold">{k.value}</p>
                  </div>
                ))}
              </div>
              {drawer?.transactions?.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-indigo-400" />Últimas transacciones
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="table-dark w-full">
                      <thead><tr><th>Hora</th><th>Tipo</th><th>Monto</th><th>Nota</th></tr></thead>
                      <tbody>
                        {(drawer.transactions || []).slice(0, 10).map((t, i) => (
                          <tr key={i}>
                            <td className="text-slate-400">{t.createdAt ? new Date(t.createdAt).toLocaleTimeString('es-PE') : '—'}</td>
                            <td><span className={`badge-${t.type === 'SALE' ? 'cyan' : t.type === 'EXPENSE' ? 'rose' : 'violet'}`}>{t.type}</span></td>
                            <td className={t.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{fmt(t.amount)}</td>
                            <td className="text-slate-400 text-xs">{t.note || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="glass-card p-0 overflow-hidden">
          {history.length === 0 ? (
            <div className="p-12 text-center">
              <History size={40} className="text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No hay historial de cajas disponible.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-dark w-full">
                <thead>
                  <tr><th>Apertura</th><th>Cierre</th><th>Inicial</th><th>Ventas</th><th>Balance</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td className="text-slate-300">{h.fechaApertura ? new Date(h.fechaApertura).toLocaleString('es-PE') : '—'}</td>
                      <td className="text-slate-400">{h.fechaCierre ? new Date(h.fechaCierre).toLocaleString('es-PE') : '—'}</td>
                      <td className="text-cyan-400">{fmt(h.montoInicial)}</td>
                      <td className="text-emerald-400">{fmt(h.montoCierre)}</td>
                      <td className="text-white font-semibold">{fmt((parseFloat(h.montoInicial)||0) + (parseFloat(h.montoCierre)||0))}</td>
                      <td>
                        {h.fechaCierre
                          ? <span className="badge-slate flex items-center gap-1 w-fit"><CheckCircle size={11} />Cerrada</span>
                          : <span className="badge-emerald flex items-center gap-1 w-fit"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Abierta</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Abrir */}
      {showOpenModal && (
        <Modal title="Abrir Caja" onClose={() => setShowOpenModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Monto Inicial (S/)</label>
              <input type="number" className="input-glass w-full" placeholder="0.00" min="0" step="0.10"
                value={openAmount} onChange={e => setOpenAmount(e.target.value)} autoFocus />
            </div>
            {error && <p className="text-rose-400 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowOpenModal(false)} className="btn-ghost flex-1 py-2.5 rounded-xl text-sm font-medium">Cancelar</button>
              <button onClick={handleOpen} disabled={saving} className="btn-emerald flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Plus size={16} />}
                Abrir
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Cerrar */}
      {showCloseModal && (
        <Modal title="Cerrar Caja" onClose={() => setShowCloseModal(false)}>
          <div className="space-y-4">
            {drawer && (
              <div className="glass p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-400">Monto Inicial</span><span className="text-white">{fmt(drawer.montoInicial)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Total Ventas</span><span className="text-emerald-400">{fmt(drawer.totalVentas)}</span></div>
                <div className="flex justify-between text-sm font-semibold border-t border-white/10 pt-2"><span className="text-slate-300">Balance Final</span><span className="text-cyan-400">{fmt((parseFloat(drawer.montoInicial) || 0) + (parseFloat(drawer.totalVentas) || 0))}</span></div>
              </div>
            )}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Notas (opcional)</label>
              <textarea className="input-glass w-full resize-none" rows={3} placeholder="Observaciones del cierre..."
                value={closeNote} onChange={e => setCloseNote(e.target.value)} />
            </div>
            {error && <p className="text-rose-400 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowCloseModal(false)} className="btn-ghost flex-1 py-2.5 rounded-xl text-sm font-medium">Cancelar</button>
              <button onClick={handleClose} disabled={saving} className="btn-rose flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <X size={16} />}
                Cerrar Caja
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
