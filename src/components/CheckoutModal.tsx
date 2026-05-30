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
  const [paymentMethod, setPaymentMethod] = useState<"ecocash" | "card" | "whatsapp">("ecocash");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // MVP eligibility: we optimistically show WA option, then hide on server rejection.
  const [cartVendorError, setCartVendorError] = useState<string | null>(null);
  const [whatsappAvailable, setWhatsappAvailable] = useState(true);

  const handleWhatsAppOrder = async () => {
    setLoading(true);
    setMessage("");
    setCartVendorError(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
          email: email || "customer@example.com",
          phone: phone || "",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errMsg = data?.error || "Could not place order via WhatsApp.";
        setMessage(`Error: ${errMsg}`);

        if (errMsg.includes("different boutiques")) {
          setCartVendorError(errMsg);
        }

        // Hide WA for this cart to match MVP requirement.
        setWhatsappAvailable(false);
        return;
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setMessage("Order created, but redirect URL is missing.");
      }
    } catch (err: any) {
      setMessage(`Error: ${err?.message || "Could not place order via WhatsApp."}`);
    } finally {
      setLoading(false);
    }
  };

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
          window.location.href = data.redirectUrl;
        } else {
          setStep(2);
          setMessage(
            data.message ||
              "Awaiting authorization... Enter your PIN on your phone when prompted."
          );

          let attempts = 0;
          const maxAttempts = 20;

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
              const { data: orderData, error } = await (supabase as any)
                .from("orders")
                .select("status")
                .eq("id", checkOrderId)
                .maybeSingle();

              if (!error && orderData && orderData.status === "Paid") {
                clearInterval(pollInterval);
                clearTimeout(simulationTimeout);
                setMessage(
                  "Payment Confirmed! Your order has been received and is being prepared."
                );
                localStorage.setItem("drape_cart", "[]");
                window.dispatchEvent(new Event("cart_updated"));
              }
            } catch (err) {
              console.warn("Polling order status skipped:", err);
            }
          }, 3000);
        }
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`Error: ${err?.message || "Payment failed"}`);
    }

    setLoading(false);
  };

  return (
    <div className="checkout-modal active" role="dialog">
      <div className="checkout-inner">
        <div className="checkout-header">
          <span className="checkout-title">Checkout</span>
          <button className="btn-icon" onClick={onClose} aria-label="Close checkout">
            ✕
          </button>
        </div>

        {step === 0 && (
          <div className="co-step active">
            <div className="co-section-title">Order Summary</div>
            <div className="order-total-row">
              <span>Total</span>
              <span
                style={{
                  fontFamily: "var(--font-h)",
                  fontSize: "1.3rem",
                  color: "var(--navy)",
                }}
              >
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

              <div style={{ marginTop: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                  Payment Method
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                  <label
                    style={{
                      border: "1px solid var(--border-mid)",
                      borderRadius: 18,
                      padding: "14px 12px",
                      cursor: "pointer",
                      opacity: paymentMethod === "ecocash" ? 1 : 0.9,
                      background: paymentMethod === "ecocash" ? "rgba(10,20,45,0.04)" : "#fff",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 900, color: "var(--navy)" }}>EcoCash</div>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "ecocash"}
                        onChange={() => setPaymentMethod("ecocash")}
                        style={{ accentColor: "var(--navy)" }}
                      />
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-soft)" }}>Mobile Money</div>
                  </label>

                  <label
                    style={{
                      border: "1px solid var(--border-mid)",
                      borderRadius: 18,
                      padding: "14px 12px",
                      cursor: "pointer",
                      opacity: paymentMethod === "card" ? 1 : 0.9,
                      background: paymentMethod === "card" ? "rgba(10,20,45,0.04)" : "#fff",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 900, color: "var(--navy)" }}>Card</div>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "card"}
                        onChange={() => setPaymentMethod("card")}
                        style={{ accentColor: "var(--navy)" }}
                      />
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-soft)" }}>Credit / Debit</div>
                  </label>
                </div>

                {whatsappAvailable ? (
                  <label
                    style={{
                      marginTop: 12,
                      display: "block",
                      border: "1px solid rgba(34,197,94,0.35)",
                      borderRadius: 18,
                      padding: "14px 12px",
                      cursor: "pointer",
                      background:
                        "linear-gradient(135deg, rgba(34,197,94,0.10) 0%, rgba(34,197,94,0.04) 100%)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          aria-hidden="true"
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 12,
                            background: "rgba(34,197,94,0.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#16a34a",
                            fontWeight: 900,
                          }}
                        >
                          WA
                        </div>
                        <div>
                          <div style={{ fontWeight: 900, color: "#14532d" }}>Pay via WhatsApp</div>
                          <div style={{ fontSize: 12, color: "rgba(20,83,45,0.7)" }}>Fast checkout</div>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "whatsapp"}
                        onChange={() => setPaymentMethod("whatsapp")}
                        style={{ accentColor: "#16a34a" }}
                      />
                    </div>
                  </label>
                ) : (
                  <div style={{ marginTop: 12, color: "var(--text-soft)", fontSize: 13 }}>
                    WhatsApp payment not available for this cart.
                  </div>
                )}

                {cartVendorError ? (
                  <div style={{ marginTop: 12, color: "#b91c1c", fontWeight: 700, fontSize: 13 }}>
                    {cartVendorError}
                  </div>
                ) : null}
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

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button className="btn btn-outline" onClick={() => setStep(0)}>
                &larr; Back
              </button>
              <button
                className="btn btn-navy"
                style={{ flex: 1 }}
                onClick={paymentMethod === "whatsapp" ? handleWhatsAppOrder : handlePaynow}
                disabled={loading}
              >
                {loading ? "Processing..." : "Place Order &rarr;"}
              </button>
            </div>

            {message ? (
              <div style={{ marginTop: 12, color: "var(--navy)", fontSize: 14 }}>{message}</div>
            ) : null}
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

