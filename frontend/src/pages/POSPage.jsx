import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Trash2, ShoppingBag, Eye, CreditCard, X, CheckCircle, AlertCircle } from 'lucide-react';
import usePOSStore from '../stores/posStore';
import { productService, cashDrawerService, salesService, productImageUrl } from '../services/api';
import { PaymentModal, ProductDetailsModal } from '../components/Modals';

export default function POSPage() {
  const { items, subtotal, tax, total, addItem, updateQuantity, removeItem, clearCart, setCashDrawerId, cashDrawerId } = usePOSStore();
  const [products, setProducts]           = useState([]);
  const [searchTerm, setSearchTerm]       = useState('');
  const [loading, setLoading]             = useState(true);
  const [cashOpen, setCashOpen]           = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [processing, setProcessing]       = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct]   = useState(null);
  const [toast, setToast]                       = useState(null);

  const notify = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { const r = await productService.getProducts(1, 100); setProducts(r.data.data || []); }
      catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await cashDrawerService.getCurrentCashDrawer();
        setCashOpen(true);
        setCashDrawerId(r.data.data?.cashDrawerId || r.data.data?.CashDrawerID);
      } catch (e) {
        // 404 = no hay caja abierta (comportamiento esperado)
        if (e?.response?.status !== 404) console.error('Error caja:', e);
        setCashOpen(false);
      }
    })();
  }, [setCashDrawerId]);

  const filtered = (products || []).filter(p => (p.productName||'').toLowerCase().includes(searchTerm.toLowerCase()) || (p.barcode||'').includes(searchTerm));

  const handleSale = async (finalAmount) => {
    if (!cashOpen || !cashDrawerId) { notify('Debe abrir caja primero', 'error'); return; }
    if (items.length === 0) { notify('El carrito está vacío', 'error'); return; }
    setProcessing(true);
    try {
      await salesService.createSale({ cashDrawerId, items: items.map(i => ({ productId: i.productId || i.ProductID, cantidad: i.cantidad, precioUnitario: i.precioUnitario })), subtotal, tax, total, paidAmount: finalAmount, change: finalAmount - total, paymentMethods: [{ metodo: paymentMethod, monto: total, referencia: null }] });
      setShowPaymentModal(false); clearCart(); setPaymentMethod('EFECTIVO');
      notify('¡Venta registrada exitosamente!', 'success');
    } catch (e) { notify(e.response?.data?.error?.message || 'Error al registrar venta', 'error'); } finally { setProcessing(false); }
  };

  if (!cashOpen) return (
    <div className='flex items-center justify-center h-full p-8'>
      <div className='glass-card rounded-2xl p-8 text-center max-w-sm'>
        <div className='w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4' style={{ background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)' }}>
          <CreditCard className='w-8 h-8 text-amber-400' />
        </div>
        <h3 className='text-white font-bold text-lg mb-2'>Caja Cerrada</h3>
        <p className='text-slate-400 text-sm mb-5'>Debe abrir caja para comenzar a vender</p>
        <a href='/cash-drawer' className='btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm'>Ir a Caja</a>
      </div>
    </div>
  );

  return (
    <div className='flex h-full overflow-hidden'>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium animate-scale-in ${
          toast.type === 'success'
            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
            : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
        }`} style={{ backdropFilter: 'blur(12px)' }}>
          {toast.type === 'success' ? <CheckCircle size={16} className='shrink-0' /> : <AlertCircle size={16} className='shrink-0' />}
          {toast.msg}
        </div>
      )}
      {/* Productos */}
      <div className='flex-1 flex flex-col overflow-hidden p-5'>
        <h1 className='text-xl font-bold text-white flex items-center gap-2 mb-5'><ShoppingBag className='w-5 h-5 text-cyan-400' />Punto de Venta</h1>
        <div className='relative mb-5'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
          <input type='text' placeholder='Buscar por nombre o código...' value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className='input-glass w-full pl-10 pr-4 py-3 rounded-xl text-sm' />
        </div>
        {loading ? (
          <div className='flex justify-center py-16'><div className='w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin' /></div>
        ) : (
          <div className='flex-1 overflow-auto'>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'>
              {filtered.map(product => {
                const pid = product.productId || product.ProductID;
                const name = product.productName || product.ProductName || '';
                const bc = product.barcode || product.Barcode || '';
                const price = product.sellingPrice || product.SellingPrice || 0;
                const stock = product.stockActual ?? product.StockQuantity ?? 0;
                return (
                <div key={pid} className='glass-card rounded-xl p-3 flex flex-col hover:border-indigo-500/30 cursor-pointer'>
                  <div className='rounded-lg h-20 mb-2 overflow-hidden flex items-center justify-center flex-shrink-0'
                    style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.1)' }}>
                    <img
                      src={productImageUrl(pid)}
                      alt={name}
                      className='w-full h-full object-cover'
                      onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                    />
                    <span className='text-slate-400 text-xs px-2 text-center line-clamp-2' style={{display:'none'}}>{name}</span>
                  </div>
                  <p className='font-semibold text-white text-xs truncate mb-0.5'>{name}</p>
                  <p className='text-xs text-slate-400 mb-2'>{bc}</p>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='font-bold text-cyan-400 text-sm'>S/. {parseFloat(price).toFixed(2)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stock > 10 ? 'badge-emerald' : stock > 0 ? 'badge-gold' : 'badge-rose'}`}>{stock}</span>
                  </div>
                  <div className='flex gap-1.5 mt-auto'>
                    <button onClick={() => { setSelectedProduct(product); setShowProductModal(true); }} className='flex-1 btn-ghost p-1.5 rounded-lg text-xs flex items-center justify-center gap-1'><Eye className='w-3 h-3' />Ver</button>
                    <button onClick={() => addItem(product)} disabled={stock === 0} className='flex-1 btn-cyan p-1.5 rounded-lg text-xs flex items-center justify-center gap-1 disabled:opacity-40'><Plus className='w-3 h-3' />Add</button>
                  </div>
                </div>);
              })}
            </div>
          </div>
        )}
      </div>
      {/* Carrito */}
      <div className='w-80 flex flex-col flex-shrink-0 p-4 gap-4' style={{ background:'rgba(0,0,0,0.3)', borderLeft:'1px solid rgba(255,255,255,0.06)' }}>
        <h2 className='font-bold text-white'>Carrito ({items.length})</h2>
        <div className='flex-1 overflow-auto space-y-2'>
          {items.length === 0 ? (<div className='flex flex-col items-center justify-center h-32 text-center'><ShoppingBag className='w-10 h-10 text-slate-600 mb-2' /><p className='text-slate-400 text-sm'>Carrito vacío</p></div>)
          : items.map(item => {
            const iid = item.productId || item.ProductID;
            const iname = item.productName || item.ProductName || '';
            return (
            <div key={iid} className='glass-card rounded-xl p-3'>
              <div className='flex items-start justify-between mb-2'>
                <p className='text-sm font-medium text-white leading-tight flex-1 pr-2 line-clamp-2'>{iname}</p>
                <button onClick={() => removeItem(iid)} className='text-slate-400 hover:text-rose-400 transition-all-200 flex-shrink-0'><X className='w-4 h-4' /></button>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <button onClick={() => updateQuantity(iid, item.cantidad - 1)} className='w-6 h-6 rounded-lg btn-ghost flex items-center justify-center text-xs font-bold'>−</button>
                  <span className='text-white text-sm font-medium w-6 text-center'>{item.cantidad}</span>
                  <button onClick={() => updateQuantity(iid, item.cantidad + 1)} className='w-6 h-6 rounded-lg btn-ghost flex items-center justify-center text-xs font-bold'>+</button>
                </div>
                <span className='font-bold text-cyan-400 text-sm'>S/. {(item.precioUnitario * item.cantidad).toFixed(2)}</span>
              </div>
            </div>);
          })}
        </div>
        <div className='glass-card rounded-xl p-4 space-y-2'>
          <div className='flex justify-between text-slate-400 text-sm'><span>Subtotal</span><span>S/. {subtotal.toFixed(2)}</span></div>
          <div className='flex justify-between text-slate-400 text-sm'><span>IGV (18%)</span><span>S/. {tax.toFixed(2)}</span></div>
          <div className='border-t border-white/10 pt-2 flex justify-between font-bold text-white'><span>Total</span><span className='text-xl gradient-text'>S/. {total.toFixed(2)}</span></div>
        </div>
        <div className='space-y-2'>
          <p className='text-slate-400 text-xs font-medium uppercase tracking-wider'>Método de Pago</p>
          <div className='grid grid-cols-2 gap-2'>
            {['EFECTIVO','TARJETA','YAPE','PLIN'].map(m => (<button key={m} onClick={() => setPaymentMethod(m)} className={`py-2 px-3 rounded-xl text-xs font-medium transition-all-200 ${paymentMethod === m ? 'text-white' : 'text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white'}`} style={paymentMethod === m ? { background:'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow:'0 4px 12px rgba(99,102,241,0.3)' } : {}}>{m}</button>))}
          </div>
        </div>
        <div className='space-y-2'>
          <button onClick={() => setShowPaymentModal(true)} disabled={items.length === 0 || processing} className='btn-primary w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2'><CreditCard className='w-4 h-4' />{processing ? 'Procesando...' : 'Cobrar'}</button>
          <button onClick={clearCart} disabled={items.length === 0} className='btn-ghost w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 text-slate-400 disabled:opacity-30'><Trash2 className='w-4 h-4' />Limpiar</button>
        </div>
      </div>
      {showPaymentModal && <PaymentModal total={total} paymentMethod={paymentMethod} onConfirm={handleSale} onClose={() => setShowPaymentModal(false)} />}
      {showProductModal && selectedProduct && <ProductDetailsModal product={selectedProduct} onClose={() => setShowProductModal(false)} onAdd={addItem} />}
    </div>
  );
}
