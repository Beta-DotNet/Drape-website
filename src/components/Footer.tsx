"use client";

import Link from "next/link";
import { useState } from "react";

function FooterAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="footer-col">
      {/* Desktop heading */}
      <h3>{title}</h3>
      {/* Mobile accordion toggle */}
      <button
        className={`footer-accordion-header ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {title}
        <span className="footer-accordion-arrow">▾</span>
      </button>
      {/* Content — always visible on desktop, toggled on mobile */}
      <div className={`footer-accordion-body ${isOpen ? 'open' : ''}`}>
        <ul style={{ paddingTop: '8px', paddingBottom: '8px' }}>
          {children}
        </ul>
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        {/* Brand column — always expanded */}
        <div className="footer-brand">
          <div className="footer-logo">
            <img src="/images/Drape Logo Blue.svg" alt="drape" />
          </div>
          <p>
            Africa&apos;s premier AI-powered fashion marketplace. Shop with
            confidence — your perfect size, every time.
          </p>
          <ul className="footer-links">
            <li><Link href="/footer/about-us">About Us</Link></li>
            <li><Link href="/footer/partner-boutiques">Partner Boutiques</Link></li>
            <li><Link href="/footer/careers">Careers</Link></li>
            <li><Link href="/footer/mobile-app">drape Mobile App</Link></li>
            <li><Link href="/footer/advertising">Advertising</Link></li>
            <li><Link href="/footer/help-support">Help &amp; Support</Link></li>
          </ul>
        </div>

        <FooterAccordion title="Help &amp; Support">
          <li><Link href="/footer/get-help">Get Help</Link></li>
          <li><Link href="/footer/order-status">Order Status</Link></li>
          <li><Link href="/footer/delivery">Delivery</Link></li>
          <li><Link href="/footer/payment-options">Payment Options</Link></li>
        </FooterAccordion>

        <FooterAccordion title="Customer Care">
          <li><Link href="/footer/contact-us">Contact Us</Link></li>
          <li><Link href="/footer/faqs">FAQs</Link></li>
          <li><Link href="/footer/orders-deliveries">Orders &amp; Deliveries</Link></li>
          <li><Link href="/footer/returns-refunds">Returns &amp; Refunds</Link></li>
          <li><Link href="/footer/terms-conditions">Terms &amp; Conditions</Link></li>
        </FooterAccordion>

        <div className="footer-col">
          <div className="footer-country">
            <div className="country-icon">
              <img src="/images/basil--location-outline.svg" alt="" />
            </div>
            <div className="country-label">Zimbabwe</div>
          </div>
          <div className="footer-social" style={{ marginTop: '24px', justifyContent: 'flex-end' }}>
            <Link href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram">
              <img src="/images/mdi--instagram.svg" alt="Instagram" />
            </Link>
            <Link href="https://x.com/" target="_blank" rel="noreferrer" aria-label="Twitter/X">
              <img src="/images/prime--twitter.svg" alt="Twitter" />
            </Link>
            <Link href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <img src="/images/line-md--linkedin.svg" alt="LinkedIn" />
            </Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 drape, Inc. All rights reserved.</p>
        <div className="footer-legal">
          <Link href="/footer/terms-of-sale">Terms of Sale</Link>
          <Link href="/footer/privacy-settings">Privacy Settings</Link>
        </div>
      </div>
    </footer>
  );
}
