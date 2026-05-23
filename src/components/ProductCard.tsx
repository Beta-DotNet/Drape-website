"use client";

import { Product } from "@/lib/data";
import { useState } from "react";
import { useProductModal } from "./ProductModalContext";
import Image from "next/image";

export default function ProductCard({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false);
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
      alert(`${product.name} added to bag!`);
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
          <button
            className="ph-btn"
            onClick={quickAddToCart}
            title="Quick add"
          >
            +
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
          >
            +
          </button>
        </div>
        <div className="product-rating">
          <span className="stars" aria-label={`Rating: ${product.rating} out of 5`}>
            {Array.from({ length: 5 }).map((_, idx) => {
              const filled = idx < Math.round(product.rating);
              return (
                <img
                  key={idx}
                  src={filled ? "/images/material-symbols--star-rounded.svg" : "/images/material-symbols--star-outline-rounded.svg"}
                  alt={filled ? "Star" : "Empty star"}
                  style={{ width: 14, height: 14, marginRight: 2, verticalAlign: "-2px" }}
                />
              );
            })}
          </span>
          <span>({product.reviews})</span>
        </div>
      </div>
    </article>
  );
}
