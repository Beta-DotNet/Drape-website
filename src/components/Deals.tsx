"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type DealRecord = {
  id: string;
  title: string;
  description: string;
  image_url?: string | null;
  link_url?: string | null;
  badge_text?: string | null;
  is_active?: boolean | null;
  start_date?: string | null;
  end_date?: string | null;
  priority?: number | null;
};

function isWithinWindow(startDate: string | null | undefined, endDate: string | null | undefined) {
  const now = new Date();

  if (startDate) {
    const start = new Date(startDate);
    if (!Number.isNaN(start.getTime()) && now < start) {
      return false;
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (!Number.isNaN(end.getTime()) && now > end) {
      return false;
    }
  }

  return true;
}

export default function Deals() {
  const router = useRouter();
  const [deals, setDeals] = useState<DealRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDeals = async () => {
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from("home_deals")
          .select("*")
          .eq("is_active", true)
          .order("priority", { ascending: true });

        if (error) {
          throw error;
        }

        const activeDeals = (data ?? [])
          .filter((item: DealRecord | null) => Boolean(item))
          .filter((item: DealRecord) => isWithinWindow(item.start_date, item.end_date))
          .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

        if (isMounted) {
          setDeals(activeDeals);
        }
      } catch {
        if (isMounted) {
          setDeals([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDeals();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePrev = () => {
    const track = document.getElementById("deals-track");
    if (track) track.scrollBy({ left: -300, behavior: "smooth" });
  };

  const handleNext = () => {
    const track = document.getElementById("deals-track");
    if (track) track.scrollBy({ left: 300, behavior: "smooth" });
  };

  if (isLoading || deals.length === 0) {
    return null;
  }

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
          {deals.map((deal) => (
            <article
              key={deal.id}
              className="deal-card"
              onClick={() => router.push(deal.link_url || "/shop")}
            >
              <img src={deal.image_url || ""} alt={deal.title} loading="lazy" />
              <div className="deal-overlay"></div>
              <div className="deal-meta">
                <span className="deal-brand">{deal.title}</span>
                <p className="deal-copy">{deal.description}</p>
              </div>
              <span className="deal-badge">{deal.badge_text || "Deal"}</span>
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
