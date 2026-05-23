"use client";

import { useEffect, useRef } from "react";

export interface DriverLocation {
  lat: number;
  lng: number;
  heading?: number;
  updatedAt?: string;
}

interface DeliveryMapProps {
  driverLocation: DriverLocation | null;
  customerLocation: DriverLocation;
  orderId: string;
  estimatedMinutes?: number;
}

// We dynamically import Leaflet so this component must only be rendered on the client.
export default function DeliveryMap({
  driverLocation,
  customerLocation,
  orderId,
  estimatedMinutes,
}: DeliveryMapProps) {
  const mapRef    = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null); // L instance
  const mapObjRef  = useRef<any>(null);
  const driverMarkerRef   = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const routeLineRef      = useRef<any>(null);

  // Bootstrap Leaflet once on mount
  useEffect(() => {
    if (!mapRef.current || mapObjRef.current) return;

    // Leaflet mutates `window` – must be imported client-side only
    import("leaflet").then((L) => {
      leafletRef.current = L.default ?? L;
      const Lf = leafletRef.current;

      // Fix default icon paths broken by bundlers
      delete (Lf.Icon.Default.prototype as any)._getIconUrl;
      Lf.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const center: [number, number] = driverLocation
        ? [driverLocation.lat, driverLocation.lng]
        : [customerLocation.lat, customerLocation.lng];

      const map = Lf.map(mapRef.current!, {
        center,
        zoom: 14,
        zoomControl: true,
        attributionControl: false,
      });

      // Tile layer — CartoDB dark-matter for premium feel
      Lf.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      // Customer marker (gold pin)
      const customerIcon = Lf.divIcon({
        className: "",
        html: `<div style="
          width:36px;height:36px;border-radius:50%;
          background:linear-gradient(135deg,#f9d343,#e6a817);
          border:3px solid #fff;box-shadow:0 4px 16px rgba(249,211,67,0.6);
          display:flex;align-items:center;justify-content:center;
          font-size:16px;cursor:default;">🏠</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      customerMarkerRef.current = Lf.marker(
        [customerLocation.lat, customerLocation.lng],
        { icon: customerIcon }
      )
        .addTo(map)
        .bindPopup("<strong>Your delivery address</strong>", { closeButton: false });

      // Driver marker (navy pulsing dot)
      if (driverLocation) {
        const driverIcon = Lf.divIcon({
          className: "",
          html: `<div style="position:relative;">
            <div style="
              width:40px;height:40px;border-radius:50%;
              background:linear-gradient(135deg,#1e3a5f,#1a3a52);
              border:3px solid #fff;box-shadow:0 4px 20px rgba(30,58,95,0.5);
              display:flex;align-items:center;justify-content:center;
              font-size:18px;">🛵</div>
            <div style="
              position:absolute;top:-4px;left:-4px;
              width:48px;height:48px;border-radius:50%;
              border:2px solid rgba(249,211,67,0.7);
              animation:mapPulse 1.6s ease-out infinite;"></div>
          </div>`,
          iconSize: [48, 48],
          iconAnchor: [24, 24],
        });

        driverMarkerRef.current = Lf.marker(
          [driverLocation.lat, driverLocation.lng],
          { icon: driverIcon }
        )
          .addTo(map)
          .bindPopup("<strong>Your drape rider</strong><br>On the way!", { closeButton: false });

        // Draw dotted route line
        routeLineRef.current = Lf.polyline(
          [[driverLocation.lat, driverLocation.lng], [customerLocation.lat, customerLocation.lng]],
          { color: "#f9d343", weight: 2.5, dashArray: "8 6", opacity: 0.7 }
        ).addTo(map);

        // Fit bounds to show both markers
        map.fitBounds(
          [[driverLocation.lat, driverLocation.lng], [customerLocation.lat, customerLocation.lng]],
          { padding: [50, 50] }
        );
      }

      mapObjRef.current = map;
    });

    return () => {
      if (mapObjRef.current) {
        mapObjRef.current.remove();
        mapObjRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount

  // Update driver marker position when driverLocation changes via Realtime
  useEffect(() => {
    if (!mapObjRef.current || !driverLocation) return;
    const Lf = leafletRef.current;
    const newLatLng: [number, number] = [driverLocation.lat, driverLocation.lng];

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng(newLatLng);
    }
    if (routeLineRef.current) {
      routeLineRef.current.setLatLngs([
        newLatLng,
        [customerLocation.lat, customerLocation.lng],
      ]);
    }
  }, [driverLocation, customerLocation]);

  return (
    <>
      {/* Inject keyframe for pulse animation */}
      <style>{`
        @keyframes mapPulse {
          0%   { transform: scale(1);   opacity: 0.8; }
          70%  { transform: scale(1.6); opacity: 0;   }
          100% { transform: scale(1.6); opacity: 0;   }
        }
      `}</style>
      <div
        ref={mapRef}
        style={{ width: "100%", height: "100%", borderRadius: "inherit" }}
      />
    </>
  );
}
