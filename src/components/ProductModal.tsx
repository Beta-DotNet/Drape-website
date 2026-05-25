"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Product, DEFAULT_PRODUCTS } from "@/lib/data";
import { useProductModal } from "./ProductModalContext";
import ReviewSystem from "./ReviewSystem";

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


export default function ProductModal({ product, onClose }: ProductModalProps) {
  const { openProductModal } = useProductModal();
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [accordions, setAccordions] = useState({ details: true, fabric: false });
  const [sizeProfile, setSizeProfile] = useState<SizeProfile | null>(null);
  const [recommendedSize, setRecommendedSize] = useState<string>("");
  const [toastMessage, setToastMessage] = useState("");
  const toastTimeoutRef = useRef<number | null>(null);

  // Determine recommended size based on profile and product category
  const determineRecommendedSize = useCallback((profile: SizeProfile, prod: Product) => {
    if (!profile) return;
    
    const cat = prod.category.toLowerCase();
    
    if (cat === "shoes") {
      // Default shoe size
      const sz = profile.shoeSize || profile.brandSizes?.Nike?.Shoes || "9";
      setRecommendedSize(sz);
    } else if (cat === "bottoms") {
      const sz = profile.brandSizes?.[prod.brand]?.Bottoms || profile.brandSizes?.Nike?.Bottoms || "M";
      setRecommendedSize(sz);
    } else {
      // Tops / accessories / default
      const sz = profile.brandSizes?.[prod.brand]?.Tops || profile.brandSizes?.Nike?.Tops || "L";
      setRecommendedSize(sz);
    }
  }, []);

  const getRecommendedSizeConfidence = () => {
    if (!sizeProfile) return 0;
    // Mock high-confidence matching logic
    return 92 + (product.id % 7); 
  };

  // Sync state when product changes
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- Resetting derived state when product prop changes */
    setSelectedImage(product.images[0]);
    setSelectedSize(product.sizes[0] || "");
    setSelectedColor(product.colors[0] || "");
    
    // Load Size Profile from localStorage
    try {
      const stored = localStorage.getItem("drape_size_profile");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSizeProfile(parsed);
        determineRecommendedSize(parsed, product);
      } else {
        setSizeProfile(null);
        setRecommendedSize("");
      }
    } catch (e) {
      console.error("Error loading size profile:", e);
    }
    /* eslint-enable react-hooks/set-state-in-effect */

  }, [product, determineRecommendedSize]);

  // Quick Add To Bag
  const handleAddToCart = () => {
    try {
      const stored = localStorage.getItem("drape_cart") || "[]";
      const cart = JSON.parse(stored);
      
      const itemIndex = cart.findIndex((item: { product_id: number; size: string; quantity: number }) => item.product_id === product.id && item.size === selectedSize);
      
      if (itemIndex > -1) {
        cart[itemIndex].quantity += 1;
      } else {
        cart.push({
          product_id: product.id,
          name: product.name,
          brand: product.brand,
          price: product.price,
          image: product.images[0],
          size: selectedSize || "L",
          color: selectedColor || "Default",
          quantity: 1,
          isAiMatched: selectedSize === recommendedSize
        });
      }
      
      localStorage.setItem("drape_cart", JSON.stringify(cart));
      // Dispatch cart updated event to refresh the Header cart badge
      window.dispatchEvent(new Event("cart_updated"));
      setToastMessage(`${product.name} (Size ${selectedSize || "L"}) added to bag!`);
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = window.setTimeout(() => {
        setToastMessage("");
      }, 2400);
    } catch (e) {
      console.error("Error adding to cart:", e);
    }
  };

  // Size Wizard Quick trigger
  const triggerMockScan = () => {
    // Write a high-quality mock profile to localStorage to showcase AI size mapping
    const mockProfile = {
      hasScanned: true,
      measurements: {
        height: 180,
        weight: 75,
        chest: 98,
        waist: 82,
        hips: 100,
        inseam: 80,
        shoeSize: "9"
      },
      brandSizes: {
        Nike: { Tops: "L", Bottoms: "M", Shoes: "10" },
        Zara: { Tops: "M", Bottoms: "M", Shoes: "9.5" },
        "Retro Supply": { Tops: "L", Bottoms: "L", Shoes: "10" },
        "Jonathan D": { Tops: "L", Bottoms: "32", Shoes: "9" }
      }
    };
    
    localStorage.setItem("drape_size_profile", JSON.stringify(mockProfile));
    setSizeProfile(mockProfile);
    determineRecommendedSize(mockProfile, product);
    alert("AI scan successful! Your size recommendations are now active across all products.");
  };

  // Complete the Look filter
  const completeLookItems = DEFAULT_PRODUCTS.filter(
    (p) => p.id !== product.id && (p.category === product.category || p.brand === product.brand)
  ).slice(0, 4);

  return (
    <div className="product-modal active" role="dialog" aria-modal="true" style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 2000,
          padding: "12px 16px",
          borderRadius: 999,
          background: "rgba(15, 23, 42, 0.96)",
          color: "#fff",
          fontSize: 14,
          fontWeight: 700,
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.24)",
          transform: toastMessage ? "translateY(0)" : "translateY(120%)",
          opacity: toastMessage ? 1 : 0,
          transition: "transform 220ms ease, opacity 220ms ease",
          pointerEvents: "none",
          maxWidth: 320,
        }}
      >
        {toastMessage}
      </div>
      {/* Overlay Backdrop */}
      <div 
        className="overlay-backdrop active" 
        onClick={onClose} 
        style={{ cursor: "pointer" }}
      />
      
      <div className="pm-inner" style={{ zIndex: 1201, overflowY: "auto" }}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        
        {/* Images Columns */}
        <div className="pm-images">
          <Image className="pm-main-img" id="pm-main-img" src={selectedImage} alt={product.name} width={500} height={600} unoptimized style={{ width: '100%', height: 'auto' }} />
          <div className="pm-thumbs" id="pm-thumbs">
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

        {/* Details Column */}
        <div className="pm-details">
          <div className="pm-brand">{product.brand}</div>
          <div className="pm-name">{product.name}</div>
          
          <div className="pm-price-row">
            <span className="pm-price">${product.price}</span>
            {product.originalPrice && (
              <span className="pm-orig-price">${product.originalPrice}</span>
            )}
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="pm-discount">
                -{Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
              </span>
            )}
          </div>

          {/* AI Size Guidance Dashboard */}
          {sizeProfile && recommendedSize ? (
            <div className="ai-size-box" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: "12px", border: "1px solid rgba(249, 211, 67, 0.25)" }}>
              <div className="ai-size-icon">✨</div>
              <div className="ai-size-info">
                <div className="ai-size-label" style={{ color: "var(--gold)", fontWeight: 700 }}>AI Size Recommendation</div>
                <div className="ai-size-value" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>Size {recommendedSize}</span>
                  <span style={{ fontSize: "11px", background: "rgba(249, 211, 67, 0.15)", color: "var(--gold)", padding: "2px 8px", borderRadius: "20px" }}>
                    {getRecommendedSizeConfidence()}% Confidence
                  </span>
                </div>
                <div className="ai-size-sub" style={{ fontSize: "11px", opacity: 0.8 }}>
                  Mapped successfully from your 3D body measurements.
                </div>
              </div>
            </div>
          ) : (
            <div className="find-size-cta" onClick={triggerMockScan} style={{ border: "1.5px dashed rgba(249,211,67,0.5)", background: "rgba(249,211,67,0.04)" }}>
              <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <span>🤖</span> Find your size with AI Body Scanner
              </p>
              <small>Get perfect fit recommendations across all brands in 30 seconds</small>
            </div>
          )}

          {/* Size Selector */}
          <div className="size-selector-label" style={{ marginTop: "12px" }}>
            <span>Select Size</span>
            <span className="size-guide-link" onClick={triggerMockScan}>Size Guide &amp; Fit Scan</span>
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

          {/* Add to Bag Actions */}
          <div className="pm-actions" style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <button className="btn btn-navy btn-lg pm-add-cart" onClick={handleAddToCart} style={{ width: "100%" }}>
              Add to Bag — ${(product.price).toFixed(2)}
            </button>
            <button 
              className="btn btn-outline btn-lg" 
              onClick={() => {
                onClose();
                window.location.href = `/chat?product=${product.id}`;
              }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%" }}
            >
              💬 Chat with Seller
            </button>
          </div>

          {/* Accordion Panels */}
          <div className="product-details-accordion" style={{ marginTop: "16px" }}>
            <div className="accordion-item">
              <button 
                className={`accordion-trigger ${accordions.details ? "open" : ""}`}
                onClick={() => setAccordions((prev) => ({ ...prev, details: !prev.details }))}
              >
                Product Details <span className="accordion-arrow">{accordions.details ? "▲" : "▼"}</span>
              </button>
              <div className="accordion-content" style={{ display: accordions.details ? "block" : "none" }}>
                {product.description || "Premium styling and robust fabrics engineered for long lasting style."}
              </div>
            </div>
            
            <div className="accordion-item">
              <button 
                className={`accordion-trigger ${accordions.fabric ? "open" : ""}`}
                onClick={() => setAccordions((prev) => ({ ...prev, fabric: !prev.fabric }))}
              >
                Fabric &amp; Care <span className="accordion-arrow">{accordions.fabric ? "▲" : "▼"}</span>
              </button>
              <div className="accordion-content" style={{ display: accordions.fabric ? "block" : "none" }}>
                <p><strong>Fabric:</strong> {product.fabric || "Premium quality woven blend."}</p>
                <p style={{ marginTop: "4px" }}><strong>Care:</strong> {product.care || "Dry clean or cool gentle machine wash."}</p>
              </div>
            </div>
          </div>

          {/* Complete the Look Carousel */}
          {completeLookItems.length > 0 && (
            <div className="complete-look" style={{ marginTop: "24px" }}>
              <h4>Complete the Look</h4>
              <div className="look-items">
                {completeLookItems.map((look) => (
                  <div 
                    key={look.id} 
                    className="look-item"
                    onClick={() => openProductModal(look)}
                  >
                    <Image src={look.images[0]} alt={look.name} width={100} height={120} unoptimized />
                    <p style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {look.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="reviews-section" style={{ borderTop: "1px solid var(--border)", paddingTop: "24px", marginTop: "24px" }}>
            <ReviewSystem product={product} initialAverage={product.rating} initialCount={product.reviews} />
          </div>
        </div>
      </div>
    </div>
  );
}
