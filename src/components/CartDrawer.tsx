"use client";

import { useState } from "react";
import CheckoutModal from "./CheckoutModal";

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // Mock cart items for demonstration
  const cartItems = [
    { id: 1, name: "Jordan Jumpman Knockout", price: 138, quantity: 1, img: "https://i.pinimg.com/736x/c2/c7/40/c2c740d467e07e78307e2163ca421c01.jpg" }
  ];
  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (!isOpen) return null;

  return (
    <>
      <div className="overlay-backdrop" onClick={onClose} style={{ display: "block" }}></div>
      <div className="cart-drawer open" role="dialog" aria-label="Shopping cart" style={{ right: 0 }}>
        <div className="cart-drawer-header">
          <span className="cart-drawer-title">
            Your Bag <span style={{ fontSize: "1rem", color: "var(--text-soft)", fontWeight: 400 }}>({cartItems.length})</span>
          </span>
          <button className="btn-icon" onClick={onClose} aria-label="Close cart">✕</button>
        </div>

        <div className="cart-items-wrap">
          {cartItems.map((item) => (
            <div key={item.id} className="cart-item" style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              <img src={item.img} alt={item.name} style={{ width: "60px", height: "80px", objectFit: "cover", borderRadius: "var(--r-sm)" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                <div style={{ color: "var(--text-soft)", fontSize: "14px" }}>Qty: {item.quantity}</div>
                <div style={{ fontWeight: 600, marginTop: "4px" }}>${item.price}</div>
              </div>
            </div>
          ))}
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
        <CheckoutModal 
          cartItems={cartItems} 
          total={total} 
          onClose={() => setIsCheckoutOpen(false)} 
        />
      )}
    </>
  );
}
