"use client";

import { useState } from "react";

interface MobileBottomCTAProps {
  productName: string;
  price: number;
  onAddToCart: () => void;
  onFindSize: () => void;
  isAdding?: boolean;
  selectedSize?: string;
}

export default function MobileBottomCTA({
  productName,
  price,
  onAddToCart,
  onFindSize,
  isAdding = false,
  selectedSize,
}: MobileBottomCTAProps) {
  return (
    <div className="mobile-cta-bar" role="region" aria-label="Product actions">
      <button
        type="button"
        className="btn btn-outline"
        onClick={onFindSize}
        id="mobile-find-size-btn"
        aria-label="Find my size"
      >
        Find Size
      </button>
      <button
        type="button"
        className="btn btn-navy"
        onClick={onAddToCart}
        disabled={isAdding}
        id="mobile-add-to-cart-btn"
        aria-label={`Add ${productName} to bag`}
      >
        {isAdding
          ? "Adding…"
          : `Add to Bag${selectedSize ? ` — ${selectedSize}` : ''} — $${price.toFixed(2)}`
        }
      </button>
    </div>
  );
}
