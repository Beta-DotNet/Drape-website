"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  authLabel: string;
  cartCount: number;
  onCartOpen: () => void;
  onAuthClick: () => void;
}

export default function MobileMenu({
  isOpen,
  onClose,
  isLoggedIn,
  authLabel,
  cartCount,
  onCartOpen,
  onAuthClick,
}: MobileMenuProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/shop?q=${encodeURIComponent(search.trim())}`);
      setSearch("");
      onClose();
    }
  };

  const handleNavClick = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="mobile-menu-overlay" role="dialog" aria-modal="true" aria-label="Navigation menu">
      {/* Backdrop */}
      <div className="mobile-menu-backdrop" onClick={onClose} />

      {/* Slide-in panel */}
      <nav className="mobile-menu-panel">
        {/* Header */}
        <div className="mobile-menu-header">
          <Link href="/" onClick={onClose}>
            <Image src="/images/Drape Logo.svg" alt="drape" width={100} height={34} priority />
          </Link>
          <button
            className="mobile-menu-close"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="mobile-menu-search">
          <form onSubmit={handleSearchSubmit}>
            <button type="submit" aria-label="Search" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brands, styles…"
              autoComplete="off"
              id="mobile-search-input"
            />
          </form>
        </div>

        {/* Nav links */}
        <div className="mobile-menu-nav">
          <button
            className="mobile-nav-link"
            onClick={() => handleNavClick("/")}
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
          >
            <span className="mobile-nav-link-icon">🏠</span>
            Home
          </button>

          <button
            className="mobile-nav-link"
            onClick={() => handleNavClick("/shop")}
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
          >
            <span className="mobile-nav-link-icon">🛍️</span>
            Shop
          </button>

          <button
            className="mobile-nav-link"
            onClick={() => { onCartOpen(); onClose(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
          >
            <span className="mobile-nav-link-icon">🛒</span>
            Cart{cartCount > 0 && ` (${cartCount})`}
          </button>

          <button
            className="mobile-nav-link"
            onClick={() => handleNavClick("/tracking")}
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
          >
            <span className="mobile-nav-link-icon">📦</span>
            Track Order
          </button>

          <button
            className="mobile-nav-link"
            onClick={() => handleNavClick("/visual-search")}
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
          >
            <span className="mobile-nav-link-icon">📷</span>
            Visual Search
          </button>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />

          <button
            className="mobile-nav-link"
            onClick={() => handleNavClick("/profile")}
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
          >
            <span className="mobile-nav-link-icon">👤</span>
            {isLoggedIn ? authLabel : "My Account"}
          </button>
        </div>

        {/* Footer CTA */}
        <div className="mobile-menu-footer">
          {!isLoggedIn ? (
            <button
              className="btn btn-gold btn-block"
              onClick={() => { onAuthClick(); onClose(); }}
              id="mobile-login-btn"
            >
              Login / Sign Up
            </button>
          ) : (
            <Link
              href="/profile"
              className="btn btn-outline btn-block"
              onClick={onClose}
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
            >
              View Profile
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
