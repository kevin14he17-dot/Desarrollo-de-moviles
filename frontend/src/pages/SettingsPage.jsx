import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Upload, Trash2, CheckCircle, AlertCircle, QrCode, CreditCard, Smartphone } from 'lucide-react';
import { settingsService } from '../services/api';

const TIPOS = [
  { key: 'yape',    label: 'YAPE',    icon: Smartphone, color: 'from-violet-500 to-purple-600', hint: 'QR de cobro de YAPE' },
  { key: 'plin',    label: 'PLIN',    icon: Smartphone, color: 'from-emerald-500 to-teal-600',  hint: 'QR de cobro de PLIN' },
  { key: 'tarjeta', label: 'Tarjeta', icon: CreditCard,  color: 'from-blue-500 to-indigo-600',   hint: 'Logo/imagen de POS de tarjeta' },
];

export default function SettingsPage() {
  const [qrUrls, setQrUrls]   = useState({ yape: null, plin: null, tarjeta: null });
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState(null);
  const [uploading, setUploading] = useState({});
  const fileRefs = { yape: useRef(), plin: useRef(), tarjeta: useRef() };

  const notify = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  async function loadQR() {
    try {
      const res = await settingsService.getQRStatus();
      setQrUrls(res.data.data);
    } catch { notify('Error cargando configuración', 'error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadQR(); }, []);

  async function handleUpload(tipo, file) {
    if (!file) return;
    setUploading(u => ({ ...u, [tipo]: true }));
    try {
      const form = new FormData();
      form.append('qr', file);
      await settingsService.uploadQR(tipo, form);
      notify(`QR de ${tipo.toUpperCase()} actualizado correctamente`);
      await loadQR();
    } catch (e) {
      notify(e?.response?.data?.message || 'Error al subir la imagen', 'error');
    } finally {
      setUploading(u => ({ ...u, [tipo]: false }));
    }
  }

  async function handleDelete(tipo) {
    try {
      await settingsService.deleteQR(tipo);
      notify(`QR de ${tipo.toUpperCase()} eliminado`);
      setQrUrls(u => ({ ...u, [tipo]: null }));
    } catch { notify('Error al eliminar', 'error'); }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
    </div>
  );

  return (
    <div className="p-6 min-h-screen space-y-6" style={{ background: 'linear-gradient(135deg, #0a0f1e, #0f172a, #12082b)' }}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium animate-scale-in ${
          toast.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
        }`} style={{ backdropFilter: 'blur(12px)' }}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 shadow-lg">
          <Settings size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Configuración de Pagos</h1>
          <p className="text-slate-400 text-sm">Sube los QR que verá el cliente al pagar con YAPE, PLIN o Tarjeta</p>
        </div>
      </div>

      {/* Info */}
      <div className="glass-card p-4 flex items-start gap-3 border border-indigo-500/20">
        <QrCode size={20} className="text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-slate-300 text-sm leading-relaxed">
          Los QR se mostrarán automáticamente en el modal de cobro cuando el cajero seleccione el método de pago correspondiente. El cliente escanea el QR y el cajero confirma la recepción.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TIPOS.map(({ key, label, icon: Icon, color, hint }) => (
          <div key={key} className="glass-card p-5 space-y-4" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
                <Icon size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-white">{label}</p>
                <p className="text-slate-400 text-xs">{hint}</p>
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-xl overflow-hidden flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', minHeight: 180 }}>
              {qrUrls[key] ? (
                <img
                  src={`${qrUrls[key]}?t=${Date.now()}`}
                  alt={`QR ${label}`}
                  className="max-h-44 object-contain p-2"
                />
              ) : (
                <div className="text-center py-8">
                  <QrCode size={40} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-xs">Sin imagen</p>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex gap-2">
              <input
                ref={fileRefs[key]}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleUpload(key, e.target.files[0])}
              />
              <button
                onClick={() => fileRefs[key].current.click()}
                disabled={uploading[key]}
                className="btn-primary flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
              >
                {uploading[key]
                  ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  : <Upload size={15} />}
                {qrUrls[key] ? 'Reemplazar' : 'Subir QR'}
              </button>
              {qrUrls[key] && (
                <button
                  onClick={() => handleDelete(key)}
                  className="btn-ghost p-2.5 rounded-xl text-slate-400 hover:text-rose-400 transition-colors"
                  title="Eliminar QR"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
