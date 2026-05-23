"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import CartDrawer from "./CartDrawer";
import { useProductModal } from "./ProductModalContext";
import { getSearchSuggestions, SearchSuggestions } from "@/lib/search";

export default function Header() {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const { openProductModal } = useProductModal();
  
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0); 
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Suggestions dropdown state
  const [suggestions, setSuggestions] = useState<SearchSuggestions | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Sync Cart quantity count
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const stored = localStorage.getItem("drape_cart") || "[]";
        const cart = JSON.parse(stored);
        const count = cart.reduce((acc: number, item: any) => acc + item.quantity, 0);
        setCartCount(count);
      } catch (err) {
        console.error("Failed to parse cart:", err);
      }
    };

    updateCartCount(); // Initial load
    window.addEventListener("cart_updated", updateCartCount);
    return () => window.removeEventListener("cart_updated", updateCartCount);
  }, []);

  // Debounced Auto-suggestions effect
  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed.length < 2) {
      setSuggestions(null);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await getSearchSuggestions(trimmed);
        setSuggestions(res);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Suggestions error:", err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [search]);

  // Click outside and Escape key to close suggestions dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/shop?q=${encodeURIComponent(search.trim())}`);
      setShowSuggestions(false);
    }
  };

  return (
    <header className="site-header" id="site-header">
      <div className="header-logo" style={{ cursor: "pointer" }}>
        <Link href="/">
          <img src="/images/Drape Logo.svg" alt="drape" />
        </Link>
      </div>

      <div className="header-search" ref={searchRef} style={{ position: "relative" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", width: "100%", alignItems: "center" }}>
          <button type="submit" className="s-icon" id="search-submit-btn" style={{ background: "transparent", border: "none" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
          <input
            type="text"
            id="search-input"
            placeholder="Search brands, styles, or try Shona (e.g., shangu)…"
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => {
              if (search.trim().length >= 2) {
                setShowSuggestions(true);
              }
            }}
          />
        </form>
        <button className="vs-trigger-btn" id="vs-trigger-btn" title="Visual search — search by photo" onClick={() => router.push('/visual-search')}>
          📷
        </button>

        {/* Floating Autocomplete Popover Dropdown */}
        {showSuggestions && suggestions && (
          <div 
            className="search-suggestions-dropdown"
            style={{ 
              position: "absolute", 
              top: "100%", 
              left: 0, 
              right: 0, 
              marginTop: "8px", 
              background: "rgba(15, 23, 42, 0.96)", 
              backdropFilter: "blur(12px)", 
              borderRadius: "12px", 
              border: "1px solid rgba(255, 255, 255, 0.15)", 
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)", 
              zIndex: 9999, 
              overflow: "hidden" 
            }}
          >
            {/* Shona Translation Alert Header */}
            {suggestions.translatedQuery && (
              <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(249, 211, 67, 0.12)", color: "var(--gold)", fontSize: "12px", display: "flex", gap: "6px", alignItems: "center", fontWeight: 600 }}>
                <span>✨</span>
                <span>Translating Shona: <strong>&ldquo;{suggestions.shonaTerm}&rdquo;</strong> &rarr; <strong>&ldquo;{suggestions.translatedQuery}&rdquo;</strong></span>
              </div>
            )}

            {/* Categories Suggestions */}
            {suggestions.categories.length > 0 && (
              <div style={{ padding: "12px 14px 6px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginBottom: "6px" }}>Categories</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {suggestions.categories.map((cat) => (
                    <div 
                      key={cat} 
                      onClick={() => {
                        router.push(`/shop?category=${cat}`);
                        setShowSuggestions(false);
                        setSearch("");
                      }}
                      style={{ fontSize: "13px", color: "#fff", cursor: "pointer", padding: "6px 8px", borderRadius: "6px", transition: "background 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      🔍 Shop in <strong>{cat}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Suggestions */}
            {suggestions.products.length > 0 && (
              <div style={{ padding: "12px 14px", borderTop: suggestions.categories.length > 0 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginBottom: "8px" }}>Products</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {suggestions.products.map((prod) => (
                    <div 
                      key={prod.id}
                      onClick={() => {
                        openProductModal(prod);
                        setShowSuggestions(false);
                        setSearch("");
                      }}
                      style={{ display: "flex", gap: "10px", alignItems: "center", cursor: "pointer", padding: "6px", borderRadius: "6px", transition: "background 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <img src={prod.images[0]} alt={prod.name} style={{ width: "32px", height: "36px", objectFit: "cover", borderRadius: "4px" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{prod.name}</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{prod.brand}</div>
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--gold)" }}>${prod.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No matches */}
            {suggestions.categories.length === 0 && suggestions.products.length === 0 && (
              <div style={{ padding: "14px", fontSize: "13px", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
                No matching categories or products found.
              </div>
            )}
          </div>
        )}
      </div>

      <nav className="header-nav">
        <Link href="/" id="nav-home">Home</Link>
        <Link href="/shop?gender=Men" id="nav-men">Men</Link>
        <Link href="/shop?gender=Women" id="nav-women">Women</Link>
        <Link href="/shop?category=Kids" id="nav-kids">Kids</Link>
        <Link href="/shop" id="nav-shop">All</Link>
        <Link href="/visual-search" id="nav-vs">🔍 Visual</Link>
        <Link href="/admin" id="nav-admin" className="admin-link">⚙ Admin</Link>
      </nav>

      <div className="header-actions">
        <div className="icon-action" onClick={() => router.push("/profile")} title="Profile">
          <img src="/images/mdi--account.svg" alt="Profile" />
          <span className="icon-label">Profile</span>
        </div>
        <div className="icon-action" id="wishlist-btn" title="Wishlist">
          <img src="/images/icon-park-outline--like.svg" alt="Wishlist" />
          <span className="icon-label">Saved</span>
          {wishlistCount > 0 && <span className="badge" id="wishlist-badge">{wishlistCount}</span>}
        </div>
        <div className="icon-action" id="cart-trigger-btn" title="Cart" onClick={() => setIsCartOpen(true)}>
          <img src="/images/mdi--cart-outline.svg" alt="Cart" />
          <span className="icon-label">Cart</span>
          {cartCount > 0 && <span className="badge" id="cart-badge">{cartCount}</span>}
        </div>
        <button className="btn-login" id="login-btn">Log In</button>
      </div>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}
