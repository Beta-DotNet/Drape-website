"use client";

import { Product } from "@/lib/data";
import { useRef, useState } from "react";
import { useProductModal } from "./ProductModalContext";
import Image from "next/image";

export default function ProductCard({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimeoutRef = useRef<number | null>(null);
  const { openProductModal } = useProductModal();

  const discPct = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
  };

  const quickAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const stored = localStorage.getItem("drape_cart") || "[]";
      const cart = JSON.parse(stored);

      // Look for same product
      const itemIndex = cart.findIndex((item: { product_id: number; quantity: number }) => item.product_id === product.id);

      if (itemIndex > -1) {
        cart[itemIndex].quantity += 1;
      } else {
        cart.push({
          product_id: product.id,
          name: product.name,
          brand: product.brand,
          price: product.price,
          image: product.images[0],
          size: product.sizes[0] || "L",
          color: product.colors[0] || "Default",
          quantity: 1,
          isAiMatched: false
        });
      }

      localStorage.setItem("drape_cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cart_updated"));

      setToastMessage(`${product.name} added to bag`);

      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }

      toastTimeoutRef.current = window.setTimeout(() => {
        setToastMessage("");
      }, 2400);
    } catch (err) {
      console.error("Error in quickAddToCart:", err);
    }
  };

  const handleCardClick = () => {
    openProductModal(product);
  };


  return (
    <article className="product-card" onClick={handleCardClick}>
      <div className="product-img">
        <Image src={product.images[0]} alt={product.name} width={300} height={360} unoptimized style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div className="product-hover-actions">
          <button
            className={`ph-btn ${liked ? "liked" : ""}`}
            onClick={toggleWishlist}
            title={liked ? "Remove from wishlist" : "Add to wishlist"}
          >
            <img
              src={liked ? "/images/weui--like-filled.svg" : "/images/icon-park-outline--like.svg"}
              alt={liked ? "Liked" : "Like"}
              style={{ width: 18, height: 18, display: "block" }}
            />
          </button>
        </div>
      </div>
      <div className="product-info">
        <div className="product-brand">{product.brand}</div>
        <div className="product-name">{product.name}</div>
        <div className="product-bottom">
          <div className="product-price">
            <span className="price-main">${product.price}</span>
            {product.originalPrice && (
              <span className="price-orig">${product.originalPrice}</span>
            )}
            {discPct > 0 && <span className="price-disc">-{discPct}%</span>}
          </div>
          <button
            className="add-btn"
            onClick={quickAddToCart}
            title="Add to cart"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              background: "none",
              border: "none",
              width: 34,
              height: 34,
            }}
          >
            <svg
              width="1.1em"
              height="1.1em"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0f172a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ display: "block" }}
              aria-hidden="true"
            >
              <circle cx="9" cy="21" r="1.25" />
              <circle cx="19" cy="21" r="1.25" />
              <path d="M2.5 3H4.5L6.5 17H20.5L22 7H7" />
            </svg>
          </button>
        </div>
        <div
          className="product-rating"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35em",
            marginTop: 4,
          }}
        >
          <span
            className="stars"
            aria-label={`Rating: ${product.rating} out of 5`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.1em",
              height: "1.2em",
            }}
          >
            {Array.from({ length: 5 }).map((_, idx) => {
              const filled = idx < Math.round(product.rating);
              return (
                <svg
                  key={idx}
                  width="1.2em"
                  height="1.2em"
                  viewBox="0 0 24 24"
                  fill={filled ? "#facc15" : "none"}
                  stroke="#facc15"
                  strokeWidth="1.5"
                  style={{ display: "block" }}
                  aria-hidden="true"
                >
                  <path
                    d="M12 2.5 14.9 8.5l6.5.9-4.7 4.6 1.1 6.5L12 17.6l-5.8 3 1.1-6.5L2.6 9.4l6.5-.9L12 2.5Z"
                    strokeLinejoin="round"
                  />
                </svg>
              );
            })}
          </span>
          <span style={{ fontSize: "0.98em", color: "#64748b", fontWeight: 500 }}>
            ({product.reviews})
          </span>
        </div>
      </div>
      <div
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 1000,
          padding: "12px 16px",
          borderRadius: 999,
          background: "rgba(15, 23, 42, 0.96)",
          color: "#fff",
          fontSize: 14,
          fontWeight: 700,
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.24)",
          transform: toastMessage ? "translateY(0)" : "translateY(120%)",
          opacity: toastMessage ? 1 : 0,
          transition: "transform 220ms ease, opacity 220ms ease",
          pointerEvents: "none",
          maxWidth: 320,
        }}
      >
        {toastMessage}
      </div>
    </article>
  );
}
