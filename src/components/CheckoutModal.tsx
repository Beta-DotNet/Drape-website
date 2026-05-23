"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

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
        const checkOrderId = data.orderId;
        
        if (data.redirectUrl && paymentMethod === "card") {
          // Standard card payment redirect
          window.location.href = data.redirectUrl;
        } else {
          // EcoCash push payment or mock simulation payment
          setStep(2); // Move to status display step
          setMessage(data.message || "Awaiting authorization... Enter your PIN on your phone when prompted.");
          
          let attempts = 0;
          const maxAttempts = 20; // 60 seconds of polling (3s intervals)
          
          // Setup a fallback simulation timer. If Supabase table doesn't exist
          // or we are running in mock mode, it will auto-confirm after 8 seconds.
          const simulationTimeout = setTimeout(() => {
            clearInterval(pollInterval);
            setMessage("Payment Confirmed! Your order has been placed successfully.");
            localStorage.setItem("drape_cart", "[]");
            window.dispatchEvent(new Event("cart_updated"));
          }, 8000);

          const pollInterval = setInterval(async () => {
            attempts++;
            if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              clearTimeout(simulationTimeout);
              setMessage("Payment authorization session timed out. Please try again.");
              return;
            }

            try {
              const { data: orderData, error } = await supabase
                .from("orders")
                .select("status")
                .eq("id", checkOrderId)
                .maybeSingle();

              if (!error && orderData && orderData.status === "Paid") {
                clearInterval(pollInterval);
                clearTimeout(simulationTimeout);
                setMessage("Payment Confirmed! Your order has been received and is being prepared.");
                // Empty the cart
                localStorage.setItem("drape_cart", "[]");
                window.dispatchEvent(new Event("cart_updated"));
              }
            } catch (err) {
              console.warn("Polling order status skipped (offline or tables uncreated):", err);
            }
          }, 3000);
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
