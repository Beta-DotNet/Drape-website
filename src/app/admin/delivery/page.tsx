"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";

interface ShippingAddress {
  email: string;
  phone: string;
  address: string;
}

interface DeliveryOrder {
  id: string;
  status: string;
  total_amount: number;
  shipping_address: ShippingAddress;
  created_at: string;
}

function normalizeShippingAddress(value: string | Record<string, unknown> | null | undefined): ShippingAddress {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as Partial<ShippingAddress>;
      return {
        email: parsed.email ?? "customer@example.com",
        phone: parsed.phone ?? "0771234567",
        address: parsed.address ?? "Harare, Zimbabwe",
      };
    } catch {
      return {
        email: "customer@example.com",
        phone: "0771234567",
        address: "Harare, Zimbabwe",
      };
    }
  }

  if (value && typeof value === "object") {
    const parsed = value as Partial<ShippingAddress>;
    return {
      email: parsed.email ?? "customer@example.com",
      phone: parsed.phone ?? "0771234567",
      address: parsed.address ?? "Harare, Zimbabwe",
    };
  }

  return {
    email: "customer@example.com",
    phone: "0771234567",
    address: "Harare, Zimbabwe",
  };
}

function RiderDashboardContent() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [riderEta, setRiderEta] = useState(12);

  const watchIdRef = useRef<number | null>(null);
  const broadcastChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );
  const deliveryStatus = selectedOrder?.status ?? "Preparing";

  // Fetch orders from Supabase (fallback to mock orders for rich offline demo)
  useEffect(() => {
    const fetchActiveDeliveries = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          const mapped: DeliveryOrder[] = data.map((o) => ({
            id: String(o.id),
            status: String(o.status ?? "Preparing"),
            total_amount: Number(o.total_amount ?? 0),
            shipping_address: normalizeShippingAddress(
              (o.shipping_address as string | Record<string, unknown> | null | undefined) ?? null
            ),
            created_at: String(o.created_at),
          }));
          setOrders(mapped);
          setSelectedOrderId(mapped[0]?.id ?? null);
        } else {
          loadMockOrders();
        }
      } catch (err) {
        console.warn("Could not load deliveries from Supabase, loading offline demo data.", err);
        loadMockOrders();
      }
    };

    const loadMockOrders = () => {
      const mock: DeliveryOrder[] = [
        {
          id: "ORD-572943",
          status: "Preparing",
          total_amount: 225,
          shipping_address: {
            email: "tinashe@example.com",
            phone: "+263 77 123 4567",
            address: "15 Enterprise Rd, Highlands, Harare",
          },
          created_at: new Date().toISOString(),
        },
        {
          id: "ORD-982104",
          status: "Paid",
          total_amount: 87,
          shipping_address: {
            email: "nyasha@example.com",
            phone: "+263 78 987 6543",
            address: "7 Borrowdale Rd, Harare",
          },
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
      setOrders(mock);
      setSelectedOrderId(mock[0]?.id ?? null);
    };

    fetchActiveDeliveries();
  }, []);

  // Clean up GPS watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Set up Supabase Broadcast channel when orderId changes
  useEffect(() => {
    if (selectedOrderId) {
      broadcastChannelRef.current = supabase.channel(`delivery:${selectedOrderId}`);
      broadcastChannelRef.current.subscribe();
    }
    return () => {
      if (broadcastChannelRef.current) {
        supabase.removeChannel(broadcastChannelRef.current);
      }
    };
  }, [selectedOrderId]);

  // Toggle order status
  const handleUpdateStatus = async (newStatus: string) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === selectedOrderId ? { ...order, status: newStatus } : order))
    );

    // Server-side update + trusted broadcast
    if (selectedOrderId) {
      try {
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        if (!token) {
          console.warn("No auth session available; skipping status update.");
        } else {
          const res = await fetch("/api/rider/update-status", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ orderId: selectedOrderId, status: newStatus }),
          });

          if (!res.ok) {
            console.warn("Failed to update status:", await res.text());
          }
        }
      } catch (err) {
        console.warn("Could not update order status.", err);
      }
    }

    // Manage GPS watcher based on status
    if (newStatus === "In Transit") {
      startGpsTracking();
    } else {
      stopGpsTracking();
    }
  };

  // Start watching Geolocation
  const startGpsTracking = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }

    setGpsActive(true);
    setGpsError(null);

    // Initial position trigger
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentCoords(coords);
        pushDriverUpdate(coords.lat, coords.lng, riderEta);
      },
      (err) => {
        setGpsError(`GPS Error: ${err.message}. Using simulated route.`);
        simulateRiderRoute();
      },
      { enableHighAccuracy: true }
    );

    // Watch position in real time
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentCoords(coords);
        setGpsError(null);
        pushDriverUpdate(coords.lat, coords.lng, riderEta);
      },
      (err) => {
        console.warn("GPS tracking accuracy issues:", err);
      },
      // distanceFilter is a React Native option; not supported by DOM Geolocation types.
      { enableHighAccuracy: true }
    );
  };

  // Stop Geolocation watcher
  const stopGpsTracking = () => {
    setGpsActive(false);
    setCurrentCoords(null);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Push driver coordinate update (secured server-side)
  const pushDriverUpdate = async (lat: number, lng: number, eta: number) => {
    if (!selectedOrderId) return;

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        console.warn("No auth session available; skipping location update.");
        return;
      }

      const res = await fetch("/api/rider/update-location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: selectedOrderId, lat, lng, eta }),
      });

      if (!res.ok) {
        console.warn("Failed to update location:", await res.text());
      }
    } catch (e) {
      console.warn("Could not update location.", e);
    }
  };

  // Simulate rider route if GPS is disabled or blocked in the browser (convenient testing)
  const simulateRiderRoute = () => {
    let currentLat = -17.8185;
    let currentLng = 31.0271;
    const destLat = -17.8252;
    const destLng = 31.0335;
    let currentEta = 12;

    const interval = setInterval(() => {
      if (!gpsActive || deliveryStatus !== "In Transit") {
        clearInterval(interval);
        return;
      }

      currentLat = currentLat + (destLat - currentLat) * 0.15;
      currentLng = currentLng + (destLng - currentLng) * 0.15;
      currentEta = Math.max(0, currentEta - 1);

      setCurrentCoords({ lat: currentLat, lng: currentLng });
      setRiderEta(currentEta);
      pushDriverUpdate(currentLat, currentLng, currentEta);

      if (Math.abs(currentLat - destLat) < 0.0005 && Math.abs(currentLng - destLng) < 0.0005) {
        clearInterval(interval);
        handleUpdateStatus("Delivered");
      }
    }, 6000);
  };

  const handleEtaChange = (newEta: number) => {
    setRiderEta(newEta);
    if (currentCoords) {
      pushDriverUpdate(currentCoords.lat, currentCoords.lng, newEta);
    }
  };

  return (
    <div style={{
      maxWidth: "800px",
      margin: "0 auto",
      padding: "20px",
      minHeight: "calc(100vh - var(--header-h))",
      background: "var(--bg)",
    }}>
      {/* Header Panel */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
        borderRadius: "16px",
        padding: "24px",
        color: "#fff",
        marginBottom: "24px",
        boxShadow: "0 10px 30px rgba(15,23,42,0.2)",
        border: "1px solid rgba(255,255,255,0.05)"
      }}>
        <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".15em", color: "var(--gold)", marginBottom: "4px" }}>
          Rider Console
        </div>
        <h1 style={{ fontFamily: "var(--font-h)", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 800, margin: 0 }}>
          Delivery Agent Dashboard
        </h1>
        <p style={{ opacity: 0.7, fontSize: "13px", marginTop: "4px" }}>
          Manage your active runs, change delivery stages, and broadcast live GPS locations.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "20px", alignItems: "start" }}>
        {/* Sidebar lists */}
        <div style={{
          background: "var(--white)",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          boxShadow: "var(--sh-card)",
          overflow: "hidden",
        }}>
          <div style={{ padding: "14px 16px", fontWeight: 700, fontSize: "14px", borderBottom: "1px solid var(--border-mid)", background: "#f8fafc" }}>
            Active Orders
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {orders.map((o) => (
              <div
                key={o.id}
                onClick={() => setSelectedOrderId(o.id)}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-mid)",
                  cursor: "pointer",
                  background: o.id === selectedOrderId ? "rgba(30,58,95,0.05)" : "transparent",
                  borderLeft: o.id === selectedOrderId ? "4px solid var(--navy)" : "4px solid transparent",
                  transition: "background 0.2s",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "13px" }}>{o.id}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-soft)" }}>${o.total_amount}</span>
                  <span style={{
                    fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "10px",
                    background: o.status === "Delivered" ? "rgba(16,185,129,0.12)" : "rgba(249,211,67,0.12)",
                    color: o.status === "Delivered" ? "#059669" : "#b45309",
                  }}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected order detail board */}
        {selectedOrderId ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Run management card */}
            <div style={{
              background: "var(--white)",
              borderRadius: "16px",
              border: "1px solid var(--border)",
              padding: "20px",
              boxShadow: "var(--sh-card)",
            }}>
              <h2 style={{ fontFamily: "var(--font-h)", fontSize: "1.2rem", fontWeight: 700, marginBottom: "16px" }}>
                Run Details: {selectedOrderId}
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "var(--text-mid)", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid var(--border-mid)" }}>
                <div><strong>Client Address:</strong> {orders.find((o) => o.id === selectedOrderId)?.shipping_address.address}</div>
                <div><strong>Client Contact:</strong> {orders.find((o) => o.id === selectedOrderId)?.shipping_address.phone}</div>
                <div><strong>Stage Status:</strong> {deliveryStatus}</div>
              </div>

              {/* Status control buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                <button
                  onClick={() => handleUpdateStatus("Preparing")}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-mid)",
                    background: deliveryStatus === "Preparing" ? "var(--navy)" : "#fff",
                    color: deliveryStatus === "Preparing" ? "#fff" : "var(--text)",
                    fontWeight: 700, cursor: "pointer", fontSize: "12px",
                  }}
                >
                  📦 Preparing
                </button>

                <button
                  onClick={() => handleUpdateStatus("Ready for Pickup")}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-mid)",
                    background: deliveryStatus === "Ready for Pickup" ? "var(--navy)" : "#fff",
                    color: deliveryStatus === "Ready for Pickup" ? "#fff" : "var(--text)",
                    fontWeight: 700, cursor: "pointer", fontSize: "12px",
                  }}
                >
                  🚪 Ready for Pickup
                </button>

                <button
                  onClick={() => handleUpdateStatus("In Transit")}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-mid)",
                    background: deliveryStatus === "In Transit" ? "#f59e0b" : "#fff",
                    color: deliveryStatus === "In Transit" ? "#fff" : "var(--text)",
                    fontWeight: 700, cursor: "pointer", fontSize: "12px",
                  }}
                >
                  🛵 Go In Transit (GPS On)
                </button>

                <button
                  onClick={() => handleUpdateStatus("Delivered")}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-mid)",
                    background: deliveryStatus === "Delivered" ? "#10b981" : "#fff",
                    color: deliveryStatus === "Delivered" ? "#fff" : "var(--text)",
                    fontWeight: 700, cursor: "pointer", fontSize: "12px",
                  }}
                >
                  🏠 Delivered (Finish)
                </button>
              </div>
            </div>

            {/* GPS Broadcast Console Card */}
            {deliveryStatus === "In Transit" && (
              <div style={{
                background: "var(--white)",
                borderRadius: "16px",
                border: "1px solid var(--border)",
                padding: "20px",
                boxShadow: "var(--sh-card)",
              }}>
                <div style={{ display: "flex", justifySelf: "space-between", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ fontFamily: "var(--font-h)", fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                    🛰️ Live GPS Streaming
                  </h3>
                  <span style={{
                    fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px",
                    background: gpsActive ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                    color: gpsActive ? "#10b981" : "#ef4444",
                  }}>
                    {gpsActive ? "GPS BROADCASTING LIVE" : "GPS OFFLINE"}
                  </span>
                </div>

                {gpsError && (
                  <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "#b45309", padding: "8px 12px", borderRadius: "8px", fontSize: "11px", marginBottom: "12px" }}>
                    ⚠️ {gpsError}
                  </div>
                )}

                {currentCoords ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px", background: "var(--surface)", padding: "12px", borderRadius: "10px", border: "1px solid var(--border-mid)" }}>
                    <div><strong>Latitude:</strong> {currentCoords.lat.toFixed(6)}</div>
                    <div><strong>Longitude:</strong> {currentCoords.lng.toFixed(6)}</div>
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "var(--text-soft)" }}>Acquiring satellite coordinate lock…</div>
                )}

                {/* ETA controller */}
                <div style={{ marginTop: "14px" }}>
                  <label htmlFor="eta-select" style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-mid)", display: "block", marginBottom: "6px" }}>
                    Manually Adjust ETA: {riderEta} minutes
                  </label>
                  <input
                    id="eta-select"
                    type="range"
                    min="1"
                    max="60"
                    value={riderEta}
                    onChange={(e) => handleEtaChange(parseInt(e.target.value))}
                    style={{ width: "100%", accentColor: "#f59e0b" }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-soft)" }}>
            Select a run from the sidebar to manage status.
          </div>
        )}
      </div>
    </div>
  );
}

export default function RiderDashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: "80px", textAlign: "center" }}>Loading Rider Console…</div>}>
      <RiderDashboardContent />
    </Suspense>
  );
}
