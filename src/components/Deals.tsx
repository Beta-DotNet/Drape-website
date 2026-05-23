"use client";

import { DEALS } from "@/lib/data";
import { useRouter } from "next/navigation";

export default function Deals() {
  const router = useRouter();

  const handlePrev = () => {
    const track = document.getElementById("deals-track");
    if (track) track.scrollBy({ left: -300, behavior: "smooth" });
  };

  const handleNext = () => {
    const track = document.getElementById("deals-track");
    if (track) track.scrollBy({ left: 300, behavior: "smooth" });
  };

  return (
    <section className="deals-section">
      <div className="section-heading">
        <div className="line"></div>
        <span className="section-label">DEALS</span>
        <div className="line"></div>
      </div>
      <div className="carousel-wrap">
        <button className="carousel-btn" id="deals-prev" onClick={handlePrev}>
          &#8249;
        </button>
        <div className="carousel-track" id="deals-track">
          {DEALS.map((d, i) => (
            <article
              key={i}
              className="deal-card"
              onClick={() => router.push("/shop")}
            >
              <img src={d.img} alt={d.brand} loading="lazy" />
              <div className="deal-overlay"></div>
              <div className="deal-meta">
                <span className="deal-brand">{d.brand}</span>
                <p className="deal-copy">{d.copy}</p>
              </div>
              <span className="deal-badge">{d.discount}</span>
            </article>
          ))}
        </div>
        <button className="carousel-btn" id="deals-next" onClick={handleNext}>
          &#8250;
        </button>
      </div>
    </section>
  );
}
