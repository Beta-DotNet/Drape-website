"use client";

import { VS_PRESETS } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import { useRef, useState } from "react";
import { ProductCardSkeleton } from "@/components/skeletons";

export default function VisualSearchPage() {
  const [results, setResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const showResults = () => {
    setIsSearching(true);
    setResults(true);
    setTimeout(() => setIsSearching(false), 300);
  };


  return (
    <section id="view-visual-search" className="view active">
      <div className="vs-view">
        <div className="vs-view-header">
          <h2>Search by Image</h2>
          <p>
            Upload a photo of any outfit or choose a style preset to find
            visually similar items in our catalog.
          </p>
        </div>

        <div className="vs-upload-zone" id="vs-upload-zone" role="group" aria-label="Upload a photo">
          <input
            ref={fileInputRef}
            type="file"
            id="vs-file-input"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              setUploadError(null);
              const f = e.target.files?.[0] ?? null;
              if (!f) {
                setSelectedFileName(null);
                return;
              }
              if (!/^image\//.test(f.type)) {
                setUploadError("Please select an image file.");
                setSelectedFileName(null);
                return;
              }
              setSelectedFileName(f.name);
              // Note: currently results are demo/static; this only improves UX + accessibility.
              setResults(false);
              setTimeout(() => showResults(), 150);
            }}
          />

          <button
            type="button"
            className="vs-upload-zone"
            style={{
              // keeps existing layout while making the whole area keyboard/click accessible
              all: "unset",
              display: "flex",
              flexDirection: "column",
              width: "100%",
              cursor: "pointer",
            }}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            aria-label="Upload a photo"
          >
            <div className="vs-upload-icon">
              <img src="/images/instagram-search-icon.svg" alt="Upload" style={{ width: 28, height: 28 }} />
            </div>
            <h3>Drop your photo here</h3>
            <p>Or click to browse &bull; JPG, PNG, WEBP supported</p>

            {selectedFileName && (
              <p className="vs-upload-filename" style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
                Selected: <strong>{selectedFileName}</strong>
              </p>
            )}
            {uploadError && (
              <p
                className="vs-upload-error"
                role="alert"
                style={{ marginTop: 10, fontSize: 12, color: "#b45309", fontWeight: 700 }}
              >
                {uploadError}
              </p>
            )}

            <button
              className="btn btn-navy btn-sm"
              style={{ marginTop: "16px", position: "relative", zIndex: 1 }}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Choose File
            </button>
          </button>
        </div>


        <p className="vs-section-label">&mdash; or try a style preset &mdash;</p>
        <div className="vs-presets" id="vs-presets" role="list" aria-label="Style presets">
          {VS_PRESETS.map((preset, i) => (
            <button
              key={i}
              type="button"
              className="vs-preset-card"
              onClick={showResults}
              role="listitem"
              aria-label={`Try preset: ${preset.label}`}
            >
              <img src={preset.img} alt={preset.label} />
              <div className="vs-preset-label">{preset.label}</div>
            </button>
          ))}
        </div>


{results && (
          <div id="vs-results-section" aria-live="polite">
            <div className="vs-results-title" id="vs-results-title">
              Showing matches for your style
            </div>
            <div className="products-grid" id="vs-results-grid">
              {isSearching ? (
                <div className="product-grid-loading">
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                </div>
              ) : (
                <div style={{ padding: "24px", color: "var(--text-soft)", textAlign: "center" }}>
                  Visual search results will appear here.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
