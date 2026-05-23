"use client";

import { useState } from "react";

export default function CheckoutModal({
  cartItems,
  total,
  onClose,
}: {
  cartItems: any[];
  total: number;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("ecocash");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handlePaynow = async () => {
    setLoading(true);
    setMessage("Initiating secure payment...");
    try {
      const response = await fetch("/api/paynow/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems,
          email: email || "customer@example.com",
          phone: paymentMethod === "ecocash" ? phone : "",
          isEcocash: paymentMethod === "ecocash",
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        if (data.redirectUrl) {
          // Standard card payment
          window.location.href = data.redirectUrl;
        } else if (data.pollUrl) {
          // EcoCash push
          setMessage("Check your phone to enter your EcoCash PIN!");
          setStep(2); // Move to success step
        } else {
          // Mock mode response
          setMessage(data.message);
          setStep(2);
        }
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="checkout-modal" style={{ display: "flex" }} role="dialog">
      <div className="checkout-inner">
        <div className="checkout-header">
          <span className="checkout-title">Checkout</span>
          <button className="btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>

        {step === 0 && (
          <div className="co-step active">
            <div className="co-section-title">Order Summary</div>
            <div className="order-total-row">
              <span>Total</span>
              <span style={{ fontFamily: "var(--font-h)", fontSize: "1.3rem", color: "var(--navy)" }}>
                ${total}
              </span>
            </div>
            <button
              className="btn btn-navy btn-block btn-lg"
              onClick={() => setStep(1)}
              style={{ marginTop: "16px" }}
            >
              Continue to Payment &rarr;
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="co-step active">
            <div className="co-section-title">Payment details</div>
            <div className="manual-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                />
              </div>

              <div style={{ marginTop: "16px", marginBottom: "16px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "10px" }}>
                  Payment Method
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px" }}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "ecocash"}
                      onChange={() => setPaymentMethod("ecocash")}
                      style={{ accentColor: "var(--navy)" }}
                    />
                    EcoCash Mobile Money
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px" }}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                      style={{ accentColor: "var(--navy)" }}
                    />
                    Credit / Debit Card
                  </label>
                </div>
              </div>

              {paymentMethod === "ecocash" && (
                <div className="form-group">
                  <label className="form-label">EcoCash Number</label>
                  <input
                    className="form-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0771234567"
                  />
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button className="btn btn-outline" onClick={() => setStep(0)}>
                &larr; Back
              </button>
              <button className="btn btn-navy" style={{ flex: 1 }} onClick={handlePaynow} disabled={loading}>
                {loading ? "Processing..." : "Place Order &rarr;"}
              </button>
            </div>
            {message && <div style={{ marginTop: "12px", color: "var(--navy)", fontSize: "14px" }}>{message}</div>}
          </div>
        )}

        {step === 2 && (
          <div className="co-step active">
            <div className="order-success" style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🎉</div>
              <h2>{message.includes("Mock") ? "Mock Order Placed!" : "Awaiting Payment..."}</h2>
              <p style={{ color: "var(--text-soft)" }}>{message}</p>
              <button className="btn btn-navy" style={{ marginTop: "32px" }} onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
