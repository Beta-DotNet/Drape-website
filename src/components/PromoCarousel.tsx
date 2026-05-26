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

type ReadabilityTone = "light" | "dark";

async function detectImageTone(imageUrl: string): Promise<ReadabilityTone> {
  if (!imageUrl) {
    return "dark";
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      try {
        const width = 48;
        const height = 48;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
          resolve("dark");
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        const pixels = context.getImageData(0, 0, width, height).data;

        let luminanceSum = 0;
        const sampleCount = pixels.length / 16;

        for (let index = 0; index < pixels.length; index += 16) {
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          luminanceSum += (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
        }

        const averageLuminance = luminanceSum / sampleCount;
        resolve(averageLuminance > 0.76 ? "light" : "dark");
      } catch {
        resolve("dark");
      }
    };

    image.onerror = () => {
      resolve("dark");
    };

    image.src = imageUrl;
  });
}

export default function PromoCarousel() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [readabilityTone, setReadabilityTone] = useState<ReadabilityTone>("dark");

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
          setPromotions(activePromotions);
          setCurrentIndex(0);
        }
      } catch (error) {
        console.warn("Could not load promotions from Supabase.", error);
        if (isMounted) {
          setPromotions([]);
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

  useEffect(() => {
    if (!activePromotion?.image_url) {
      // avoid state update if no image
      return undefined;
    }


    let isMounted = true;

    void detectImageTone(activePromotion.image_url).then((tone) => {
      if (isMounted) {
        setReadabilityTone(tone);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activePromotion?.image_url]);

  const isLightImage = readabilityTone === "light";
  const textPanelBackground = isLightImage
    ? "linear-gradient(145deg, rgba(255,255,255,0.74) 0%, rgba(255,255,255,0.38) 70%, rgba(255,255,255,0.2) 100%)"
    : "linear-gradient(145deg, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.55) 68%, rgba(15,23,42,0.34) 100%)";
  const panelBorder = isLightImage ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.14)";
  const panelShadow = isLightImage
    ? "0 24px 45px rgba(15,23,42,0.16)"
    : "0 24px 45px rgba(15,23,42,0.28)";
  const titleColor = isLightImage ? "#111827" : "#ffffff";
  const descriptionColor = isLightImage ? "rgba(17,24,39,0.88)" : "rgba(246,240,227,0.95)";
  const eyebrowColor = isLightImage ? "#111827" : "#f6e7c9";
  const badgeBackground = isLightImage ? "rgba(255,255,255,0.8)" : "rgba(15,23,42,0.55)";
  const badgeText = isLightImage ? "#111827" : "#f6e7c9";
  const helperText = isLightImage ? "rgba(17,24,39,0.84)" : "rgba(255,255,255,0.92)";

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
                crossOrigin="anonymous"
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
                maxWidth: "min(100%, 560px)",
              }}
            >
              <div
                style={{
                  borderRadius: "24px",
                  border: `1px solid ${panelBorder}`,
                  background: textPanelBackground,
                  padding: "1rem",
                  boxShadow: panelShadow,

                }}
              >
                <p
                  className="mt-4"
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: eyebrowColor,
                  }}
                >
                  Curated for your next drop
                </p>
                <h2
                  className="mt-3 text-2xl font-bold leading-tight sm:text-3xl lg:text-[2.4rem]"
                  style={{ color: titleColor }}
                >
                  {activePromotion.title}
                </h2>
                <p
                  className="mt-3 text-sm leading-6 sm:text-base"
                  style={{ color: descriptionColor }}
                >
                  {activePromotion.description}
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSlideClick(activePromotion.link_url);
                    }}
                    className="inline-flex w-full items-center justify-center transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f9d343] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdf8] sm:w-auto"
                    style={{
                      borderRadius: "var(--r-pill)",
                      background: "linear-gradient(135deg, #f7d463 0%, #f4b61f 100%)",
                      border: "2px solid rgba(15,23,42,0.95)",
                      padding: "9px 22px",
                      fontFamily: "var(--font-h)",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#111827",
                      boxShadow: "0 18px 38px rgba(15,23,42,0.28), 0 0 0 4px rgba(249,211,67,0.16)",
                    }}
                  >
                    {activePromotion.cta_text || "Shop now"}
                  </button>

                </div>
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                bottom: "16px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
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
