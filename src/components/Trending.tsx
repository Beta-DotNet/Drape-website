"use client";

import { DEFAULT_PRODUCTS } from "@/lib/data";
import ProductCard from "./ProductCard";

export default function Trending() {
  // get 8 trending products
  const trendingProducts = DEFAULT_PRODUCTS.filter((p) =>
    p.tags.includes("trending")
  ).slice(0, 8);

  return (
    <section className="trending-section">
      <div className="section-heading">
        <div className="line"></div>
        <span className="section-label">Trending</span>
        <div className="line"></div>
      </div>
      <div className="products-grid" id="trending-grid">
        {trendingProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
