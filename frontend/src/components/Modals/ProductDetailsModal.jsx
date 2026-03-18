import { X, Package, BarChart3 } from 'lucide-react';

export default function ProductDetailsModal({
  isOpen,
  onClose,
  product,
  onAdd,
  loading = false
}) {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Detalles del Producto</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Imagen Placeholder */}
        <div className="bg-gray-100 rounded-lg h-48 mb-6 flex items-center justify-center">
          <Package className="w-16 h-16 text-gray-400" />
        </div>

        {/* Product Info */}
        <div className="space-y-4 mb-6">
           <div>
             <h3 className="text-sm text-gray-700 font-semibold">Nombre del Producto</h3>
             <p className="text-lg text-gray-900 font-bold">{product.ProductName}</p>
           </div>

           <div>
             <h3 className="text-sm text-gray-700 font-semibold">Código de Barras</h3>
            <p className="text-gray-900 font-mono text-sm bg-gray-50 p-2 rounded">
              {product.Barcode}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <h3 className="text-sm text-gray-700 font-semibold">Categoría</h3>
               <p className="text-gray-900">
                 {product.CategoryName || 'Sin categoría'}
               </p>
             </div>
             <div>
               <h3 className="text-sm text-gray-700 font-semibold">Stock</h3>
               <p className={`font-bold ${
                 product.StockQuantity > 10 ? 'text-green-700' :
                 product.StockQuantity > 0 ? 'text-orange-700' :
                 'text-red-700'
               }`}>
                {product.StockQuantity} unidades
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <h3 className="text-sm text-gray-700 font-semibold">Precio de Costo</h3>
               <p className="text-lg text-gray-900 font-bold">
                 S/. {parseFloat(product.CostPrice || 0).toFixed(2)}
               </p>
             </div>
             <div>
               <h3 className="text-sm text-gray-700 font-semibold">Precio de Venta</h3>
               <p className="text-lg text-blue-700 font-bold">
                S/. {parseFloat(product.SellingPrice || 0).toFixed(2)}
              </p>
            </div>
          </div>

           <div>
             <div className="flex items-center justify-between mb-2">
               <h3 className="text-sm text-gray-700 font-semibold">Margen de Ganancia</h3>
              <BarChart3 className="w-4 h-4 text-gray-400" />
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-green-700 font-bold">
                {((((product.SellingPrice - product.CostPrice) / product.CostPrice) * 100) || 0).toFixed(2)}%
              </p>
            </div>
          </div>

           {product.Description && (
             <div>
               <h3 className="text-sm text-gray-700 font-semibold">Descripción</h3>
              <p className="text-gray-700 text-sm">
                {product.Description}
              </p>
            </div>
          )}

           <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
             <div>
               <h3 className="text-xs text-gray-700 font-semibold">Creado</h3>
               <p className="text-xs text-gray-600">
                {new Date(product.CreatedAt).toLocaleDateString('es-PE')}
              </p>
            </div>
             <div>
               <h3 className="text-xs text-gray-700 font-semibold">Estado</h3>
              <span className={`text-xs font-semibold px-2 py-1 rounded ${
                product.IsActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {product.IsActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-3 px-4 rounded-lg transition"
          >
            Cerrar
          </button>
           <button
             onClick={() => {
               onAdd(product);
               onClose();
             }}
             disabled={loading || product.StockQuantity <= 0}
             className="flex-1 bg-green-700 hover:bg-green-800 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition"
           >
            {loading ? 'Agregando...' : 'Agregar al Carrito'}
          </button>
        </div>
      </div>
    </div>
  );
}
