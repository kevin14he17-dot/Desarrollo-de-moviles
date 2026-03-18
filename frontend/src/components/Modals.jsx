import { useState, useEffect } from 'react';
import { X, CreditCard, Plus, Package, Tag, DollarSign, QrCode, Smartphone, CheckCircle } from 'lucide-react';
import { settingsService } from '../services/api';

export function PaymentModal({ total, paymentMethod = 'EFECTIVO', onConfirm, onClose }) {
  const [amount, setAmount]   = useState(total.toFixed(2));
  const [error, setError]     = useState('');
  const [qrUrl, setQrUrl]     = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  const isQR       = paymentMethod === 'YAPE' || paymentMethod === 'PLIN';
  const isTarjeta  = paymentMethod === 'TARJETA';
  const isEfectivo = paymentMethod === 'EFECTIVO';

  useEffect(() => {
    if (isQR) {
      setQrLoading(true);
      settingsService.getQRStatus()
        .then(r => setQrUrl(r.data.data?.[paymentMethod.toLowerCase()] || null))
        .catch(() => setQrUrl(null))
        .finally(() => setQrLoading(false));
    }
  }, [isQR, paymentMethod]);

  const handleConfirm = () => {
    if (isEfectivo) {
      const val = parseFloat(amount);
      if (isNaN(val) || val < total) {
        setError(`Monto mínimo: S/. ${total.toFixed(2)}`);
        return;
      }
      onConfirm(val);
    } else {
      onConfirm(total);
    }
  };

  const change = Math.max(0, parseFloat(amount || 0) - total);

  // Colores por método
  const methodStyle = {
    YAPE:    { grad: 'from-violet-500 to-purple-600', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)' },
    PLIN:    { grad: 'from-emerald-500 to-teal-600',  bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
    TARJETA: { grad: 'from-blue-500 to-indigo-600',   bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)' },
    EFECTIVO:{ grad: 'from-amber-500 to-orange-500',  bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  }[paymentMethod] || { grad: 'from-indigo-500 to-violet-500', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-card w-full max-w-sm p-6 animate-scale-in"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            Cobro — {paymentMethod}
          </h2>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Total */}
          <div className="rounded-xl p-4 text-center"
            style={{ background: methodStyle.bg, border: `1px solid ${methodStyle.border}` }}>
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total a Cobrar</p>
            <p className="text-3xl font-bold text-white">S/. {total.toFixed(2)}</p>
          </div>

          {/* Flujo YAPE / PLIN: mostrar QR */}
          {isQR && (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden flex flex-col items-center justify-center py-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {qrLoading ? (
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 my-6" />
                ) : qrUrl ? (
                  <>
                    <img src={qrUrl} alt={`QR ${paymentMethod}`} className="max-h-48 object-contain" />
                    <p className="text-slate-400 text-xs mt-2">Muestra este QR al cliente</p>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <QrCode size={40} className="text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">QR no configurado</p>
                    <p className="text-slate-500 text-xs mt-1">Ve a Config QR para subir el código</p>
                  </div>
                )}
              </div>
              <p className="text-slate-400 text-xs text-center flex items-center justify-center gap-1.5">
                <Smartphone size={13} />
                El cliente escanea y paga. Confirma cuando recibas el depósito.
              </p>
            </div>
          )}

          {/* Flujo TARJETA */}
          {isTarjeta && (
            <div className="rounded-xl p-4 flex flex-col items-center gap-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <CreditCard size={36} className="text-blue-400" />
              <p className="text-white text-sm font-medium">Pase la tarjeta por el POS físico</p>
              <p className="text-slate-400 text-xs text-center">Confirma una vez que el POS apruebe la transacción.</p>
            </div>
          )}

          {/* Flujo EFECTIVO */}
          {isEfectivo && (
            <>
              <div>
                <label className="text-slate-400 text-sm block mb-2">Monto Recibido</label>
                <input type="number" step="0.01" min={total} value={amount}
                  onChange={e => { setAmount(e.target.value); setError(''); }}
                  className="input-glass w-full py-3 px-4 rounded-xl text-white text-lg font-bold" autoFocus />
                {error && <p className="text-rose-400 text-xs mt-1">{error}</p>}
              </div>
              <div className="rounded-xl p-3 flex items-center justify-between"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <span className="text-slate-400 text-sm">Vuelto</span>
                <span className="text-emerald-400 font-bold text-lg">S/. {change.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[total, Math.ceil((total + 1) / 10) * 10, Math.ceil((total + 1) / 50) * 50].map((v, idx) => (
                  <button key={idx} onClick={() => { setAmount(v.toFixed(2)); setError(''); }}
                    className="btn-ghost py-2 rounded-lg text-sm text-slate-300 hover:text-white">
                    S/. {v.toFixed(2)}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Acciones */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              Cancelar
            </button>
            <button onClick={handleConfirm}
              className="flex-1 btn-primary py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {isEfectivo ? 'Confirmar' : 'Pago Recibido'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export function ProductDetailsModal({ product, onClose, onAdd }) {
  const name  = product.productName  || product.ProductName  || '';
  const bc    = product.barcode      || product.Barcode      || '';
  const price = parseFloat(product.sellingPrice || product.SellingPrice || 0);
  const cost  = parseFloat(product.costPrice    || product.CostPrice    || 0);
  const stock = product.stockActual  ?? product.StockQuantity ?? 0;
  const cat   = product.categoryName || product.CategoryName || '';
  const desc  = product.description  || product.Description  || '';
  const margin = cost > 0 ? ((price - cost) / cost * 100).toFixed(1) : '0.0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-card w-full max-w-md p-6 animate-scale-in"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            Detalle del Producto
          </h2>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}>
            <p className="text-xl font-bold text-white mb-1">{name}</p>
            <p className="text-slate-400 text-sm">{cat}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-slate-400 text-xs mb-1 flex items-center gap-1"><Tag className="w-3 h-3" />Código</p>
              <p className="text-white font-mono text-sm">{bc}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-slate-400 text-xs mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" />Precio</p>
              <p className="text-cyan-400 font-bold">S/. {price.toFixed(2)}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-slate-400 text-xs mb-1">Stock</p>
              <p className={`font-bold ${stock > 10 ? 'text-emerald-400' : stock > 0 ? 'text-amber-400' : 'text-rose-400'}`}>{stock} unid.</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-slate-400 text-xs mb-1">Margen</p>
              <p className="text-emerald-400 font-bold">{margin}%</p>
            </div>
          </div>

          {desc && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-slate-400 text-xs mb-1">Descripción</p>
              <p className="text-slate-300 text-sm">{desc}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              Cerrar
            </button>
            <button onClick={() => { onAdd(product); onClose(); }} disabled={stock === 0}
              className="flex-1 btn-cyan py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40">
              <Plus className="w-4 h-4" />
              Agregar al Carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
