"use client";

import { useEffect, useMemo, useState } from "react";
import CheckoutModal from "./CheckoutModal";
import { CartSkeleton } from "./skeletons";

type CartItem = {
  product_id: number;
  name: string;
  brand: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  isAiMatched: boolean;
};

function readCart(): CartItem[] {
  try {
    const stored = localStorage.getItem("drape_cart") || "[]";
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed as CartItem[];
  } catch {
    return [];
  }
}

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const total = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartItems]
  );

  const cartLinesCount = cartItems.length;

  useEffect(() => {
    if (!isOpen) return;

    const sync = () => {
      setIsLoading(true);
      setCartItems(readCart());
      setIsLoading(false);
    };

    sync();
    window.addEventListener("cart_updated", sync);

    return () => {
      window.removeEventListener("cart_updated", sync);
    };
  }, [isOpen]);

  // Close nested checkout if cart drawer is closed
  useEffect(() => {
    if (!isOpen) {
      queueMicrotask(() => setIsCheckoutOpen(false));
    }
  }, [isOpen]);


  if (!isOpen) return null;

  return (
    <>
      <div className="overlay-backdrop" onClick={onClose} style={{ display: "block" }}></div>
      <div className="cart-drawer open" role="dialog" aria-label="Shopping cart" style={{ right: 0 }}>
        <div className="cart-drawer-header">
          <span className="cart-drawer-title">
            Your Bag{" "}
            <span style={{ fontSize: "1rem", color: "var(--text-soft)", fontWeight: 400 }}>
              ({cartLinesCount})
            </span>
          </span>
          <button className="btn-icon" onClick={onClose} aria-label="Close cart">
            ✕
          </button>
        </div>

        <div className="cart-items-wrap">
          {isLoading ? (
            <CartSkeleton />
          ) : cartItems.length > 0 ? (
            cartItems.map((item) => (
              <div
                key={item.product_id}
                className="cart-item"
                style={{ display: "flex", gap: "12px", marginBottom: "16px" }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  style={{ width: "60px", height: "80px", objectFit: "cover", borderRadius: "var(--r-sm)" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <div style={{ color: "var(--text-soft)", fontSize: "14px" }}>
                    Qty: {item.quantity}
                  </div>
                  <div style={{ color: "var(--text-soft)", fontSize: "12px", marginTop: "4px" }}>
                    {item.brand} • {item.size} • {item.color}
                  </div>
                  <div style={{ fontWeight: 600, marginTop: "6px" }}>${item.price}</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: "24px 12px", color: "var(--text-soft)", textAlign: "center" }}>
              Your bag is empty.
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-subtotal-row">
              <span className="cart-subtotal-label">Total</span>
              <span className="cart-subtotal-val">${total}</span>
            </div>
            <button
              className="btn btn-navy btn-block btn-lg"
              style={{ marginTop: "12px" }}
              onClick={() => setIsCheckoutOpen(true)}
            >
              Checkout &rarr;
            </button>
            <button
              className="btn btn-ghost btn-block btn-sm"
              style={{ marginTop: "6px", color: "var(--text-soft)" }}
              onClick={onClose}
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>

      {isCheckoutOpen && (
        <CheckoutModal cartItems={cartItems} total={total} onClose={() => setIsCheckoutOpen(false)} />
      )}
    </>
  );
}

