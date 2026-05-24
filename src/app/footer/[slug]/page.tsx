import Link from "next/link";
import { notFound } from "next/navigation";

const styleCard = {
  background: "var(--white)",
  borderRadius: 24,
  border: "1px solid var(--border)",
  boxShadow: "var(--sh-sm)",
  padding: 24,
};

const styleGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 20,
};

const footerSlugs = [
  "about-us",
  "partner-boutiques",
  "careers",
  "mobile-app",
  "advertising",
  "help-support",
  "get-help",
  "order-status",
  "delivery",
  "payment-options",
  "customer-care",
  "contact-us",
  "faqs",
  "orders-deliveries",
  "returns-refunds",
  "terms-conditions",
  "terms-of-sale",
  "privacy-settings",
];

const supportEmail = "support@drape.com";

function ActionButton({ href, label, variant = "primary" }: { href: string; label: string; variant?: "primary" | "secondary" }) {
  return (
    <Link
      href={href}
      className={`btn ${variant === "primary" ? "btn-primary" : "btn-outline"}`}
      style={{ width: "fit-content" }}
    >
      {label}
    </Link>
  );
}

function SectionBlock({ title, body }: { title: string; body: string[] }) {
  return (
    <article style={styleCard}>
      <p
        style={{
          fontFamily: "var(--font-h)",
          fontSize: 12,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--text-soft)",
          marginBottom: 12,
          fontWeight: 800,
        }}
      >
        {title}
      </p>
      <ul style={{ display: "grid", gap: 10, color: "var(--text-mid)", paddingLeft: 18 }}>
        {body.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

export async function generateStaticParams() {
  return footerSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const titles: Record<string, string> = {
    "about-us": "About Us",
    "partner-boutiques": "Partner Boutiques",
    "careers": "Careers",
    "mobile-app": "drape Mobile App",
    advertising: "Advertising",
    "help-support": "Help & Support",
    "get-help": "Get Help",
    "order-status": "Order Status",
    delivery: "Delivery",
    "payment-options": "Payment Options",
    "customer-care": "Customer Care",
    "contact-us": "Contact Us",
    faqs: "FAQs",
    "orders-deliveries": "Orders & Deliveries",
    "returns-refunds": "Returns & Refunds",
    "terms-conditions": "Terms & Conditions",
    "terms-of-sale": "Terms of Sale",
    "privacy-settings": "Privacy Settings",
  };

  return {
    title: `${titles[slug] ?? "Page"} | drape`,
  };
}

export default async function FooterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const helpLinks = [
    { label: "Get Help", href: "/footer/get-help" },
    { label: "Order Status", href: "/footer/order-status" },
    { label: "Delivery", href: "/footer/delivery" },
    { label: "Payment Options", href: "/footer/payment-options" },
    { label: "Customer Care", href: "/footer/customer-care" },
    { label: "Contact Us", href: "/footer/contact-us" },
    { label: "FAQs", href: "/footer/faqs" },
    { label: "Orders & Deliveries", href: "/footer/orders-deliveries" },
    { label: "Returns & Refunds", href: "/footer/returns-refunds" },
    { label: "Terms & Conditions", href: "/footer/terms-conditions" },
  ];

  if (!footerSlugs.includes(slug)) {
    notFound();
  }

  return (
    <main style={{ background: "var(--bg)", padding: "32px 0 72px" }}>
      <div className="container" style={{ display: "grid", gap: 24 }}>
        <section
          style={{
            background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)",
            borderRadius: 28,
            padding: "clamp(24px, 3vw, 36px)",
            color: "#fff",
            boxShadow: "var(--sh-lg)",
          }}
        >
          <p
            style={{
              color: "var(--gold)",
              fontFamily: "var(--font-h)",
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              marginBottom: 10,
              fontWeight: 800,
            }}
          >
            drape help center
          </p>

          {slug === "about-us" && (
            <>
              <h1 style={{ fontSize: "clamp(2.1rem, 4vw, 2.9rem)", lineHeight: 1.05, marginBottom: 14 }}>
                About drape and the way we shop.
              </h1>
              <p style={{ fontSize: 16, maxWidth: 780, color: "rgba(255,255,255,.92)", marginBottom: 22 }}>
                We started drape to make fashion shopping simpler, more inclusive, and more sustainable. Our customers can discover curated looks, get clearer fit guidance, and enjoy fast delivery and easy returns without the usual friction.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ActionButton href="/footer/help-support" label="Explore support" />
                <ActionButton href="/shop" label="Shop the latest drops" variant="secondary" />
              </div>
            </>
          )}

          {slug === "partner-boutiques" && (
            <>
              <h1 style={{ fontSize: "clamp(2.1rem, 4vw, 2.9rem)", lineHeight: 1.05, marginBottom: 14 }}>
                Grow your boutique with a trusted fashion marketplace.
              </h1>
              <p style={{ fontSize: 16, maxWidth: 780, color: "rgba(255,255,255,.92)", marginBottom: 22 }}>
                drape helps independent boutiques reach shoppers who care about style, quality, and sustainable fashion. We make onboarding simple, support merchandising, and give you the tools to manage visibility and customer confidence.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ActionButton href="#partner-form" label="Become a partner" />
                <ActionButton href="/footer/help-support" label="See support options" variant="secondary" />
              </div>
            </>
          )}

          {slug === "careers" && (
            <>
              <h1 style={{ fontSize: "clamp(2.1rem, 4vw, 2.9rem)", lineHeight: 1.05, marginBottom: 14 }}>
                Build the future of fashion commerce with drape.
              </h1>
              <p style={{ fontSize: 16, maxWidth: 780, color: "rgba(255,255,255,.92)", marginBottom: 22 }}>
                Join a team that values design, customer obsession, and practical innovation. We’re building better tools for fashion discovery, faster delivery, and a more thoughtful shopping experience.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ActionButton href="#open-roles" label="View open roles" />
                <ActionButton href={`mailto:${supportEmail}`} label="Send your CV" variant="secondary" />
              </div>
            </>
          )}

          {slug === "mobile-app" && (
            <>
              <h1 style={{ fontSize: "clamp(2.1rem, 4vw, 2.9rem)", lineHeight: 1.05, marginBottom: 14 }}>
                Shop smarter with the drape mobile app.
              </h1>
              <p style={{ fontSize: 16, maxWidth: 780, color: "rgba(255,255,255,.92)", marginBottom: 22 }}>
                Get exclusive discounts, early access to new drops, live order updates, and smarter search from your phone. Your wishlist, size preferences, and checkout flow stay in sync wherever you shop.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ActionButton href="#download-links" label="Download now" />
                <ActionButton href="/footer/help-support" label="Browse support" variant="secondary" />
              </div>
            </>
          )}

          {slug === "advertising" && (
            <>
              <h1 style={{ fontSize: "clamp(2.1rem, 4vw, 2.9rem)", lineHeight: 1.05, marginBottom: 14 }}>
                Reach fashion shoppers with campaigns that feel premium and relevant.
              </h1>
              <p style={{ fontSize: 16, maxWidth: 780, color: "rgba(255,255,255,.92)", marginBottom: 22 }}>
                drape partners with brands that want to connect with customers searching for modern essentials, sustainable fashion, and confident buying decisions. From sponsored posts to newsletters, we help your story land in the right moments.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ActionButton href="#rate-card-form" label="Request a rate card" />
                <ActionButton href="/footer/contact-us" label="Contact the team" variant="secondary" />
              </div>
            </>
          )}

          {slug === "help-support" && (
            <>
              <h1 style={{ fontSize: "clamp(2.1rem, 4vw, 2.9rem)", lineHeight: 1.05, marginBottom: 14 }}>
                One help center for every part of the shopping journey.
              </h1>
              <p style={{ fontSize: 16, maxWidth: 780, color: "rgba(255,255,255,.92)", marginBottom: 22 }}>
                Search for a topic or jump straight to the help page you need. Our support pages are designed to make order updates, returns, shipping, and payments easier to understand.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <ActionButton href="/footer/get-help" label="Start a support request" />
                <ActionButton href="/footer/faqs" label="Read FAQs" variant="secondary" />
              </div>
            </>
          )}

          {slug === "get-help" && (
            <>
              <h1 style={{ fontSize: "clamp(2.1rem, 4vw, 2.9rem)", lineHeight: 1.05, marginBottom: 14 }}>
                Tell us what’s happening and we’ll help you resolve it quickly.
              </h1>
              <p style={{ fontSize: 16, maxWidth: 780, color: "rgba(255,255,255,.92)", marginBottom: 22 }}>
                Whether it’s a delivery question, payment concern, or return request, we aim to reply within 24 hours. Use the FAQs to check for a quick answer before you submit.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ActionButton href="/footer/faqs" label="Check the FAQs" />
                <ActionButton href="/footer/help-support" label="Back to help hub" variant="secondary" />
              </div>
            </>
          )}

          {slug === "order-status" && (
            <>
              <h1 style={{ fontSize: "clamp(2.1rem, 4vw, 2.9rem)", lineHeight: 1.05, marginBottom: 14 }}>
                Keep track of every order update from checkout to delivery.
              </h1>
              <p style={{ fontSize: 16, maxWidth: 780, color: "rgba(255,255,255,.92)", marginBottom: 22 }}>
                Use your order number and email or phone to quickly check whether an order is confirmed, packed, shipped, or delivered.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ActionButton href="/footer/delivery" label="Review delivery options" />
                <ActionButton href="/footer/help-support" label="Help hub" variant="secondary" />
              </div>
            </>
          )}

          {slug === "delivery" && (
            <>
              <h1 style={{ fontSize: "clamp(2.1rem, 4vw, 2.9rem)", lineHeight: 1.05, marginBottom: 14 }}>
                Delivery options that are clear, fast, and easy to follow.
              </h1>
              <p style={{ fontSize: 16, maxWidth: 780, color: "rgba(255,255,255,.92)", marginBottom: 22 }}>
                We make shipping simple with standard and express options, transparent costs, and updates that keep customers informed throughout the journey.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ActionButton href="/footer/order-status" label="Track an order" />
                <ActionButton href="/footer/payment-options" label="Explore payment options" variant="secondary" />
              </div>
            </>
          )}

          {slug === "payment-options" && (
            <>
              <h1 style={{ fontSize: "clamp(2.1rem, 4vw, 2.9rem)", lineHeight: 1.05, marginBottom: 14 }}>
                Secure checkout with flexible payment choices.
              </h1>
              <p style={{ fontSize: 16, maxWidth: 780, color: "rgba(255,255,255,.92)", marginBottom: 22 }}>
                drape supports multiple ways to pay, from cards and PayPal to buy now, pay later options and gift cards. Every checkout is protected with secure payment handling.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ActionButton href="/shop" label="Return to shop" />
                <ActionButton href="/footer/help-support" label="Support center" variant="secondary" />
              </div>
            </>
          )}

          {slug === "customer-care" && (
            <>
              <h1 style={{ fontSize: "clamp(2.1rem, 4vw, 2.9rem)", lineHeight: 1.05, marginBottom: 14 }}>
                Friendly support when you need a quick answer or a human handoff.
              </h1>
              <p style={{ fontSize: 16, maxWidth: 780, color: "rgba(255,255,255,.92)", marginBottom: 22 }}>
                Our customer care team gives clear guidance on delivery, returns, and account questions, with escalation support for more complex issues.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ActionButton href="/footer/get-help" label="Contact support" />
                <ActionButton href="/footer/faqs" label="Browse FAQs" variant="secondary" />
              </div>
            </>
          )}

          {slug === "contact-us" && (
            <>
              <h1 style={{ fontSize: "clamp(2.1rem, 4vw, 2.9rem)", lineHeight: 1.05, marginBottom: 14 }}>
                Reach the drape team by email, phone, or live chat.
              </h1>
              <p style={{ fontSize: 16, maxWidth: 780, color: "rgba(255,255,255,.92)", marginBottom: 22 }}>
                From brand partnerships to customer questions, the drape team is here to help with practical, timely responses. Share your request and we’ll route it to the right person.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ActionButton href={`mailto:${supportEmail}`} label="Email support" />
                <ActionButton href="/footer/get-help" label="Open help request" variant="secondary" />
              </div>
            </>
          )}

          {slug === "faqs" && (
            <>
              <h1 style={{ fontSize: "clamp(2.1rem, 4vw, 2.9rem)", lineHeight: 1.05, marginBottom: 14 }}>
                Answers designed to help shoppers move forward with confidence.
              </h1>
              <p style={{ fontSize: 16, maxWidth: 780, color: "rgba(255,255,255,.92)", marginBottom: 22 }}>
                We cover common questions about sizing, orders, payment, delivery, returns, and account support so customers can find the answer quickly.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ActionButton href="/footer/help-support" label="Visit help hub" />
                <ActionButton href="/footer/order-status" label="Check an order" variant="secondary" />
              </div>
            </>
          )}

          {slug === "orders-deliveries" && (
            <>
              <h1 style={{ fontSize: "clamp(2.1rem, 4vw, 2.9rem)", lineHeight: 1.05, marginBottom: 14 }}>
                Understand the order journey from checkout to the doorstep.
              </h1>
              <p style={{ fontSize: 16, maxWidth: 780, color: "rgba(255,255,255,.92)", marginBottom: 22 }}>
                No matter how you shop, drape keeps each step of the journey clear: confirmation, packing, shipping, and delivery updates that help customers stay informed.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ActionButton href="/footer/order-status" label="Track an order" />
                <ActionButton href="/footer/delivery" label="Review delivery details" variant="secondary" />
              </div>
            </>
          )}

          {slug === "returns-refunds" && (
            <>
              <h1 style={{ fontSize: "clamp(2.1rem, 4vw, 2.9rem)", lineHeight: 1.05, marginBottom: 14 }}>
                Returns and refunds that are simple, transparent, and supportive.
              </h1>
              <p style={{ fontSize: 16, maxWidth: 780, color: "rgba(255,255,255,.92)", marginBottom: 22 }}>
                Customers can review the return window, start a request, and understand when refunds are processed. We aim to make every step easy to follow.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ActionButton href="/footer/get-help" label="Get help now" />
                <ActionButton href="/footer/faqs" label="Read FAQs" variant="secondary" />
              </div>
            </>
          )}

          {slug === "terms-conditions" && (
            <>
              <h1 style={{ fontSize: "clamp(2.1rem, 4vw, 2.9rem)", lineHeight: 1.05, marginBottom: 14 }}>
                Clear terms for a safe and transparent shopping experience.
              </h1>
              <p style={{ fontSize: 16, maxWidth: 780, color: "rgba(255,255,255,.92)", marginBottom: 22 }}>
                These terms explain eligibility, pricing, payment, shipping, returns, privacy, and liability. They are written to help customers understand the shopping process clearly.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ActionButton href="/footer/privacy-settings" label="Review privacy settings" />
                <ActionButton href="/footer/help-support" label="Return to help hub" variant="secondary" />
              </div>
            </>
          )}

          {slug === "terms-of-sale" && (
            <>
              <h1 style={{ fontSize: "clamp(2.1rem, 4vw, 2.9rem)", lineHeight: 1.05, marginBottom: 14 }}>
                Purchase terms that are easy to understand and simple to follow.
              </h1>
              <p style={{ fontSize: 16, maxWidth: 780, color: "rgba(255,255,255,.92)", marginBottom: 22 }}>
                This page summarises how orders are confirmed, when prices may change, and how customers should manage delivery details and return requests.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ActionButton href="/footer/terms-conditions" label="Read full terms" />
                <ActionButton href="/footer/help-support" label="Support center" variant="secondary" />
              </div>
            </>
          )}

          {slug === "privacy-settings" && (
            <>
              <h1 style={{ fontSize: "clamp(2.1rem, 4vw, 2.9rem)", lineHeight: 1.05, marginBottom: 14 }}>
                Privacy settings and data preferences you can review at any time.
              </h1>
              <p style={{ fontSize: 16, maxWidth: 780, color: "rgba(255,255,255,.92)", marginBottom: 22 }}>
                We keep customer data handling transparent and helpful. This page outlines the key information customers may want to review about account data, preferences, and support.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ActionButton href="/footer/terms-conditions" label="Review terms" />
                <ActionButton href="/footer/help-support" label="Help hub" variant="secondary" />
              </div>
            </>
          )}
        </section>

        {slug === "about-us" && (
          <>
            <section style={styleCard}>
              <h2 style={{ fontFamily: "var(--font-h)", fontSize: 24, marginBottom: 12 }}>Why we started</h2>
              <p style={{ color: "var(--text-mid)", marginBottom: 16 }}>
                We built drape to remove the uncertainty from fashion shopping. Customers can explore a curated marketplace, use AI-powered size guidance, and make confident choices with clearer product information and dependable delivery.
              </p>
              <div style={{ ...styleGrid, marginTop: 16 }}>
                <SectionBlock title="Quality" body={["Premium fabrics, thoughtful design, and pieces built to last.", "Transparent product details that make it easier to compare styles quickly."]} />
                <SectionBlock title="Customer obsession" body={["Clear sizing help, fast delivery, and easy returns shaped around the customer journey.", "Support that is helpful before, during, and after the purchase."]} />
                <SectionBlock title="Community" body={["Partnerships with boutique owners, creators, and local fashion voices.", "A marketplace that puts independent style and sustainable fashion at the center."]} />
              </div>
            </section>
            <section style={{ ...styleCard, background: "linear-gradient(180deg, rgba(249,211,67,.18), rgba(255,255,255,1))" }}>
              <h2 style={{ fontFamily: "var(--font-h)", fontSize: 24, marginBottom: 12 }}>Join our journey</h2>
              <p style={{ color: "var(--text-mid)", marginBottom: 16 }}>
                Whether you are discovering pieces for your wardrobe or looking to partner with drape, we are building a fashion experience that feels modern, helpful, and human.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ActionButton href="/footer/partner-boutiques" label="Become a partner" />
                <ActionButton href="/footer/careers" label="Explore careers" variant="secondary" />
              </div>
            </section>
          </>
        )}

        {slug === "partner-boutiques" && (
          <>
            <section style={styleCard}>
              <h2 style={{ fontFamily: "var(--font-h)", fontSize: 24, marginBottom: 12 }}>What you can expect</h2>
              <div style={styleGrid}>
                <SectionBlock title="Wider reach" body={["Showcase your products to shoppers actively searching for modern, sustainable fashion.", "Use drape’s discovery tools to surface new collections and bestsellers."]} />
                <SectionBlock title="Easy onboarding" body={["A guided setup process helps your boutique go live quickly.", "Product and pricing fields are streamlined so your catalog stays easy to manage."]} />
                <SectionBlock title="Dedicated support" body={["Get help with merchandising, promotions, delivery updates, and customer queries.", "A support team that helps you solve problems before they become friction points."]} />
              </div>
            </section>
            <section style={styleCard} id="partner-form">
              <h2 style={{ fontFamily: "var(--font-h)", fontSize: 24, marginBottom: 8 }}>Partner application</h2>
              <p style={{ color: "var(--text-mid)", marginBottom: 18 }}>
                Share your boutique details and we’ll follow up with the next steps for onboarding and launch support.
              </p>
              <form className="manual-form">
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Boutique name</label><input className="form-input" placeholder="e.g. Atelier North" /></div>
                  <div className="form-group"><label className="form-label">Owner name</label><input className="form-input" placeholder="e.g. Priya Moyo" /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" placeholder="owner@boutique.com" /></div>
                  <div className="form-group"><label className="form-label">Phone</label><input type="tel" className="form-input" placeholder="[Support Phone]" /></div>
                </div>
                <div className="form-group"><label className="form-label">Your story</label><textarea className="form-input" rows={5} placeholder="Tell us about your style, product mix, and what you would like to achieve on drape." /></div>
                <p style={{ color: "var(--text-soft)", fontSize: 14 }}>The form is ready for integration. JavaScript can validate required fields and show a confirmation message after submission.</p>
                <button type="button" className="btn btn-primary">Request partnership</button>
              </form>
            </section>
            <section style={styleCard}>
              <h2 style={{ fontFamily: "var(--font-h)", fontSize: 24, marginBottom: 12 }}>Partner FAQ</h2>
              <div style={{ display: "grid", gap: 12 }}>
                {[
                  ["Commission", "Commission rates are tailored by category and sales volume, with clear guidance shared during onboarding."],
                  ["Shipping", "Partners can use their preferred workflow or follow drape’s recommended shipping process for consistent customer updates."],
                  ["Returns", "Returns are handled in line with our easy returns policy, with support available for exchange and refund questions."],
                  ["Launch timeline", "Most boutique applications move through onboarding in a few business days, depending on product readiness and documentation."],
                ].map(([q, a]) => (
                  <details key={q} style={{ background: "var(--bg)", borderRadius: 16, padding: "14px 16px" }}>
                    <summary style={{ fontWeight: 700, cursor: "pointer" }}>{q}</summary>
                    <p style={{ marginTop: 10, color: "var(--text-mid)" }}>{a}</p>
                  </details>
                ))}
              </div>
            </section>
          </>
        )}

        {slug === "careers" && (
          <section style={styleCard}>
            <h2 style={{ fontFamily: "var(--font-h)", fontSize: 24, marginBottom: 12 }} id="open-roles">Open roles</h2>
            <div style={styleGrid}>
              <SectionBlock title="Frontend Developer" body={["Build fast, polished storefront experiences and improve how shoppers discover products.", "Strong focus on performance, accessibility, and design consistency."]} />
              <SectionBlock title="Fashion Stylist" body={["Create styling recommendations, seasonal campaign concepts, and helpful inspiration for shoppers.", "Ideal for someone who understands trends and customer-facing storytelling."]} />
              <SectionBlock title="Logistics Coordinator" body={["Support fast delivery operations, partner communication, and issue resolution.", "Great for someone who enjoys keeping complex journeys organized and calm."]} />
              <SectionBlock title="Customer Experience Specialist" body={["Help customers with order questions, returns, and payment concerns.", "Excellent written communication and empathy are key."]} />
            </div>
            <p style={{ color: "var(--text-mid)", marginTop: 16 }}>
              Equal opportunity statement: drape welcomes applicants from all backgrounds and is committed to building an inclusive workplace.
            </p>
          </section>
        )}

        {slug === "mobile-app" && (
          <>
            <section style={styleCard}>
              <h2 style={{ fontFamily: "var(--font-h)", fontSize: 24, marginBottom: 12 }}>App benefits</h2>
              <div style={styleGrid}>
                <SectionBlock title="Exclusive perks" body={["Early access to new drops and member-only offers.", "Exclusive promotions for app users who want to save while shopping."]} />
                <SectionBlock title="Smarter shopping" body={["Wishlist sync across devices, instant product discovery, and one-tap checkout.", "Live order tracking and delivery alerts keep every step visible."]} />
              </div>
            </section>
            <section style={styleCard} id="download-links">
              <h2 style={{ fontFamily: "var(--font-h)", fontSize: 24, marginBottom: 12 }}>Download links</h2>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                <ActionButton href="https://apps.apple.com/us/app/apple-store/id375380948" label="App Store" />
                <ActionButton href="https://play.google.com/store/apps" label="Google Play" variant="secondary" />
              </div>
              <div style={{ background: "var(--bg)", borderRadius: 20, padding: 20, display: "inline-block" }}>
                <p style={{ fontWeight: 700, marginBottom: 8 }}>QR code placeholder</p>
                <div style={{ width: 140, height: 140, border: "2px dashed var(--border-mid)", display: "grid", placeItems: "center", color: "var(--text-soft)" }}>
                  [QR Code Placeholder]
                </div>
              </div>
            </section>
          </>
        )}

        {slug === "advertising" && (
          <>
            <section style={styleCard}>
              <h2 style={{ fontFamily: "var(--font-h)", fontSize: 24, marginBottom: 12 }}>Media kit overview</h2>
              <div style={styleGrid}>
                <SectionBlock title="Audience" body={["Style-conscious shoppers looking for modern basics, sustainable fashion, and trustworthy brands.", "Customers who respond well to curated promotions and seasonal launches."]} />
                <SectionBlock title="Formats" body={["Homepage banner placements, sponsored posts, newsletter features, and campaign integrations.", "Flexible support for launches, product drops, and trend-led moments."]} />
              </div>
            </section>
            <section style={styleCard} id="rate-card-form">
              <h2 style={{ fontFamily: "var(--font-h)", fontSize: 24, marginBottom: 12 }}>Request a rate card</h2>
              <form className="manual-form">
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Name</label><input className="form-input" placeholder="e.g. Jordan Lee" /></div>
                  <div className="form-group"><label className="form-label">Brand</label><input className="form-input" placeholder="Brand or agency name" /></div>
                </div>
                <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" placeholder="brand@company.com" /></div>
                <button type="button" className="btn btn-primary">Send request</button>
              </form>
            </section>
            <section style={styleCard}>
              <h2 style={{ fontFamily: "var(--font-h)", fontSize: 24, marginBottom: 12 }}>Success stories</h2>
              <div style={styleGrid}>
                <blockquote style={{ ...styleCard, margin: 0 }}>
                  “drape helped us increase visibility for a limited-edition drop while keeping the campaign experience elegant and easy to manage.”
                </blockquote>
                <blockquote style={{ ...styleCard, margin: 0 }}>
                  “The audience quality was strong, and the campaign format made it easy to align our message with the right customer moment.”
                </blockquote>
              </div>
            </section>
          </>
        )}

        {slug === "help-support" && (
          <section style={styleCard}>
            <h2 style={{ fontFamily: "var(--font-h)", fontSize: 24, marginBottom: 12 }}>Popular support paths</h2>
            <div style={{ ...styleGrid, marginTop: 12 }}>
              {helpLinks.map((item) => (
                <Link key={item.href} href={item.href} style={{ ...styleCard, color: "var(--navy)", fontWeight: 700, display: "block", textDecoration: "none" }}>
                  {item.label}
                </Link>
              ))}
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <ActionButton href="/footer/get-help" label="Live chat" />
              <ActionButton href={`mailto:${supportEmail}`} label="Email support" variant="secondary" />
            </div>
          </section>
        )}

        {slug === "get-help" && (
          <section style={styleCard}>
            <form className="manual-form">
              <div className="form-row">
                <div className="form-group"><label className="form-label">Order number</label><input className="form-input" placeholder="Optional if you know it" /></div>
                <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" placeholder="you@example.com" /></div>
              </div>
              <div className="form-group"><label className="form-label">Issue type</label><select className="form-select"><option>Order issue</option><option>Delivery issue</option><option>Payment issue</option><option>Returns and refunds</option><option>Account issue</option><option>Product question</option></select></div>
              <div className="form-group"><label className="form-label">Message</label><textarea className="form-input" rows={6} placeholder="Tell us what happened and what help you need." /></div>
              <p style={{ color: "var(--text-soft)", fontSize: 14 }}>We aim to reply within 24 hours. If you need a quick answer first, check the FAQs before submitting.</p>
              <button type="button" className="btn btn-primary">Send request</button>
            </form>
          </section>
        )}

        {slug === "order-status" && (
          <>
            <section style={styleCard}>
              <h2 style={{ fontFamily: "var(--font-h)", fontSize: 24, marginBottom: 12 }}>Check your order</h2>
              <form className="manual-form">
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Order number</label><input className="form-input" placeholder="e.g. ORD-123456" /></div>
                  <div className="form-group"><label className="form-label">Email or phone</label><input className="form-input" placeholder="you@example.com or [Support Phone]" /></div>
                </div>
                <button type="button" className="btn btn-primary">Check status</button>
              </form>
            </section>
            <section style={styleCard}>
              <h2 style={{ fontFamily: "var(--font-h)", fontSize: 24, marginBottom: 12 }}>Status stages</h2>
              <div style={styleGrid}>
                <SectionBlock title="Confirmed" body={["Payment is successful and your order has been received."]} />
                <SectionBlock title="Packed" body={["Items are being prepared and quality checked before dispatch."]} />
                <SectionBlock title="Shipped" body={["Your order has left the warehouse and is on the way."]} />
                <SectionBlock title="Delivered" body={["The order has reached your destination and the delivery is complete."]} />
              </div>
            </section>
          </>
        )}

        {slug === "delivery" && (
          <>
            <section style={styleCard}>
              <h2 style={{ fontFamily: "var(--font-h)", fontSize: 24, marginBottom: 12 }}>Delivery options</h2>
              <table className="brand-table">
                <thead>
                  <tr><th>Option</th><th>Estimated time</th><th>Shipping cost</th></tr>
                </thead>
                <tbody>
                  <tr><td>Standard</td><td>3–7 business days</td><td>Free over $50; $5.99 below</td></tr>
                  <tr><td>Express</td><td>1–3 business days</td><td>$12.99</td></tr>
                  <tr><td>International</td><td>Varies by region</td><td>Calculated at checkout</td></tr>
                </tbody>
              </table>
            </section>
            <section style={styleCard}>
              <h2 style={{ fontFamily: "var(--font-h)", fontSize: 24, marginBottom: 12 }}>What to expect</h2>
              <div style={styleGrid}>
                <SectionBlock title="Fast delivery" body={["Clear timelines, live updates, and an easy way to track each step."]} />
                <SectionBlock title="Parcel protection" body={["Optional protection is available for high-value orders and added peace of mind."]} />
                <SectionBlock title="International shipping" body={["Eligible destinations are supported, with customs and regional delivery times shown at checkout."]} />
              </div>
            </section>
          </>
        )}

        {slug === "payment-options" && (
          <section style={styleCard}>
            <h2 style={{ fontFamily: "var(--font-h)", fontSize: 24, marginBottom: 12 }}>Accepted methods and security</h2>
            <div style={styleGrid}>
              <SectionBlock title="Payment methods" body={["Credit and debit cards", "PayPal", "Buy now, pay later options such as Klarna or Afterpay", "Gift cards", "Cash on delivery where available"]} />
              <SectionBlock title="Trust and protection" body={["SSL encryption on checkout", "PCI-compliant payment processing", "Clear currency display for USD, EUR, and supported markets", "Order confirmation emails and receipts"]} />
            </div>
          </section>
        )}

        {slug === "customer-care" && (
          <>
            <section style={styleCard}>
              <h2 style={{ fontFamily: "var(--font-h)", fontSize: 24, marginBottom: 12 }}>Support details</h2>
              <ul style={{ display: "grid", gap: 10, color: "var(--text-mid)" }}>
                <li><strong>Phone:</strong> +263 77 000 0000</li>
                <li><strong>Email:</strong> <a href={`mailto:${supportEmail}`}>{supportEmail}</a></li>
                <li><strong>Live chat:</strong> Monday to Friday, 9am–6pm</li>
                <li><strong>Escalation:</strong> Complex issues are escalated to a specialist and followed up until resolved.</li>
              </ul>
            </section>
            <section style={styleCard}>
              <h2 style={{ fontFamily: "var(--font-h)", fontSize: 24, marginBottom: 12 }}>Self-service help</h2>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ActionButton href="/footer/faqs" label="Read FAQs" />
                <ActionButton href="/footer/order-status" label="Track an order" variant="secondary" />
              </div>
            </section>
          </>
        )}

        {slug === "contact-us" && (
          <>
            <section style={styleCard}>
              <h2 style={{ fontFamily: "var(--font-h)", fontSize: 24, marginBottom: 12 }}>Contact details</h2>
              <ul style={{ display: "grid", gap: 10, color: "var(--text-mid)" }}>
                <li><strong>Address:</strong> Harare, Zimbabwe</li>
                <li><strong>Email:</strong> <a href={`mailto:${supportEmail}`}>{supportEmail}</a></li>
                <li><strong>Phone:</strong> +263 77 000 0000</li>
                <li><strong>Business hours:</strong> Monday to Friday, 9am–6pm</li>
              </ul>
            </section>
            <section style={styleCard}>
              <h2 style={{ fontFamily: "var(--font-h)", fontSize: 24, marginBottom: 12 }}>Send a message</h2>
              <form className="manual-form">
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Name</label><input className="form-input" placeholder="Your name" /></div>
                  <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" placeholder="you@example.com" /></div>
                </div>
                <div className="form-group"><label className="form-label">Subject</label><input className="form-input" placeholder="Order, partnership, media, or general inquiry" /></div>
                <div className="form-group"><label className="form-label">Message</label><textarea className="form-input" rows={6} placeholder="Share what you need help with." /></div>
                <button type="button" className="btn btn-primary">Send message</button>
              </form>
            </section>
          </>
        )}

        {slug === "faqs" && (
          <section style={styleCard}>
            <div style={{ display: "grid", gap: 12 }}>
              {[
                ["How do I place an order?", "Browse the shop, add items to your cart, choose your delivery option, and complete checkout with your preferred payment method."],
                ["How do I choose the right size?", "Use the size guide and AI-assisted fit tools to compare recommendations and sizing details before you buy."],
                ["What payment methods are available?", "drape supports cards, PayPal, buy now pay later options, gift cards, and cash on delivery where available."],
                ["How long does delivery take?", "Standard delivery usually arrives in 3–7 business days and express delivery in 1–3 business days depending on location."],
                ["How do I return an item?", "Items can be returned within 30 days if they are unworn, unused, and still have original tags attached."],
                ["Can I update my account details?", "Yes, profile, saved addresses, and payment preferences can be managed in your account area."],
              ].map(([question, answer]) => (
                <details key={question} style={{ background: "var(--bg)", borderRadius: 16, padding: "14px 16px" }}>
                  <summary style={{ fontWeight: 700, cursor: "pointer" }}>{question}</summary>
                  <p style={{ marginTop: 10, color: "var(--text-mid)" }}>{answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {slug === "orders-deliveries" && (
          <section style={styleCard}>
            <div style={styleGrid}>
              <SectionBlock title="Order journey" body={["Checkout completes after payment is confirmed.", "Orders are packed and prepared for dispatch.", "Tracking becomes available when the order is shipped.", "Delivery updates continue until the order arrives."]} />
              <SectionBlock title="Delivery exceptions" body={["P.O. boxes may have limited delivery options.", "Remote areas can take longer to reach.", "Customs or weather delays can affect international deliveries."]} />
              <SectionBlock title="Lost package support" body={["Contact support with your order number and delivery details.", "Our team will investigate and keep you updated until the issue is resolved."]} />
            </div>
          </section>
        )}

        {slug === "returns-refunds" && (
          <section style={styleCard}>
            <div style={styleGrid}>
              <SectionBlock title="Return window" body={["Returns are accepted within 30 days of delivery.", "Items must be unworn, unused, and have original tags attached."]} />
              <SectionBlock title="Refund timing" body={["Refunds are processed after the return is approved and received.", "Credits are sent back to the original payment method unless otherwise requested."]} />
              <SectionBlock title="Exchange policy" body={["Exchanges are available for eligible products when the size or style is in stock.", "Support can help with manual review if an exchange needs extra attention."]} />
            </div>
          </section>
        )}

        {slug === "terms-conditions" && (
          <section style={styleCard}>
            <div style={styleGrid}>
              <SectionBlock title="Eligibility" body={["Products are subject to availability and may change without notice.", "Orders are fulfilled according to current stock and delivery availability."]} />
              <SectionBlock title="Privacy and liability" body={["Personal data is handled in line with our privacy standards.", "Liability is limited to the amount paid for the applicable product or service."]} />
            </div>
            <p style={{ color: "var(--text-soft)", marginTop: 16 }}>This is a template and should be reviewed by a legal professional before publishing.</p>
            <p style={{ color: "var(--text-soft)", marginTop: 8 }}>Last updated: [Date]</p>
          </section>
        )}

        {slug === "terms-of-sale" && (
          <section style={styleCard}>
            <div style={styleGrid}>
              <SectionBlock title="Checkout" body={["Orders are confirmed after successful payment.", "Prices and availability are subject to change as inventory updates."]} />
              <SectionBlock title="Customer responsibility" body={["Provide accurate delivery details.", "Contact support if you need help with a return or exchange request."]} />
            </div>
          </section>
        )}

        {slug === "privacy-settings" && (
          <section style={styleCard}>
            <div style={styleGrid}>
              <SectionBlock title="What we collect" body={["Account details for order management and saved preferences.", "Sizing data only when customers choose to use AI sizing features."]} />
              <SectionBlock title="How we protect it" body={["Data is handled securely and used to improve the shopping experience.", "Customers can contact support for questions about privacy preferences or account settings."]} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
