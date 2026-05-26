"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface PromotionRecord {
  id: string;
  title: string;
  description: string;
  image_url?: string | null;
  link_url?: string | null;
  cta_text?: string | null;
  is_active?: boolean | null;
  start_date?: string | null;
  end_date?: string | null;
  priority?: number | null;
}

const fallbackPromotions: PromotionRecord[] = [
  {
    id: "fallback-summer-sale",
    title: "Summer Sale",
    description:
      "Refresh your wardrobe with elevated essentials, tailored pieces, and limited-time savings for every occasion.",
    image_url:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1600&q=80",
    link_url: "/shop",
    cta_text: "Shop now",
    priority: 1,
  },
  {
    id: "fallback-new-arrivals",
    title: "New arrivals are here",
    description:
      "Discover bold silhouettes, premium fabrics, and the latest looks curated for your next fashion moment.",
    image_url:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1600&q=80",
    link_url: "/shop",
    cta_text: "Explore drops",
    priority: 2,
  },
];

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

export default function PromoCarousel() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPromotions = async () => {
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from("promotions")
          .select("*")
          .eq("is_active", true)
          .order("priority", { ascending: true });

        if (error) {
          throw error;
        }

        const activePromotions = (data ?? [])
          .filter((item: PromotionRecord | null) => Boolean(item))
          .filter((item: PromotionRecord) => isWithinWindow(item.start_date, item.end_date))
          .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

        if (isMounted) {
          setPromotions(activePromotions.length ? activePromotions : fallbackPromotions);
          setCurrentIndex(0);
        }
      } catch (error) {
        console.warn("Could not load promotions from Supabase.", error);
        if (isMounted) {
          setPromotions(fallbackPromotions);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPromotions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (promotions.length <= 1 || isPaused) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setCurrentIndex((previous) => (previous + 1) % promotions.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [isPaused, promotions.length]);

  const safeCurrentIndex = promotions.length === 0 ? 0 : currentIndex % promotions.length;
  const activePromotion = useMemo(() => promotions[safeCurrentIndex] ?? null, [promotions, safeCurrentIndex]);

  const nextSlide = () => {
    setCurrentIndex((previous) => (previous + 1) % Math.max(promotions.length, 1));
  };

  const previousSlide = () => {
    setCurrentIndex((previous) => (previous - 1 + Math.max(promotions.length, 1)) % Math.max(promotions.length, 1));
  };

  const handleSlideClick = (linkUrl?: string | null) => {
    if (!linkUrl) {
      return;
    }

    router.push(linkUrl);
  };

  if (isLoading) {
    return (
      <section aria-label="Current promotions" className="mx-auto w-full px-4 pb-4 pt-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] border border-white/60 bg-[#f8f1e7] shadow-[0_25px_70px_rgba(15,23,42,0.08)]">
          <div className="animate-pulse px-5 py-6 sm:px-8 sm:py-8">
            <div className="h-[280px] rounded-[22px] bg-gradient-to-r from-[#f0e3d1] via-[#f8f1e7] to-[#efe0cf] sm:h-[360px]" />
          </div>
        </div>
      </section>
    );
  }

  if (!promotions.length) {
    return null;
  }

  return (
    <section aria-label="Current promotions" className="mx-auto w-full px-4 pb-4 pt-4 sm:px-6 lg:px-8">
      <div
        className="relative overflow-hidden rounded-[28px] border border-white/60 bg-[#f8f1e7] shadow-[0_25px_70px_rgba(15,23,42,0.08)]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {activePromotion && (
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              height: "clamp(320px, 38vw, 440px)",
            }}
          >
            {activePromotion.image_url ? (
              <img
                src={activePromotion.image_url}
                alt={activePromotion.title}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(135deg, #f4e8da 0%, #e4c9aa 48%, #cda980 100%)",
                }}
              />
            )}

            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.55) 45%, rgba(15,23,42,0.2) 100%)",
              }}
            />

            <div
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() => handleSlideClick(activePromotion.link_url)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleSlideClick(activePromotion.link_url);
                }
              }}
              style={{ position: "absolute", inset: 0 }}
            />

            <div
              style={{
                position: "absolute",
                insetInline: "1rem",
                bottom: "1rem",
                zIndex: 10,
                maxWidth: "55%",
              }}
            >
              <div className="rounded-[24px] border border-white/15 bg-[rgba(15,23,42,0.55)] p-4 backdrop-blur-sm sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="inline-flex items-center rounded-full border border-white/20 bg-[rgba(15,23,42,0.55)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f6e7c9] backdrop-blur-sm sm:text-[12px]">
                    Active promotion
                  </div>
                  <div className="rounded-full border border-white/20 bg-[rgba(15,23,42,0.55)] px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
                    {currentIndex + 1} / {promotions.length}
                  </div>
                </div>

                <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#f5ddb3] sm:text-[12px]">
                  Curated for your next drop
                </p>
                <h2 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-[2.4rem]">
                  {activePromotion.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#f6f0e3] sm:text-base">
                  {activePromotion.description}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSlideClick(activePromotion.link_url);
                    }}
                    className="inline-flex w-full items-center justify-center rounded-full bg-[#f5c96b] px-5 py-3 text-sm font-bold text-[#111827] shadow-[0_12px_35px_rgba(245,201,107,0.28)] transition hover:-translate-y-0.5 hover:bg-[#edd48d] sm:w-auto"
                  >
                    {activePromotion.cta_text || "Shop now"}
                  </button>
                  {activePromotion.link_url ? (
                    <span className="text-sm font-medium text-white/90">
                      Tap the button to explore the offer.
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 sm:bottom-6">
              <button
                type="button"
                aria-label="Previous promotion"
                onClick={(event) => {
                  event.stopPropagation();
                  previousSlide();
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-black/30 text-lg text-white backdrop-blur-sm transition hover:bg-black/45"
              >
                ←
              </button>

              <div className="flex items-center gap-2">
                {promotions.map((promotion, index) => (
                  <button
                    key={promotion.id}
                    type="button"
                    aria-label={`Go to promotion ${index + 1}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setCurrentIndex(index);
                    }}
                    className={`h-2.5 rounded-full transition-all ${
                      index === currentIndex ? "w-8 bg-[#f5c96b]" : "w-2.5 bg-white/70"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                aria-label="Next promotion"
                onClick={(event) => {
                  event.stopPropagation();
                  nextSlide();
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-black/30 text-lg text-white backdrop-blur-sm transition hover:bg-black/45"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
