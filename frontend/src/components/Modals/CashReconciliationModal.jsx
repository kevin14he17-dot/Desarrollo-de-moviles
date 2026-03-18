import { X, AlertCircle, CheckCircle } from 'lucide-react';

export default function CashReconciliationModal({
  isOpen,
  onClose,
  expectedAmount,
  actualAmount,
  difference,
  onConfirm,
  loading = false
}) {
  if (!isOpen) return null;

  const isDifference = Math.abs(difference) > 0.01;
  const isSmallDifference = Math.abs(difference) <= 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Reconciliación de Caja</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Summary */}
         <div className="space-y-4 mb-6">
           <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
             <p className="text-sm text-blue-700 font-semibold mb-1">Monto Esperado</p>
             <p className="text-3xl font-bold text-blue-700">
              S/. {expectedAmount.toFixed(2)}
            </p>
          </div>

           <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
             <p className="text-sm text-gray-700 font-semibold mb-1">Monto Contado</p>
             <p className="text-3xl font-bold text-gray-900">
              S/. {actualAmount.toFixed(2)}
            </p>
          </div>

          {/* Difference */}
          <div className={`p-4 rounded-lg border ${
            isDifference
              ? isSmallDifference
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-start gap-3">
               {isDifference
                 ? isSmallDifference
                   ? <AlertCircle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-1" />
                   : <AlertCircle className="w-5 h-5 text-red-700 flex-shrink-0 mt-1" />
                 : <CheckCircle className="w-5 h-5 text-green-700 flex-shrink-0 mt-1" />
              }
              <div className="flex-1">
                 <p className={`text-sm font-semibold mb-1 ${
                   isDifference
                     ? isSmallDifference
                       ? 'text-yellow-700'
                       : 'text-red-700'
                     : 'text-green-700'
                 }`}>
                  {isDifference
                    ? isSmallDifference
                      ? 'Diferencia Menor'
                      : 'Diferencia Mayor'
                    : 'Caja Cuadrada'
                  }
                </p>
                 <p className={`text-2xl font-bold ${
                   isDifference
                     ? difference > 0
                       ? 'text-green-700'
                       : 'text-red-700'
                     : 'text-green-700'
                 }`}>
                  {difference >= 0 ? '+' : ''} S/. {Math.abs(difference).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
         <div className="bg-gray-50 p-4 rounded-lg mb-6 text-sm space-y-2">
           <div className="flex justify-between">
             <span className="text-gray-700">Diferencia en %:</span>
             <span className="font-semibold">
              {((Math.abs(difference) / expectedAmount) * 100 || 0).toFixed(2)}%
            </span>
          </div>
           <div className="flex justify-between">
             <span className="text-gray-700">Margen aceptable:</span>
             <span className="font-semibold">±S/. 1.00 (0.1%)</span>
           </div>
           <div className="flex justify-between pt-2 border-t border-gray-200">
             <span className="text-gray-700">Estado:</span>
             <span className={`font-semibold ${
               Math.abs(difference) <= 1 ? 'text-green-700' : 'text-red-700'
             }`}>
              {Math.abs(difference) <= 1 ? 'Aceptable' : 'Revisar'}
            </span>
          </div>
        </div>

        {/* Message */}
        {isDifference && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              {isSmallDifference
                ? 'La diferencia es menor a S/. 1.00. Es normal en transacciones con efectivo.'
                : 'Existe una diferencia importante. Por favor, verifica el conteo de caja.'
              }
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-3 px-4 rounded-lg transition"
          >
            Cancelar
          </button>
           <button
             onClick={onConfirm}
             disabled={loading}
             className="flex-1 bg-green-700 hover:bg-green-800 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition"
           >
            {loading ? 'Cerrando...' : 'Confirmar Cierre'}
          </button>
        </div>
      </div>
    </div>
  );
}
