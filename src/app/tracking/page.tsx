"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import type { DriverLocation } from "@/components/DeliveryMap";

// Dynamically import the map — Leaflet requires browser APIs, must not SSR
const DeliveryMap = dynamic(() => import("@/components/DeliveryMap"), {
  ssr: false,
  loading: () => (
    <div style={{
      width: "100%", height: "100%",
      background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      borderRadius: "inherit",
    }}>
      <div style={{ textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>
          <img src="/images/weui--back-filled.svg" alt="Map" style={{ width: 32, height: 32 }} />
        </div>
        <p style={{ fontSize: "14px", fontWeight: 600 }}>Loading map…</p>
      </div>
    </div>
  ),
});

// Default Harare, Zimbabwe coordinates for demo
const CUSTOMER_LOCATION: DriverLocation = { lat: -17.8252, lng: 31.0335 };

const MOCK_DRIVER_START: DriverLocation = { lat: -17.8185, lng: 31.0271 };

const getStepsForStatus = (status: string) => {
  return [
    { icon: "", label: "Order Confirmed",  done: true },
    { icon: "", label: "Packed & Ready",   done: status !== "Preparing" && status !== "Pending" },
    { icon: "", label: "Out for Delivery", done: status === "In Transit" || status === "Delivered" },
    { icon: "", label: "Delivered",        done: status === "Delivered" },
  ];
};

function TrackingContent() {
  const searchParams  = useSearchParams();
  const orderId       = searchParams.get("order") || "ORD-572943";

  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(MOCK_DRIVER_START);
  const [eta, setEta]                       = useState(12); // minutes
  const [connected, setConnected]           = useState(false);
  const [lastUpdate, setLastUpdate]         = useState<string>("");
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [steps, setSteps]                   = useState(getStepsForStatus("Preparing"));

  // Fetch initial order status
  useEffect(() => {
    const fetchInitialStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("status")
          .eq("id", orderId)
          .maybeSingle();
        if (!error && data && data.status) {
          setSteps(getStepsForStatus(data.status));
          if (data.status === "In Transit") {
            setIsLiveTracking(true);
          }
        }
      } catch (e) {
        console.warn("Could not fetch initial order status:", e);
      }
    };
    fetchInitialStatus();
  }, [orderId]);

  // Subscribe to Supabase Realtime for live location & status updates
  useEffect(() => {
    const channel = supabase
      .channel(`delivery:${orderId}`)
      .on(
        "broadcast",
        { event: "driver_location" },
        (payload: { payload: { lat: number; lng: number; eta: number } }) => {
          const { lat, lng, eta: newEta } = payload.payload;
          setDriverLocation({ lat, lng, updatedAt: new Date().toISOString() });
          setEta(newEta);
          setIsLiveTracking(true);
          setLastUpdate(new Date().toLocaleTimeString());
        }
      )
      .on(
        "broadcast",
        { event: "status_changed" },
        (payload: { payload: { status: string } }) => {
          const newStatus = payload.payload.status;
          setSteps(getStepsForStatus(newStatus));
          if (newStatus === "In Transit") {
            setIsLiveTracking(true);
          } else {
            setIsLiveTracking(false);
          }
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // Simulate driver moving toward customer as a fallback if not live-tracking
  useEffect(() => {
    const interval = setInterval(() => {
      if (isLiveTracking) return;
      
      setDriverLocation((prev) => {
        if (!prev) return MOCK_DRIVER_START;
        const targetLat = CUSTOMER_LOCATION.lat;
        const targetLng = CUSTOMER_LOCATION.lng;
        const newLat = prev.lat + (targetLat - prev.lat) * 0.12;
        const newLng = prev.lng + (targetLng - prev.lng) * 0.12;
        return { lat: newLat, lng: newLng, updatedAt: new Date().toISOString() };
      });
      setEta((prev) => Math.max(0, prev - 1));
      setLastUpdate(new Date().toLocaleTimeString());
    }, 8000);

    return () => clearInterval(interval);
  }, [isLiveTracking]);

  const distanceKm = driverLocation
    ? Math.sqrt(
        Math.pow((driverLocation.lat - CUSTOMER_LOCATION.lat) * 111, 2) +
        Math.pow((driverLocation.lng - CUSTOMER_LOCATION.lng) * 111 * Math.cos(CUSTOMER_LOCATION.lat * Math.PI / 180), 2)
      ).toFixed(1)
    : null;

  return (
    <div style={{
      minHeight: "calc(100vh - var(--header-h))",
      background: "var(--bg)",
      padding: "var(--s-xl)",
      maxWidth: "1100px",
      margin: "0 auto",
    }}>
      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".15em", color: "var(--text-soft)", marginBottom: "6px" }}>
          Live Delivery Tracking
        </div>
        <h1 style={{ fontFamily: "var(--font-h)", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 700, letterSpacing: "-.02em", marginBottom: "4px" }}>
          Your Order is On Its Way
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-mid)" }}>
          Order <strong>{orderId}</strong>
          {" · "}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px",
            background: connected ? "rgba(16,185,129,0.12)" : "rgba(249,211,67,0.12)",
            color: connected ? "#059669" : "#b45309",
          }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: connected ? "#10b981" : "#f59e0b",
              display: "inline-block",
              animation: "pulse 1.5s infinite",
            }} />
            {connected ? "Live updates active" : "Demo simulation"}
          </span>
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "24px", alignItems: "start" }}>
        {/* Map */}
        <div style={{
          height: "480px",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 8px 40px rgba(15,23,42,0.18)",
          border: "1px solid var(--border)",
        }}>
          <DeliveryMap
            driverLocation={driverLocation}
            customerLocation={CUSTOMER_LOCATION}
            orderId={orderId}
            estimatedMinutes={eta}
          />
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* ETA card */}
          <div style={{
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            borderRadius: "16px",
            padding: "24px",
            color: "#fff",
            border: "1px solid rgba(249,211,67,0.2)",
          }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".15em", opacity: 0.6, marginBottom: "8px" }}>
              Estimated Arrival
            </div>
            <div style={{ fontFamily: "var(--font-h)", fontSize: "3rem", fontWeight: 800, lineHeight: 1, color: "#f9d343" }}>
              {eta}
              <span style={{ fontSize: "1.2rem", marginLeft: "6px", opacity: 0.8 }}>min</span>
            </div>
            {distanceKm && (
              <div style={{ fontSize: "13px", opacity: 0.65, marginTop: "8px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <img src="/images/mdi--cart-outline.svg" alt="Delivery" style={{ width: 14, height: 14 }} />
                  {distanceKm} km away
                </span>
              </div>
            )}
            {lastUpdate && (
              <div style={{ fontSize: "11px", opacity: 0.45, marginTop: "4px" }}>
                Last update: {lastUpdate}
              </div>
            )}
          </div>

          {/* Progress steps */}
          <div style={{
            background: "var(--white)",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid var(--border)",
            boxShadow: "var(--sh-card)",
          }}>
            <div style={{ fontFamily: "var(--font-h)", fontWeight: 700, fontSize: "14px", marginBottom: "16px" }}>
              Delivery Progress
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: "14px", alignItems: "flex-start", position: "relative" }}>
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div style={{
                      position: "absolute", left: "19px", top: "36px",
                      width: "2px", height: "28px",
                      background: step.done ? "var(--navy)" : "var(--border-mid)",
                    }} />
                  )}
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "16px",
                    background: step.done ? "var(--navy)" : "var(--surface)",
                    border: `2px solid ${step.done ? "var(--navy)" : "var(--border-mid)"}`,
                    color: step.done ? "#fff" : "var(--text-soft)",
                    zIndex: 1,
                  }}>
                    {step.done ? "✓" : step.icon}
                  </div>
                  <div style={{ paddingBottom: "28px" }}>
                    <div style={{
                      fontWeight: 600, fontSize: "13px",
                      color: step.done ? "var(--text)" : "var(--text-soft)",
                    }}>
                      {step.label}
                    </div>
                    {step.done && i === 2 && (
                      <div style={{ fontSize: "11px", color: "var(--navy)", fontWeight: 600, marginTop: "2px" }}>
                        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          <img src="/images/material-symbols--star-half-rounded.svg" alt="In progress" style={{ width: 14, height: 14 }} />
                          In progress
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rider card */}
          <div style={{
            background: "var(--white)",
            borderRadius: "16px",
            padding: "16px",
            border: "1px solid var(--border)",
            boxShadow: "var(--sh-card)",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}>
            <div style={{
              width: "52px", height: "52px", borderRadius: "50%",
              background: "linear-gradient(135deg, #1e3a5f, #f9d343)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "24px", flexShrink: 0,
            }}>
              <img src="/images/mdi--cart.svg" alt="Rider" style={{ width: 24, height: 24 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "14px" }}>Tafadzwa M.</div>
              <div style={{ fontSize: "12px", color: "var(--text-soft)" }}>Your drape rider</div>
              <div style={{ fontSize: "11px", color: "var(--text-soft)", marginTop: "2px" }}>
                <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                  <img src="/images/material-symbols--star-rounded.svg" alt="Rating" style={{ width: 14, height: 14 }} />
                  4.9 · 2,140 deliveries
                </span>
              </div>
            </div>
            <a
              href="tel:+263771234567"
              style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: "var(--navy)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "18px", textDecoration: "none", flexShrink: 0,
              }}
              title="Call rider"
            >
              <img src="/images/mdi--account.svg" alt="Call" style={{ width: 18, height: 18 }} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: "80px", textAlign: "center", color: "var(--text-soft)" }}>
        Loading tracking…
      </div>
    }>
      <TrackingContent />
    </Suspense>
  );
}
