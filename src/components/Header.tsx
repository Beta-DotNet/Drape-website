"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import CartDrawer from "./CartDrawer";
import { useProductModal } from "./ProductModalContext";
import { clearStoredAuthSession, getStoredAuthSession } from "@/lib/auth-session";
import { getSearchSuggestions, SearchSuggestions } from "@/lib/search";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const authMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { openProductModal } = useProductModal();

  const profileMenuItems = [
    {
      label: "My Account",
      href: "/profile",
      description: "Manage your profile and size preferences.",
    },
    {
      label: "Orders",
      href: "/tracking",
      description: "Track deliveries and recent orders.",
    },
    {
      label: "Wishlist",
      href: "/shop",
      description: "Browse saved favorites and curated picks.",
    },
    {
      label: "Settings",
      href: "/profile",
      description: "Update account details and preferences.",
    },
    {
      label: "Help",
      href: "/footer/get-help",
      description: "Get support and answer FAQs.",
    },
  ];

  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(true);
  const [authLabel, setAuthLabel] = useState("Login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | undefined>(undefined);

  // Suggestions dropdown state
  const [suggestions, setSuggestions] = useState<SearchSuggestions | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Sync Cart quantity count
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const stored = localStorage.getItem("drape_cart") || "[]";
        const cart = JSON.parse(stored);
        const count = cart.reduce((acc: number, item: { quantity: number }) => acc + item.quantity, 0);
        setCartCount(count);
      } catch (err) {
        console.error("Failed to parse cart:", err);
      }
    };

    updateCartCount(); // Initial load
    window.addEventListener("cart_updated", updateCartCount);
    return () => {
      window.removeEventListener("cart_updated", updateCartCount);
    };
  }, []);

  useEffect(() => {
    const syncAuthState = () => {
      const session = getStoredAuthSession();
      setIsLoggedIn(Boolean(session));
      setAuthLabel(session?.username ? `Hi ${session.username}` : "Login");
      setAuthEmail(session?.email);
      if (!session) {
        setIsAuthMenuOpen(false);
      }
    };

    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("drape_auth_session_changed", syncAuthState as EventListener);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("drape_auth_session_changed", syncAuthState as EventListener);
    };
  }, []);

  useEffect(() => {
    const openCartDrawer = () => {
      setIsCartOpen(true);
    };

    window.addEventListener("open_cart_drawer", openCartDrawer);

    return () => {
      window.removeEventListener("open_cart_drawer", openCartDrawer);
    };
  }, []);

  // Debounced Auto-suggestions effect
  useEffect(() => {
    const trimmed = search.trim();
    const timer = setTimeout(async () => {
      if (trimmed.length < 2) {
        setSuggestions(null);
        setShowSuggestions(false);
        return;
      }
      try {
        const res = await getSearchSuggestions(trimmed);
        setSuggestions(res);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Suggestions error:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Click outside and Escape key to close suggestions dropdown and collapse search
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedInsideSearch = searchRef.current?.contains(target);
      const clickedInsideAuth = authMenuRef.current?.contains(target);

      if (!clickedInsideSearch && !clickedInsideAuth) {
        setShowSuggestions(false);
        setIsAuthMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSuggestions(false);
        setIsAuthMenuOpen(false);
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
      setIsSearchExpanded(false);
    }
  };

  const handleSearchTriggerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isSearchExpanded) {
      e.preventDefault();
      setIsSearchExpanded(true);
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  };

  const handleAuthButtonClick = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setIsAuthMenuOpen((current) => !current);
  };

  const handleCloseAuthMenu = () => {
    setIsAuthMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore sign-out service issues and clear the local UI session.
    }

    clearStoredAuthSession();
    handleCloseAuthMenu();
    router.push("/login");
  };

  const authMenuUsername = getStoredAuthSession()?.username || "User";
  const authMenuEmail = authEmail || "";
  const authAvatarInitial = authMenuUsername.charAt(0).toUpperCase() || "U";

  return (
    <header className="site-header" id="site-header">
      <div className="header-logo" style={{ cursor: "pointer" }}>
        <Link href="/">
          <Image src="/images/Drape Logo.svg" alt="drape" width={120} height={40} />
        </Link>
      </div>

      <div className="header-nav-wrap">
        <div
          className={`header-search header-search--center ${isSearchExpanded ? "is-expanded" : ""}`}
          ref={searchRef}
        >
          <form onSubmit={handleSearchSubmit}>
            <button
              type="submit"
              className="s-icon"
              id="search-submit-btn"
              aria-label="Search"
              onClick={handleSearchTriggerClick}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            <input
              ref={searchInputRef}
              type="text"
              id="search-input"
              aria-label="Search products and brands"
              placeholder="Search brands, styles, or try Shona…"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => {
                setIsSearchExpanded(true);
                if (search.trim().length >= 2) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={(e) => {
                const nextTarget = e.relatedTarget as Node | null;
                if (nextTarget && searchRef.current?.contains(nextTarget)) {
                  return;
                }
              }}
            />
          </form>
          <button
            className="vs-trigger-btn"
            id="vs-trigger-btn"
            title="Visual search — search by photo"
            aria-label="Visual search"
            onClick={() => router.push('/visual-search')}
          >
            <img src="/images/instagram-search-icon.svg" alt="" aria-hidden="true" style={{ width: 18, height: 18 }} />
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
                  <Image src="/images/material-symbols--star-rounded.svg" alt="" aria-hidden="true" width={16} height={16} />
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
                        <Image src={prod.images[0]} alt={prod.name} width={32} height={36} style={{ objectFit: "cover", borderRadius: "4px" }} unoptimized />
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

              {suggestions.categories.length === 0 && suggestions.products.length === 0 && (
                <div style={{ padding: "14px", fontSize: "13px", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
                  No matching categories or products found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="header-actions">
        <Link href="/shop" className="header-shop-btn" id="shop-header-btn" title="Shop products and filters">
          <span className="icon-label">Shop</span>
        </Link>
        <div className="icon-action" id="cart-trigger-btn" title="Cart" onClick={() => setIsCartOpen(true)}>
          <Image src="/images/mdi--cart-outline.svg" alt="Cart" width={24} height={24} />
          <span className="icon-label">Cart</span>
          {cartCount > 0 && <span className="badge" id="cart-badge">{cartCount}</span>}
        </div>
        <div className="header-auth-wrapper" ref={authMenuRef}>
          <button
            type="button"
            className="btn-login"
            id="login-btn"
            onClick={handleAuthButtonClick}
            aria-expanded={isLoggedIn ? isAuthMenuOpen : false}
            aria-haspopup="menu"
            aria-controls="header-user-menu"
          >
            {authLabel}
          </button>

          {isLoggedIn && isAuthMenuOpen ? (
            <div
              id="header-user-menu"
              className="header-auth-menu"
              role="menu"
              aria-label="User account menu"
            >
              <div className="header-auth-menu__summary">
                <div className="header-auth-avatar" aria-hidden="true">{authAvatarInitial}</div>
                <div>
                  <p className="header-auth-name">{authMenuUsername}</p>
                  {authMenuEmail ? (
                    <p className="header-auth-email">{authMenuEmail}</p>
                  ) : null}
                </div>
              </div>

              <div className="header-auth-menu__list" role="group" aria-label="Account navigation">
                {profileMenuItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="header-auth-link"
                    onClick={handleCloseAuthMenu}
                  >
                    <span className="header-auth-link__label">{item.label}</span>
                    <span className="header-auth-link__description">{item.description}</span>
                  </Link>
                ))}
              </div>

              <div className="header-auth-menu__footer">
                <button type="button" className="header-auth-logout" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}
