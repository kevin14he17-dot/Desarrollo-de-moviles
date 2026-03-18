import { useState } from 'react';
import { X, QrCode, Copy, Check } from 'lucide-react';
import { QRCodeCanvas as QRCode } from 'qrcode.react';

export default function PaymentModal({
  isOpen,
  onClose,
  total,
  paymentMethod,
  onConfirm,
  loading = false
}) {
  const [amount, setAmount] = useState('');
  const [showQR, setShowQR] = useState(paymentMethod === 'YAPE' || paymentMethod === 'PLIN');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!amount || parseFloat(amount) < total) {
      alert('Monto insuficiente');
      return;
    }
    onConfirm(parseFloat(amount));
  };

  const generateQRValue = () => {
    if (paymentMethod === 'YAPE') {
      return `https://yape.pe/pay/${Date.now()}`; // URL de referencia
    } else if (paymentMethod === 'PLIN') {
      return `https://plin.pe/pay/${Date.now()}`; // URL de referencia
    }
    return '';
  };

  const handleCopyQR = () => {
    navigator.clipboard.writeText(generateQRValue());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPaymentMethodLabel = () => {
    const methods = {
      'EFECTIVO': 'Pago en Efectivo',
      'TARJETA': 'Pago con Tarjeta',
      'YAPE': 'Pago con YAPE',
      'PLIN': 'Pago con PLIN'
    };
    return methods[paymentMethod] || 'Pago';
  };

  const getPaymentMethodColor = () => {
    const colors = {
      'EFECTIVO': 'green',
      'TARJETA': 'blue',
      'YAPE': 'purple',
      'PLIN': 'orange'
    };
    return colors[paymentMethod] || 'gray';
  };

  const color = getPaymentMethodColor();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{getPaymentMethodLabel()}</h2>
            <p className="text-gray-600 text-sm mt-1">Total a Pagar: <span className="font-bold text-lg">S/. {total.toFixed(2)}</span></p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* QR Display (si aplica) */}
        {(paymentMethod === 'YAPE' || paymentMethod === 'PLIN') && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-center">
            <div className="flex justify-center mb-4">
              <QRCode
                value={generateQRValue()}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Escanea el código QR con {paymentMethod} para realizar el pago
            </p>
            <button
              onClick={handleCopyQR}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar código
                </>
              )}
            </button>
          </div>
        )}

        {/* Amount Input */}
        <div className="space-y-4 mb-6">
           <div>
             <label className="block text-sm font-semibold text-gray-900 mb-2">
               Monto a Pagar (S/.)
             </label>
             <input
               type="number"
               step="0.01"
               min={total}
               value={amount}
               onChange={(e) => setAmount(e.target.value)}
               placeholder={total.toFixed(2)}
               className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
               style={{
                 focusBorderColor: color === 'green' ? '#059669' : color === 'blue' ? '#1D4ED8' : color === 'purple' ? '#7C3AED' : '#D97706'
               }}
               disabled={paymentMethod === 'YAPE' || paymentMethod === 'PLIN'}
             />
             {amount && parseFloat(amount) > total && (
               <p className="text-sm text-green-700 mt-2">
                Cambio: S/. {(parseFloat(amount) - total).toFixed(2)}
              </p>
            )}
          </div>

          {/* Métodos QR: mostrar referencia */}
          {(paymentMethod === 'YAPE' || paymentMethod === 'PLIN') && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Número de Referencia (opcional)
              </label>
              <input
                type="text"
                placeholder="Ingresa el número de referencia del pago"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-3 px-4 rounded-lg transition"
          >
            Cancelar
          </button>
           <button
             onClick={handleConfirm}
             disabled={loading || !amount || parseFloat(amount) < total}
             className={`flex-1 text-white font-bold py-3 px-4 rounded-lg transition ${
               color === 'green' ? 'bg-green-700 hover:bg-green-800 disabled:bg-gray-400' :
               color === 'blue' ? 'bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400' :
               color === 'purple' ? 'bg-purple-700 hover:bg-purple-800 disabled:bg-gray-400' :
               'bg-orange-700 hover:bg-orange-800 disabled:bg-gray-400'
             }`}
           >
            {loading ? 'Procesando...' : 'Confirmar Pago'}
          </button>
        </div>

        {/* Info Footer */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          {paymentMethod === 'EFECTIVO' && 'El cambio será entregado al cliente'}
          {paymentMethod === 'TARJETA' && 'Ingresa el monto pagado con tarjeta'}
          {paymentMethod === 'YAPE' && 'Compartir código QR con cliente para pagar'}
          {paymentMethod === 'PLIN' && 'Compartir código QR con cliente para pagar'}
        </p>
      </div>
    </div>
  );
}
