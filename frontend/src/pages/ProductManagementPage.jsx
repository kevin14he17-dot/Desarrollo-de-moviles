import { useEffect, useState, useRef } from 'react';
import { Search, Plus, Edit, Trash2, X, Save, Package, ChevronLeft, ChevronRight, Tag, BarChart3, AlertTriangle, Upload, ImageIcon } from 'lucide-react';
import { productService, productImageUrl } from '../services/api';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-card w-full max-w-2xl animate-scale-in max-h-[90vh] overflow-y-auto"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function ProductManagementPage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [notification, setNotification] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const imageRef = useRef();

  const [formData, setFormData] = useState({
    productName: '', barcode: '', categoryId: 1,
    costPrice: '', sellingPrice: '', stockQuantity: '',
    description: '', isActive: true
  });

  useEffect(() => { fetchProducts(); }, [page, searchTerm]);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getProducts(page, 10, searchTerm);
      setProducts(response.data.data || []);
      setTotalPages(response.data.count ? Math.ceil(response.data.count / 10) : 1);
    } catch {
      notify('Error al cargar productos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => ({
    productName: '', barcode: '', categoryId: 1,
    costPrice: '', sellingPrice: '', stockQuantity: '',
    description: '', isActive: true
  });

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        productName: product.productName || product.ProductName, barcode: product.barcode || product.Barcode,
        categoryId: product.categoryId || product.CategoryID || 1, costPrice: product.costPrice || product.CostPrice,
        sellingPrice: product.sellingPrice || product.SellingPrice, stockQuantity: product.stockActual ?? product.StockQuantity ?? '',
        description: product.description || product.Description || '', isActive: product.isActive ?? product.IsActive ?? true
      });
      const pid = product.productId || product.ProductID;
      setImagePreview(pid ? productImageUrl(pid) : null);
    } else {
      setEditingProduct(null);
      setFormData(resetForm());
      setImagePreview(null);
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(resetForm());
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!formData.productName || !formData.barcode || !formData.costPrice || !formData.sellingPrice) {
      notify('Completa los campos requeridos', 'error'); return;
    }
    setProcessing(true);
    try {
      const payload = {
        productName: formData.productName, barcode: formData.barcode,
        categoryId: parseInt(formData.categoryId),
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        stockActual: parseInt(formData.stockQuantity) || 0,
        description: formData.description, isActive: formData.isActive
      };
      let savedId;
      if (editingProduct) {
        savedId = editingProduct.productId || editingProduct.ProductID;
        await productService.updateProduct(savedId, payload);
        notify('Producto actualizado exitosamente');
      } else {
        const res = await productService.createProduct(payload);
        savedId = res.data?.data?.productId || res.data?.productId;
        notify('Producto creado exitosamente');
      }
      // Subir imagen si se seleccionó una
      if (imageFile && savedId) {
        const form = new FormData();
        form.append('image', imageFile);
        await productService.uploadProductImage(savedId, form).catch(() => {});
      }
      handleCloseModal();
      fetchProducts();
    } catch (err) {
      notify(err.response?.data?.error?.message || 'Error al guardar producto', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('¿Estás seguro que deseas eliminar este producto?')) return;
    setProcessing(true);
    try {
      await productService.deleteProduct(productId);
      notify('Producto eliminado');
      fetchProducts();
    } catch (err) {
      notify(err.response?.data?.error?.message || 'Error al eliminar producto', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const setField = (key, val) => setFormData(f => ({ ...f, [key]: val }));

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0f1e, #0f172a, #12082b)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen space-y-6" style={{ background: 'linear-gradient(135deg, #0a0f1e, #0f172a, #12082b)' }}>

      {/* Notificación toast */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 glass-card px-5 py-3 flex items-center gap-3 animate-fade-up border ${notification.type === 'error' ? 'border-rose-500/40' : 'border-emerald-500/40'}`}>
          {notification.type === 'error'
            ? <AlertTriangle size={16} className="text-rose-400" />
            : <Package size={16} className="text-emerald-400" />}
          <span className={`text-sm font-medium ${notification.type === 'error' ? 'text-rose-300' : 'text-emerald-300'}`}>{notification.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg">
            <Package size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Catálogo de Productos</h1>
            <p className="text-slate-400 text-sm">Gestión de precios, códigos e imágenes</p>
          </div>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm">
          <Plus size={16} />Nuevo Producto
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input type="text" className="input-glass w-full pl-11" placeholder="Buscar por nombre, código de barras..."
          value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} />
      </div>

      {/* Tabla */}
      <div className="glass-card p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto" /></div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={40} className="text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">No hay productos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-dark w-full">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Código</th>
                  <th className="text-right">Costo</th>
                  <th className="text-right">Precio</th>
                  <th className="text-right">Stock</th>
                  <th className="text-center">Margen</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const cp = parseFloat(p.costPrice || p.CostPrice || 0);
                  const sp = parseFloat(p.sellingPrice || p.SellingPrice || 0);
                  const margin = cp > 0 ? ((sp - cp) / cp * 100).toFixed(1) : '0.0';
                  const stock = p.stockActual ?? p.StockQuantity ?? 0;
                  const pid3 = p.productId || p.ProductID;
                  const pname = p.productName || p.ProductName || '';
                  const pdesc = p.description || p.Description || '';
                  const pcode = p.barcode || p.Barcode || '';
                  const pactive = p.isActive ?? p.IsActive;
                  return (
                    <tr key={pid3}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)' }}>
                            <img
                              src={productImageUrl(pid3)}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                            <Package size={16} className="text-slate-500" style={{ display: 'none' }} />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{pname}</p>
                            {pdesc && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[160px]">{pdesc}</p>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono text-slate-300 flex items-center gap-1.5">
                          <Tag size={12} className="text-slate-400" />{pcode}
                        </span>
                      </td>
                      <td className="text-right text-slate-400">S/ {cp.toFixed(2)}</td>
                      <td className="text-right text-cyan-400 font-semibold">S/ {sp.toFixed(2)}</td>
                      <td className="text-right">
                        <span className={`badge-${stock > 10 ? 'emerald' : stock > 0 ? 'gold' : 'rose'} ml-auto block w-fit`}>
                          {stock}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="flex items-center justify-center gap-1 text-emerald-400 font-semibold text-sm">
                          <BarChart3 size={12} />{margin}%
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge-${pactive ? 'cyan' : 'slate'}`}>
                          {pactive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => handleOpenModal(p)}
                            className="btn-ghost p-2 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors">
                            <Edit size={15} />
                          </button>
                          <button onClick={() => handleDelete(pid3)}
                            className="btn-ghost p-2 rounded-lg text-slate-400 hover:text-rose-400 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">Página {page} de {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="btn-ghost p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
              className="btn-ghost p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Crear/Editar */}
      {showModal && (
        <Modal title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'} onClose={handleCloseModal}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">Nombre *</label>
                <input type="text" className="input-glass w-full" placeholder="Nombre del producto"
                  value={formData.productName} onChange={e => setField('productName', e.target.value)} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">Código de Barras *</label>
                <input type="text" className="input-glass w-full font-mono" placeholder="000000000000"
                  value={formData.barcode} onChange={e => setField('barcode', e.target.value)} />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">Precio Costo (S/) *</label>
                <input type="number" step="0.01" min="0" className="input-glass w-full" placeholder="0.00"
                  value={formData.costPrice} onChange={e => setField('costPrice', e.target.value)} />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">Precio Venta (S/) *</label>
                <input type="number" step="0.01" min="0" className="input-glass w-full" placeholder="0.00"
                  value={formData.sellingPrice} onChange={e => setField('sellingPrice', e.target.value)} />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">Stock</label>
                <input type="number" min="0" className="input-glass w-full" placeholder="0"
                  value={formData.stockQuantity} onChange={e => setField('stockQuantity', e.target.value)} />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">Categoría</label>
                <input type="number" min="1" className="input-glass w-full"
                  value={formData.categoryId} onChange={e => setField('categoryId', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">Descripción</label>
                <textarea rows={2} className="input-glass w-full resize-none" placeholder="Descripción opcional..."
                  value={formData.description} onChange={e => setField('description', e.target.value)} />
              </div>
              {/* Imagen del producto */}
              <div className="col-span-2">
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">Foto del Producto</label>
                <input ref={imageRef} type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const f = e.target.files[0];
                    if (!f) return;
                    setImageFile(f);
                    setImagePreview(URL.createObjectURL(f));
                  }}
                />
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="preview" className="w-full h-full object-cover"
                        onError={e => { e.target.style.display='none'; }} />
                    ) : (
                      <ImageIcon size={24} className="text-slate-500" />
                    )}
                  </div>
                  <button type="button" onClick={() => imageRef.current.click()}
                    className="btn-ghost flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-300 hover:text-white">
                    <Upload size={15} />{imagePreview ? 'Cambiar foto' : 'Subir foto'}
                  </button>
                  {imageFile && <span className="text-slate-400 text-xs truncate max-w-[120px]">{imageFile.name}</span>}
                </div>
              </div>
            </div>

            {/* Margen calculado */}
            {formData.costPrice > 0 && formData.sellingPrice > 0 && (
              <div className="glass p-3 rounded-xl flex items-center gap-3">
                <BarChart3 size={16} className="text-emerald-400 shrink-0" />
                <span className="text-slate-400 text-sm">Margen estimado:</span>
                <span className="text-emerald-400 font-bold">
                  {((formData.sellingPrice - formData.costPrice) / formData.costPrice * 100).toFixed(1)}%
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 py-1">
              <div className="relative">
                <input type="checkbox" id="isActive" checked={formData.isActive}
                  onChange={e => setField('isActive', e.target.checked)} className="sr-only" />
                <div onClick={() => setField('isActive', !formData.isActive)}
                  className={`w-10 h-5 rounded-full cursor-pointer transition-colors duration-200 ${formData.isActive ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow mt-0.5 ml-0.5 transition-transform duration-200 ${formData.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
              <label htmlFor="isActive" className="text-slate-300 text-sm cursor-pointer" onClick={() => setField('isActive', !formData.isActive)}>
                Producto activo
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleCloseModal} className="btn-ghost flex-1 py-2.5 rounded-xl text-sm font-medium">Cancelar</button>
              <button onClick={handleSubmit} disabled={processing}
                className="btn-primary flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                {processing
                  ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  : <Save size={15} />}
                {editingProduct ? 'Actualizar' : 'Crear Producto'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
