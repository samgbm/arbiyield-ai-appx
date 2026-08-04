"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { getAgentById } from "@/lib/mock-data";
import type { Agent, CartItem } from "@/lib/types";

interface CartContextValue {
  items: CartItem[];
  addItem: (agentId: string) => void;
  removeItem: (agentId: string) => void;
  setQuantity: (agentId: string, quantity: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  detailed: { agent: Agent; quantity: number; lineTotal: number }[];
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "sam-ai-cart";

let memoryItems: CartItem[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): CartItem[] {
  return memoryItems;
}

function getServerSnapshot(): CartItem[] {
  return [];
}

function readStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function writeStorage(items: CartItem[]) {
  memoryItems = items;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
  emit();
}

if (typeof window !== "undefined") {
  memoryItems = readStorage();
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      memoryItems = readStorage();
      emit();
    }
  });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addItem = useCallback((agentId: string) => {
    const prev = memoryItems;
    const existing = prev.find((item) => item.agentId === agentId);
    const next = existing
      ? prev.map((item) =>
          item.agentId === agentId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      : [...prev, { agentId, quantity: 1 }];
    writeStorage(next);
  }, []);

  const removeItem = useCallback((agentId: string) => {
    writeStorage(memoryItems.filter((item) => item.agentId !== agentId));
  }, []);

  const setQuantity = useCallback((agentId: string, quantity: number) => {
    const next =
      quantity <= 0
        ? memoryItems.filter((item) => item.agentId !== agentId)
        : memoryItems.map((item) =>
            item.agentId === agentId ? { ...item, quantity } : item,
          );
    writeStorage(next);
  }, []);

  const clear = useCallback(() => writeStorage([]), []);

  const detailed = useMemo(() => {
    return items
      .map((item) => {
        const agent = getAgentById(item.agentId);
        if (!agent) return null;
        return {
          agent,
          quantity: item.quantity,
          lineTotal: agent.price * item.quantity,
        };
      })
      .filter(Boolean) as {
      agent: Agent;
      quantity: number;
      lineTotal: number;
    }[];
  }, [items]);

  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => detailed.reduce((sum, line) => sum + line.lineTotal, 0),
    [detailed],
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      setQuantity,
      clear,
      count,
      subtotal,
      detailed,
    }),
    [items, addItem, removeItem, setQuantity, clear, count, subtotal, detailed],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
