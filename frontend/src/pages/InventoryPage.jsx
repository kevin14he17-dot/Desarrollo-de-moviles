import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, AlertTriangle, Package, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { inventoryService } from '../services/api';

export default function InventoryPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await inventoryService.getInventory(page, 50, { searchTerm });
        setProducts(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } catch {
        setError('Error al cargar inventario');
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [page, searchTerm]);

  const getStatus = (actual, minimo) => {
    if (actual === 0) return 'badge-rose';
    if (actual <= minimo) return 'badge-gold';
    return 'badge-emerald';
  };

  const getStatusLabel = (actual, minimo) => {
    if (actual === 0) return 'AGOTADO';
    if (actual <= minimo) return 'CRITICO';
    return 'NORMAL';
  };

  return (
    <div className="p-6 min-h-screen space-y-6" style={{ background: 'linear-gradient(135deg, #0a0f1e, #0f172a, #12082b)' }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
            <Layers size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Stock</h1>
            <p className="text-slate-400 text-sm">Niveles de inventario — para editar productos ve a Catálogo</p>
          </div>
        </div>
        <button onClick={() => navigate('/products')} className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm">
          <Plus size={16} />Nuevo Producto
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          className="input-glass w-full pl-11 py-3 rounded-xl text-sm"
          placeholder="Buscar por nombre o codigo de barras..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card border border-rose-500/30 p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-rose-400 shrink-0" />
          <p className="text-rose-300 text-sm">{error}</p>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
        </div>
      ) : (
        <>
          <div className="glass-card p-0 overflow-hidden">
            {products.length === 0 ? (
              <div className="p-12 text-center">
                <Package size={40} className="text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No hay productos en el inventario</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-dark w-full">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Codigo</th>
                      <th className="text-center">Stock</th>
                      <th className="text-center">Estado</th>
                      <th className="text-right">Precio</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => {
                      const pid2 = product.productId || product.ProductID;
                      const nm = product.productName || product.ProductName || '';
                      const cat = product.categoryName || product.CategoryName || '';
                      const bc2 = product.barcode || product.Barcode || '';
                      const sa = product.stockActual ?? product.StockActual ?? 0;
                      const sm = product.stockMinimo ?? product.StockMinimo ?? 0;
                      const sp = parseFloat(product.sellingPrice || product.SellingPrice || 0);
                      const cp = parseFloat(product.costPrice || product.CostPrice || 0);
                      return (
                      <tr key={pid2}>
                        <td>
                          <p className="font-semibold text-white">{nm}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{cat}</p>
                        </td>
                        <td className="font-mono text-slate-300 text-sm">{bc2}</td>
                        <td className="text-center">
                          <p className="font-bold text-white">{sa}</p>
                          <p className="text-xs text-slate-400">Min: {sm}</p>
                        </td>
                        <td className="text-center">
                          <span className={getStatus(sa, sm) + ' flex items-center gap-1 w-fit mx-auto'}>
                            {sa === 0 && <AlertTriangle size={10} />}
                            {getStatusLabel(sa, sm)}
                          </span>
                        </td>
                        <td className="text-right">
                          <p className="font-semibold text-cyan-400">S/ {sp.toFixed(2)}</p>
                          <p className="text-xs text-slate-400">Costo: S/ {cp.toFixed(2)}</p>
                        </td>
                        <td className="text-center">
                          <button onClick={() => navigate('/products')} className="btn-ghost p-2 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors" title="Editar en Productos">
                            <Edit2 size={15} />
                          </button>
                        </td>
                      </tr>);
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Paginacion */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Pagina {page} de {totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn-ghost p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="btn-ghost p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
