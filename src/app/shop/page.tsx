"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Product } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";
import { translateShonaTerm } from "@/lib/search";
import { ShopPageSkeleton } from "@/components/skeletons";

function mapSupabaseProductRow(row: unknown): Product {
  const product = row as Partial<{
    id: number | string;
    name: string;
    brand: string;
    category: string;
    gender: string | null;
    price: number | string;
    original_price: number | string | null;
    images: unknown;
    colors: unknown;
    sizes: unknown;
    rating: number | null;
    reviews: number | null;
    fabric: string | null;
    care: string | null;
    description: string | null;
    tags: unknown;
    in_stock: boolean | null;
  }>;

  return {
    id: typeof product.id === "number" ? product.id : Number(product.id ?? 0),
    name: typeof product.name === "string" ? product.name : "",
    brand: typeof product.brand === "string" ? product.brand : "",
    category: typeof product.category === "string" ? product.category : "",
    gender: typeof product.gender === "string" ? product.gender : "Unisex",
    price: typeof product.price === "number" ? product.price : Number(product.price ?? 0),
    originalPrice:
      typeof product.original_price === "number"
        ? product.original_price
        : typeof product.original_price === "string"
          ? Number(product.original_price)
          : null,
    images: Array.isArray(product.images)
      ? product.images.filter((item): item is string => typeof item === "string")
      : [],
    colors: Array.isArray(product.colors)
      ? product.colors.filter((item): item is string => typeof item === "string")
      : [],
    sizes: Array.isArray(product.sizes)
      ? product.sizes.filter((item): item is string => typeof item === "string")
      : [],
    rating: typeof product.rating === "number" ? product.rating : 0,
    reviews: typeof product.reviews === "number" ? product.reviews : 0,
    fabric: typeof product.fabric === "string" ? product.fabric : "",
    care: typeof product.care === "string" ? product.care : "",
    description: typeof product.description === "string" ? product.description : "",
    tags: Array.isArray(product.tags)
      ? product.tags.filter((item): item is string => typeof item === "string")
      : [],
    inStock: typeof product.in_stock === "boolean" ? product.in_stock : Boolean(product.in_stock),
  };
}

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL-driven initial state
  const urlQ        = searchParams.get("q") || "";
  const urlCategory = searchParams.get("category") || "all";
  const urlGender   = searchParams.get("gender") || "all";

  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory]     = useState(urlCategory);
  const [gender, setGender]         = useState(urlGender);
  const [maxPrice, setMaxPrice]     = useState(500);
  const [translatedQuery, setTranslatedQuery] = useState("");
  const [isShona, setIsShona]       = useState(false);
  const [shonaTerm, setShonaTerm]   = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        if (!Array.isArray(data)) {
          setProducts([]);
          return;
        }

        const liveProducts = data.map(mapSupabaseProductRow);
        setProducts(liveProducts);
      } catch {
        if (isMounted) {
          setProducts([]);
        }
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  // Re-sync sidebar filters when URL changes (e.g. clicking nav links)
  useEffect(() => {
    // State is derived from URL params; update in a microtask to avoid react-hooks/set-state-in-effect
    queueMicrotask(() => {
      setCategory(urlCategory);
      setGender(urlGender);
    });
  }, [urlCategory, urlGender]);


  // Translate search query whenever `urlQ` changes
  useEffect(() => {
    if (!urlQ.trim()) {
      queueMicrotask(() => {
        setTranslatedQuery("");
        setIsShona(false);
        setShonaTerm(null);
      });
      return;
    }


    translateShonaTerm(urlQ).then(({ translated, isShona: detected, shonaTerm: term }) => {
      setTranslatedQuery(translated);
      setIsShona(detected);
      setShonaTerm(term);
    });
  }, [urlQ]);

  // Filtering logic — matches original OR translated query
  const filteredProducts = products.filter((p) => {
    // Sidebar filters
    if (category !== "all" && p.category.toLowerCase() !== category.toLowerCase()) return false;
    if (gender !== "all" && p.gender !== gender && p.gender !== "Unisex") return false;
    if (p.price > maxPrice) return false;

    // Search query filter
    if (urlQ.trim()) {
      const raw = urlQ.toLowerCase();
      // Use the translated term if we detected Shona, otherwise use raw query
      const effectiveTerm = translatedQuery ? translatedQuery.toLowerCase() : raw;

      const matches = (str: string) =>
        str.toLowerCase().includes(effectiveTerm) ||
        str.toLowerCase().includes(raw);

      const nameMatch     = matches(p.name);
      const brandMatch    = matches(p.brand);
      const categoryMatch = matches(p.category);
      const descMatch     = matches(p.description);
      const tagMatch      = p.tags.some((t) => matches(t));

      if (!nameMatch && !brandMatch && !categoryMatch && !descMatch && !tagMatch) return false;
    }

    return true;
  });

  const handleClearFilters = () => {
    setCategory("all");
    setGender("all");
    setMaxPrice(500);
    router.push("/shop");
  };

  return (
    <section id="view-shop" className="view active">
      <div className="shop-layout">
        {/* ── Filter Sidebar ── */}
        <aside className="filter-sidebar" id="filter-sidebar">
          <div className="filter-sidebar-title">Filters</div>

          <div className="filter-section">
            <div className="filter-title">Category</div>
            <div className="filter-options">
              {["all", "Shoes", "Tops", "Bottoms", "Accessories", "Kids"].map((c) => (
                <label key={c} className="filter-option">
                  <input
                    type="radio"
                    name="cat"
                    value={c}
                    checked={category === c}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                  <label>{c === "all" ? "All" : c}</label>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-title">Gender</div>
            <div className="filter-options">
              {["all", "Men", "Women", "Kids"].map((g) => (
                <label key={g} className="filter-option">
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={gender === g}
                    onChange={(e) => setGender(e.target.value)}
                  />
                  <label>{g === "all" ? "All" : g}</label>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-title">Price Range</div>
            <div className="price-range-wrap">
              <input
                type="range"
                id="price-max"
                min="0"
                max="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              />
              <div className="price-labels">
                <span>$0</span>
                <span>${maxPrice}</span>
              </div>
            </div>
          </div>

          <button
            className="btn btn-outline btn-block btn-sm"
            onClick={handleClearFilters}
          >
            Clear All Filters
          </button>
        </aside>

        {/* ── Main Grid ── */}
        <div className="shop-main">
          {/* Shona translation banner */}
          {urlQ && isShona && translatedQuery && (
            <div
              style={{
                marginBottom: "16px",
                padding: "10px 16px",
                background: "linear-gradient(135deg, rgba(26,58,82,0.08) 0%, rgba(249,211,67,0.08) 100%)",
                border: "1px solid rgba(249,211,67,0.35)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                color: "var(--navy)",
                fontWeight: 600,
              }}
            >
              <span style={{ fontSize: "16px" }}>✨</span>
              <span>
                Showing results for{" "}
                <strong>&ldquo;{translatedQuery}&rdquo;</strong>
                {shonaTerm && (
                  <span style={{ fontWeight: 400, color: "var(--text-soft)" }}>
                    {" "}— Shona translation of &ldquo;{shonaTerm}&rdquo;
                  </span>
                )}
              </span>
              <button
                onClick={() => router.push("/shop")}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "var(--text-soft)",
                  lineHeight: 1,
                }}
                title="Clear search"
              >
                ✕
              </button>
            </div>
          )}

          {/* Non-Shona search label */}
          {urlQ && !isShona && (
            <div
              style={{
                marginBottom: "16px",
                padding: "8px 14px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                color: "var(--text-mid)",
              }}
            >
              <span>🔍</span>
              <span>
                Results for <strong>&ldquo;{urlQ}&rdquo;</strong>
              </span>
              <button
                onClick={() => router.push("/shop")}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "var(--text-soft)",
                  lineHeight: 1,
                }}
                title="Clear search"
              >
                ✕
              </button>
            </div>
          )}

          <div className="shop-toolbar">
            <span className="shop-count">
              {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
              {urlQ ? ` for "${urlQ}"` : ""}
            </span>
            <div className="shop-sort">
              <label
                htmlFor="sort-select"
                style={{ fontSize: "14px", color: "var(--text-soft)" }}
              >
                Sort:
              </label>
              <select className="sort-select" id="sort-select">
                <option value="relevance">Relevance</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low &rarr; High</option>
                <option value="price-desc">Price: High &rarr; Low</option>
                <option value="rating">Best Rated</option>
              </select>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="products-grid">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "64px 24px",
                color: "var(--text-soft)",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🔍</div>
              <h3
                style={{
                  fontFamily: "var(--font-h)",
                  fontSize: "1.4rem",
                  marginBottom: "8px",
                  color: "var(--text)",
                }}
              >
                No products found
              </h3>
              <p style={{ fontSize: "14px", marginBottom: "20px" }}>
                {urlQ
                  ? `We couldn't find anything matching "${urlQ}"${isShona && translatedQuery ? ` (searched for "${translatedQuery}")` : ""}. Try a different term.`
                  : "Try adjusting your filters."}
              </p>
              <button
                className="btn btn-navy btn-sm"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Wrap in Suspense because useSearchParams() requires it in Next.js App Router
export default function ShopPage() {
  return (
    <Suspense fallback={<ShopPageSkeleton />}>
      <ShopContent />
    </Suspense>
  );
}
