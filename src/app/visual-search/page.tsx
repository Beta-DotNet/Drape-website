"use client";

import { VS_PRESETS, DEFAULT_PRODUCTS } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import { useState } from "react";

export default function VisualSearchPage() {
  const [results, setResults] = useState(false);

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

        <div className="vs-upload-zone" id="vs-upload-zone">
          <input type="file" id="vs-file-input" accept="image/*" />
          <div className="vs-upload-icon">🖼</div>
          <h3>Drop your photo here</h3>
          <p>Or click to browse &bull; JPG, PNG, WEBP supported</p>
          <button
            className="btn btn-navy btn-sm"
            style={{ marginTop: "16px", position: "relative", zIndex: 1 }}
            onClick={() => document.getElementById("vs-file-input")?.click()}
          >
            Choose File
          </button>
        </div>

        <p className="vs-section-label">&mdash; or try a style preset &mdash;</p>
        <div className="vs-presets" id="vs-presets">
          {VS_PRESETS.map((preset, i) => (
            <div
              key={i}
              className="vs-preset-card"
              onClick={() => setResults(true)}
            >
              <img src={preset.img} alt={preset.label} />
              <div className="vs-preset-label">{preset.label}</div>
            </div>
          ))}
        </div>

        {results && (
          <div id="vs-results-section">
            <div className="vs-results-title" id="vs-results-title">
              Showing matches for your style
            </div>
            <div className="products-grid" id="vs-results-grid">
              {DEFAULT_PRODUCTS.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
