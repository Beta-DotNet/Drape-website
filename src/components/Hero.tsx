"use client";

import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();

  return (
    <div className="hero">
      <div className="hero-content">
        <span className="hero-eyebrow">New arrivals</span>
        <h1>SUPERSTAR</h1>
        <p>
          Discover the freshest streetwear drops, sneakers, and essentials with
          up to 50% off. Shop the latest before they disappear.
        </p>
        <div className="hero-actions">
          <button
            className="btn btn-primary btn-lg"
            onClick={() => router.push("/shop")}
          >
            Shop Now
          </button>
          <button
            className="btn btn-outline"
            style={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)" }}
            onClick={() => {
              // TODO: Implement openSizeWizard
            }}
          >
            🤖 Find Your Size
          </button>
        </div>
      </div>
      <div className="hero-discount">
        <span className="big">50%</span>
        <small>UP TO OFF</small>
      </div>
    </div>
  );
}
