import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="footer-logo">
            <img src="/images/Drape Logo Blue.svg" alt="drape" />
          </div>
          <p>
            Africa's premier AI-powered fashion marketplace. Shop with
            confidence — your perfect size, every time.
          </p>
          <ul className="footer-links">
            <li><Link href="#">About Us</Link></li>
            <li><Link href="#">Partner Boutiques</Link></li>
            <li><Link href="#">Careers</Link></li>
            <li><Link href="#">drape Mobile App</Link></li>
            <li><Link href="#">Advertising</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h3>Help &amp; Support</h3>
          <ul>
            <li><Link href="#">Get Help</Link></li>
            <li><Link href="#">Order Status</Link></li>
            <li><Link href="#">Delivery</Link></li>
            <li><Link href="#">Payment Options</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h3>Customer Care</h3>
          <ul>
            <li><Link href="#">Contact Us</Link></li>
            <li><Link href="#">FAQs</Link></li>
            <li><Link href="#">Orders &amp; Deliveries</Link></li>
            <li><Link href="#">Returns &amp; Refunds</Link></li>
            <li><Link href="#">Terms &amp; Conditions</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <div className="footer-country">
            <div className="country-icon">
              <img src="/images/basil--location-outline.svg" alt="" />
            </div>
            <div className="country-label">Zimbabwe</div>
          </div>
          <div className="footer-social" style={{ marginTop: "24px", justifyContent: "flex-end" }}>
            <Link href="#"><img src="/images/mdi--instagram.svg" alt="Instagram" /></Link>
            <Link href="#"><img src="/images/prime--twitter.svg" alt="Twitter" /></Link>
            <Link href="#"><img src="/images/line-md--linkedin.svg" alt="LinkedIn" /></Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 drape, Inc. All rights reserved.</p>
        <div className="footer-legal">
          <Link href="#">Terms of Sale</Link>
          <Link href="#">Privacy Settings</Link>
        </div>
      </div>
    </footer>
  );
}
