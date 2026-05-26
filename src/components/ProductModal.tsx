"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/lib/toast";
import { getProductSlug } from "@/lib/product-slug";

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

interface SizeProfile {
  hasScanned?: boolean;
  measurements?: {
    height?: number;
    weight?: number;
    chest?: number;
    waist?: number;
    hips?: number;
    inseam?: number;
    shoeSize?: string;
    [key: string]: number | string | undefined;
  };
  shoeSize?: string;
  brandSizes?: Record<string, Record<string, string>>;
}

function getRecommendedSize(profile: SizeProfile | null, prod: Product) {
  if (!profile) {
    return "";
  }

  const cat = prod.category.toLowerCase();

  if (cat === "shoes") {
    return profile.shoeSize || profile.brandSizes?.Nike?.Shoes || "9";
  }

  if (cat === "bottoms") {
    return profile.brandSizes?.[prod.brand]?.Bottoms || profile.brandSizes?.Nike?.Bottoms || "M";
  }

  return profile.brandSizes?.[prod.brand]?.Tops || profile.brandSizes?.Nike?.Tops || "L";
}

function loadStoredSizeProfile(): SizeProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem("drape_size_profile");
    if (!stored) {
      return null;
    }

    return JSON.parse(stored) as SizeProfile;
  } catch (error) {
    console.error("Error loading size profile:", error);
    return null;
  }
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "");
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || "");
  const [sizeProfile, setSizeProfile] = useState<SizeProfile | null>(() => loadStoredSizeProfile());
  const [isClosing, setIsClosing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const recommendedSize = getRecommendedSize(sizeProfile, product);

  const getRecommendedSizeConfidence = () => {
    if (!sizeProfile) {
      return 0;
    }

    return 92 + (product.id % 7);
  };

  const handleClose = () => {
    if (isClosing) {
      return;
    }

    setIsClosing(true);
    window.setTimeout(() => onClose(), 220);
  };

  const handleViewMoreDetails = () => {
    if (isClosing) {
      return;
    }

    setIsClosing(true);
    window.setTimeout(() => {
      onClose();
      router.push(`/product/${getProductSlug(product)}`);
    }, 220);
  };

  const persistLocalCart = (item: {
    product_id: number;
    name: string;
    brand: string;
    price: number;
    image: string;
    size: string;
    color: string;
    quantity: number;
    isAiMatched: boolean;
  }) => {
    try {
      const stored = localStorage.getItem("drape_cart") || "[]";
      const cart = JSON.parse(stored);

      if (!Array.isArray(cart)) {
        return;
      }

      const itemIndex = cart.findIndex(
        (entry: { product_id: number; size: string; color: string }) =>
          entry.product_id === item.product_id && entry.size === item.size && entry.color === item.color
      );

      if (itemIndex > -1) {
        cart[itemIndex].quantity += 1;
      } else {
        cart.push(item);
      }

      localStorage.setItem("drape_cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cart_updated"));
    } catch (error) {
      console.error("Failed to persist cart locally:", error);
    }
  };

  const handleAddToCart = async () => {
    const chosenSize = selectedSize || product.sizes[0] || "L";
    const chosenColor = selectedColor || product.colors[0] || "Default";

    setIsAdding(true);

    try {
      const { data } = await supabase.auth.getUser();

      if (data.user?.id) {
        const { error } = await supabase
          .from("cart_items")
          .upsert(
            {
              user_id: data.user.id,
              product_id: product.id,
              name: product.name,
              brand: product.brand,
              price: product.price,
              image: product.images[0],
              size: chosenSize,
              color: chosenColor,
              quantity: 1,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,product_id,size" }
          );

        if (error) {
          throw error;
        }
      }

      persistLocalCart({
        product_id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        image: product.images[0],
        size: chosenSize,
        color: chosenColor,
        quantity: 1,
        isAiMatched: chosenSize === recommendedSize,
      });

      showToast({
        message: `${product.name} (${chosenSize}) added to bag.`,
        action: {
          label: "View bag",
          onAction: () => window.dispatchEvent(new Event("open_cart_drawer")),
        },
      });

      window.dispatchEvent(new Event("open_cart_drawer"));
      handleClose();
    } catch (error) {
      console.error("Error adding to cart:", error);
      showToast({
        message: "Could not save this item to your bag right now.",
      });
    } finally {
      if (!isClosing) {
        setIsAdding(false);
      }
    }
  };

  const triggerMockScan = () => {
    const mockProfile = {
      hasScanned: true,
      measurements: {
        height: 180,
        weight: 75,
        chest: 98,
        waist: 82,
        hips: 100,
        inseam: 80,
        shoeSize: "9",
      },
      brandSizes: {
        Nike: { Tops: "L", Bottoms: "M", Shoes: "10" },
        Zara: { Tops: "M", Bottoms: "M", Shoes: "9.5" },
        "Retro Supply": { Tops: "L", Bottoms: "L", Shoes: "10" },
        "Jonathan D": { Tops: "L", Bottoms: "32", Shoes: "9" },
      },
    };

    localStorage.setItem("drape_size_profile", JSON.stringify(mockProfile));
    setSizeProfile(mockProfile);
    alert("AI scan successful! Your size recommendations are now active across all products.");
  };

  return (
    <div
      className="product-modal active"
      role="dialog"
      aria-modal="true"
      style={{
        overflow: "hidden",
        opacity: isClosing ? 0 : 1,
        transform: isClosing ? "scale(0.98)" : "scale(1)",
        transition: "opacity 220ms ease, transform 220ms ease",
      }}
    >
      <div
        className="overlay-backdrop active"
        onClick={handleClose}
        style={{ cursor: "pointer" }}
      />

      <div className="pm-inner" style={{ zIndex: 1201, overflowY: "auto" }}>
        <button className="modal-close" onClick={handleClose} aria-label="Close">
          ✕
        </button>

        <div className="pm-images">
          <Image
            className="pm-main-img"
            src={selectedImage}
            alt={product.name}
            width={500}
            height={600}
            unoptimized
            style={{ width: "100%", height: "auto" }}
          />
          <div className="pm-thumbs">
            {product.images.map((img, idx) => (
              <div
                key={idx}
                className={`pm-thumb ${selectedImage === img ? "active" : ""}`}
                onClick={() => setSelectedImage(img)}
              >
                <Image src={img} alt={`thumbnail ${idx}`} width={60} height={70} unoptimized />
              </div>
            ))}
          </div>
        </div>

        <div className="pm-details">
          <div className="pm-brand">{product.brand}</div>
          <div className="pm-name">{product.name}</div>

          <div className="pm-price-row">
            <span className="pm-price">${product.price}</span>
            {product.originalPrice && <span className="pm-orig-price">${product.originalPrice}</span>}
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="pm-discount">
                -{Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
              </span>
            )}
          </div>

          {sizeProfile && recommendedSize ? (
            <div
              className="ai-size-box"
              style={{
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                borderRadius: "12px",
                border: "1px solid rgba(249, 211, 67, 0.25)",
              }}
            >
              <div className="ai-size-icon">✨</div>
              <div className="ai-size-info">
                <div className="ai-size-label" style={{ color: "var(--gold)", fontWeight: 700 }}>
                  AI Size Recommendation
                </div>
                <div className="ai-size-value" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>Size {recommendedSize}</span>
                  <span
                    style={{
                      fontSize: "11px",
                      background: "rgba(249, 211, 67, 0.15)",
                      color: "var(--gold)",
                      padding: "2px 8px",
                      borderRadius: "20px",
                    }}
                  >
                    {getRecommendedSizeConfidence()}% Confidence
                  </span>
                </div>
                <div className="ai-size-sub" style={{ fontSize: "11px", opacity: 0.8 }}>
                  Mapped successfully from your 3D body measurements.
                </div>
              </div>
            </div>
          ) : (
            <div
              className="find-size-cta"
              onClick={triggerMockScan}
              style={{ border: "1.5px dashed rgba(249,211,67,0.5)", background: "rgba(249,211,67,0.04)" }}
            >
              <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <span>🤖</span> Find your size with AI Body Scanner
              </p>
              <small>Get perfect fit recommendations across all brands in 30 seconds</small>
            </div>
          )}

          <div className="size-selector-label" style={{ marginTop: "12px" }}>
            <span>Select Size</span>
            <span className="size-guide-link" onClick={triggerMockScan}>
              Size Guide &amp; Fit Scan
            </span>
          </div>
          <div className="size-chips-row">
            {product.sizes.map((sz) => (
              <div
                key={sz}
                className={`size-chip-sel ${selectedSize === sz ? "selected" : ""} ${sz === recommendedSize ? "ai-pick" : ""}`}
                onClick={() => setSelectedSize(sz)}
              >
                {sz}
              </div>
            ))}
          </div>

          <div className="pm-actions" style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              className="btn btn-navy btn-lg pm-add-cart"
              onClick={handleAddToCart}
              disabled={isAdding}
              style={{ width: "100%" }}
            >
              {isAdding ? "Adding…" : `Add to Bag — $${product.price.toFixed(2)}`}
            </button>

            <button
              type="button"
              onClick={handleViewMoreDetails}
              style={{
                width: "100%",
                borderRadius: 999,
                border: "1px solid var(--navy)",
                background: "var(--navy-soft, rgba(26,58,82,0.08))",
                color: "var(--navy)",
                padding: "14px 16px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              View More Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
