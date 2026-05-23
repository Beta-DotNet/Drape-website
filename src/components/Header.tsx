"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0); // This will be linked to global state later
  const [wishlistCount, setWishlistCount] = useState(0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/shop?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <header className="site-header" id="site-header">
      <div className="header-logo" style={{ cursor: "pointer" }}>
        <Link href="/">
          <img src="/images/Drape Logo.svg" alt="drape" />
        </Link>
      </div>

      <div className="header-search">
        <form onSubmit={handleSearch} style={{ display: "flex", width: "100%", alignItems: "center" }}>
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
          />
        </form>
        <button className="vs-trigger-btn" id="vs-trigger-btn" title="Visual search — search by photo" onClick={() => router.push('/visual-search')}>
          📷
        </button>
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
        <div className="icon-action" title="Profile" onClick={() => router.push('/profile')}>
          <img src="/images/mdi--account.svg" alt="Profile" />
          <span className="icon-label">Profile</span>
        </div>
        <div className="icon-action" id="wishlist-btn" title="Wishlist" onClick={() => router.push('/profile?tab=wishlist')}>
          <img src="/images/icon-park-outline--like.svg" alt="Wishlist" />
          <span className="icon-label">Saved</span>
          {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
        </div>
        <div className="icon-action" id="cart-trigger-btn" title="Cart">
          <img src="/images/mdi--cart-outline.svg" alt="Cart" />
          <span className="icon-label">Cart</span>
          {cartCount > 0 && <span className="badge">{cartCount}</span>}
        </div>
        <button className="btn-login" id="login-btn">Log In</button>
      </div>
    </header>
  );
}
