import { create } from 'zustand';

const usePOSStore = create((set, get) => ({
  items: [],
  cashDrawerId: null,
  subtotal: 0,
  tax: 0,
  total: 0,

  // Agregar item al carrito
  addItem: (product, quantity = 1) => {
    set((state) => {
      const pid = product.productId || product.ProductID;
      const existingItem = state.items.find((item) => (item.productId || item.ProductID) === pid);

      let newItems;
      if (existingItem) {
        newItems = state.items.map((item) =>
          (item.productId || item.ProductID) === pid
            ? { ...item, cantidad: item.cantidad + quantity }
            : item
        );
      } else {
        newItems = [
          ...state.items,
          {
            ...product,
            productId: pid,
            cantidad: quantity,
            precioUnitario: product.sellingPrice || product.SellingPrice,
          },
        ];
      }

      return { items: newItems };
    });

    get().calculateTotals();
  },

  // Actualizar cantidad
  updateQuantity: (productId, quantity) => {
    set((state) => ({
      items: state.items.map((item) =>
        (item.productId || item.ProductID) === productId
          ? { ...item, cantidad: Math.max(1, quantity) }
          : item
      ),
    }));

    get().calculateTotals();
  },

  // Remover item
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => (item.productId || item.ProductID) !== productId),
    }));

    get().calculateTotals();
  },

  // Vaciar carrito
  clearCart: () => {
    set({
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
    });
  },

  // Calcular totales
  calculateTotals: () => {
    const state = get();
    const subtotal = state.items.reduce(
      (sum, item) => sum + item.cantidad * item.precioUnitario,
      0
    );
    const tax = subtotal * 0.18; // 18% IGV Perú
    const total = subtotal + tax;

    set({ subtotal, tax, total });
  },

  // Establecer caja abierta
  setCashDrawerId: (id) => set({ cashDrawerId: id }),

  // Obtener carrito actual
  getCart: () => {
    const state = get();
    return {
      items: state.items,
      subtotal: state.subtotal,
      tax: state.tax,
      total: state.total,
    };
  },
}));

export default usePOSStore;
