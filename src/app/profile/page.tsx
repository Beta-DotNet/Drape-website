"use client";

import { useState } from "react";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("size");
  const [hasProfile, setHasProfile] = useState(false);

  return (
    <section id="view-profile" className="view active">
      <div className="profile-view">
        <h1>My Profile</h1>

        <div className="profile-tabs">
          <button
            className={`ptab ${activeTab === "size" ? "active" : ""}`}
            onClick={() => setActiveTab("size")}
          >
            📐 Size Profile
          </button>
          <button
            className={`ptab ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            📦 Orders
          </button>
          <button
            className={`ptab ${activeTab === "wishlist" ? "active" : ""}`}
            onClick={() => setActiveTab("wishlist")}
          >
            ❤ Saved
          </button>
          <button
            className={`ptab ${activeTab === "prefs" ? "active" : ""}`}
            onClick={() => setActiveTab("prefs")}
          >
            🎨 Style Prefs
          </button>
        </div>

        {/* Size Profile Tab */}
        {activeTab === "size" && (
          <div className="ptab-content active" id="tab-size">
            {!hasProfile ? (
              <div id="no-size-profile" style={{ textAlign: "center", padding: "48px 0" }}>
                <div style={{ fontSize: "4rem", marginBottom: "16px" }}>📏</div>
                <h2 style={{ marginBottom: "8px" }}>No size profile yet</h2>
                <p style={{ color: "var(--text-soft)", marginBottom: "24px" }}>
                  Use our AI body scanner to get accurate size recommendations
                  across all brands.
                </p>
                <button
                  className="btn btn-navy btn-lg"
                  onClick={() => {
                    // TODO: openSizeWizard
                    setHasProfile(true);
                  }}
                >
                  🤖 Start AI Scan
                </button>
              </div>
            ) : (
              <div id="has-size-profile">
                <div className="size-profile-card">
                  <h3>Your Body Measurements (80+ data points)</h3>
                  <div className="measurements-display" id="measurements-display">
                    {/* Data to be rendered here */}
                  </div>
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-h)",
                    fontSize: "1.2rem",
                    marginBottom: "16px",
                  }}
                >
                  Your Brand Sizes
                </h3>
                <table className="brand-table">
                  <thead>
                    <tr>
                      <th>Brand</th>
                      <th>Top/Shirt</th>
                      <th>Bottoms</th>
                      <th>Shoes</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody id="brand-sizes-tbody">
                    {/* Brand sizes */}
                  </tbody>
                </table>
                <button className="btn btn-outline btn-sm" onClick={() => setHasProfile(false)}>
                  🔄 Re-scan
                </button>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="ptab-content active" id="tab-orders">
            <div id="orders-list">
              <p>No orders yet.</p>
            </div>
          </div>
        )}

        {/* Wishlist Tab */}
        {activeTab === "wishlist" && (
          <div className="ptab-content active" id="tab-wishlist">
            <div id="wishlist-empty" style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>❤</div>
              <p style={{ color: "var(--text-soft)", fontSize: "15px" }}>
                Nothing saved yet. Tap ❤ on any product.
              </p>
            </div>
          </div>
        )}

        {/* Style Prefs Tab */}
        {activeTab === "prefs" && (
          <div className="ptab-content active" id="tab-prefs">
            <p style={{ color: "var(--text-mid)", marginBottom: "24px", fontSize: "14px" }}>
              Select the styles you love and we'll personalise your feed.
            </p>
            <div className="style-prefs">
              <div className="pref-card">
                <div className="pref-icon">🧢</div>
                <div className="pref-label">Streetwear</div>
              </div>
              <div className="pref-card">
                <div className="pref-icon">👔</div>
                <div className="pref-label">Formal</div>
              </div>
              <div className="pref-card">
                <div className="pref-icon">🏃</div>
                <div className="pref-label">Athleisure</div>
              </div>
              <div className="pref-card">
                <div className="pref-icon">🌸</div>
                <div className="pref-label">Boho</div>
              </div>
              <div className="pref-card">
                <div className="pref-icon">⬜</div>
                <div className="pref-label">Minimalist</div>
              </div>
              <div className="pref-card">
                <div className="pref-icon">🕶</div>
                <div className="pref-label">Vintage</div>
              </div>
            </div>
            <button className="btn btn-navy" style={{ marginTop: "24px" }}>
              Save Preferences
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
