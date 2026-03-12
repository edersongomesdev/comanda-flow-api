import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { CartItem, MenuItem, Modifier } from "@/types";

type OrderMode = "delivery" | "pickup" | "table";

interface CartContextType {
  items: CartItem[];
  orderMode: OrderMode;
  tableNumber: number | null;
  neighborhood: string;
  total: number;
  itemCount: number;
  addItem: (menuItem: MenuItem, quantity: number, modifiers: Modifier[], notes: string) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  setOrderMode: (mode: OrderMode) => void;
  setTableNumber: (n: number | null) => void;
  setNeighborhood: (n: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderMode, setOrderMode] = useState<OrderMode>("delivery");
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [neighborhood, setNeighborhood] = useState("");

  const addItem = useCallback((menuItem: MenuItem, quantity: number, modifiers: Modifier[], notes: string) => {
    setItems((prev) => [...prev, { menuItem, quantity, modifiers, notes }]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, quantity } : item)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = useMemo(() =>
    items.reduce((sum, item) => {
      const modTotal = item.modifiers.reduce((s, m) => s + m.price, 0);
      return sum + (item.menuItem.price + modTotal) * item.quantity;
    }, 0),
  [items]);

  const itemCount = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, orderMode, tableNumber, neighborhood, total, itemCount, addItem, removeItem, updateQuantity, setOrderMode, setTableNumber, setNeighborhood, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
