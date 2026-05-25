"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_PRODUCTS } from "@/lib/data";
import { supabase } from "@/lib/supabase";

type ProductRow = {

  id: number;
  name: string;
  brand: string;
  category: string;
  gender: string;
  price: number;
  original_price: number | null;
  images: string[];
  colors: string[];
  sizes: string[];
  in_stock: boolean;
  rating: number | null;
  reviews: number | null;
  fabric: string | null;
  care: string | null;
  description: string | null;
  tags: string[] | null;
};

function csvToArray(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}


const LOCAL_PRODUCTS_STORAGE_KEY = "drape-admin-products";
const isSupabaseConfigured =
  typeof process !== "undefined" &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0 &&
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith("sb_secret_");

function mapDefaultProductToRow(product: (typeof DEFAULT_PRODUCTS)[number]): ProductRow {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    gender: product.gender,
    price: product.price,
    original_price: product.originalPrice,
    images: product.images,
    colors: product.colors,
    sizes: product.sizes,
    in_stock: product.inStock,
    rating: product.rating,
    reviews: product.reviews,
    fabric: product.fabric,
    care: product.care,
    description: product.description,
    tags: product.tags,
  };
}

function seedLocalProducts(): ProductRow[] {
  const seeded = DEFAULT_PRODUCTS.map(mapDefaultProductToRow);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOCAL_PRODUCTS_STORAGE_KEY, JSON.stringify(seeded));
  }
  return seeded;
}

function readLocalProducts(): ProductRow[] {
  if (typeof window === "undefined") {
    return seedLocalProducts();
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_PRODUCTS_STORAGE_KEY);
    if (!raw) return seedLocalProducts();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as ProductRow[];
    }
  } catch {
    // ignore and fall back to seeded data
  }

  return seedLocalProducts();
}

function persistLocalProducts(products: ProductRow[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOCAL_PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  }
}

function getNextLocalProductId(products: ProductRow[]) {
  return products.reduce((max, product) => Math.max(max, product.id), 0) + 1;
}

type NoticeTone = "success" | "error" | "info";

type NoticeState = {
  tone: NoticeTone;
  text: string;
} | null;

function formatCurrency(value: number) {
  return value.toLocaleString("en-ZA", { style: "currency", currency: "ZAR" });
}

function isSupabaseSchemaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";

  return code === "42P01" || message.includes("Could not find the table") || message.includes("schema cache");
}

type ProductFormState = {
  name: string;
  brand: string; // supplier name in your request
  original_price: string; // keep as string for input
  price: string;
  sizeCSV: string;
  category: string;
  gender: string;
  colorCSV: string;
  imagesCSV: string;
  in_stock: boolean;
  fabric: string;
  care: string;
  description: string;
};

const CATEGORY_OPTIONS = [
  "Shoes",
  "Tops",
  "Bottoms",
  "Accessories",
  "Outerwear",
  "Kids",
  "Sports",
  "Other",
];

const GENDER_OPTIONS = ["Unisex", "Men", "Women", "Kids"];

const FORM_HELP_TEXT = {
  name: "Example: Weekend bomber",
  brand: "Example: Drape Studio",
  category: "Choose the collection shoppers will browse.",
  gender: "Choose the audience for this product.",
  price: "Use the current selling price.",
  original_price: "Optional. Use the previous price if the item is on sale.",
  sizeCSV: "Example: XS, S, M, L",
  colorCSV: "Example: Black, White, Olive",
  imagesCSV: "Example: https://cdn.example.com/image-1.jpg, https://cdn.example.com/image-2.jpg",
  fabric: "Example: 100% organic cotton",
  care: "Example: Machine wash cold",
  description: "Example: Lightweight oversized fit with premium stretch.",
};

function EmptyForm(): ProductFormState {
  return {
    name: "",
    brand: "",
    original_price: "",
    price: "",
    sizeCSV: "",
    category: "",
    gender: "Unisex",
    colorCSV: "",
    imagesCSV: "",
    in_stock: true,
    fabric: "",
    care: "",
    description: "",
  };
}

function AdminProductsContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [filter, setFilter] = useState<string>("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  const [form, setForm] = useState<ProductFormState>(EmptyForm());

  const lastLoadedAtRef = useRef<number>(0);

  const closeModals = () => {
    setCreateOpen(false);
    setEditOpen(false);
    setActiveId(null);
  };

  useEffect(() => {
    if (!createOpen && !editOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModals();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createOpen, editOpen]);

  const filteredProducts = useMemo(() => {

    const q = filter.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const hay = [p.name, p.brand, p.category, p.gender, String(p.id)].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [products, filter]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      if (!isSupabaseConfigured) {
        const localProducts = readLocalProducts();
        setProducts(localProducts);
        lastLoadedAtRef.current = Date.now();
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (isSupabaseSchemaError(error)) {
          const localProducts = readLocalProducts();
          setProducts(localProducts);
          setNotice({ tone: "info", text: "Supabase schema is unavailable. Showing local product data." });
          lastLoadedAtRef.current = Date.now();
          return;
        }

        throw error;
      }

      setProducts((data as ProductRow[]) || []);
      lastLoadedAtRef.current = Date.now();
    } catch (e: unknown) {
      if (isSupabaseSchemaError(e)) {
        setProducts(readLocalProducts());
        setNotice({ tone: "info", text: "Supabase schema is unavailable. Showing local product data." });
        return;
      }

      setError(e instanceof Error ? e.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Avoid calling setState synchronously within effect body by starting async work in a microtask
    const run = async () => {
      await loadProducts();
    };
    void run();
  }, []);



  const openCreate = () => {
    setNotice(null);
    setError(null);
    setForm(EmptyForm());
    setActiveId(null);
    setEditOpen(false);
    setCreateOpen(true);
  };

  const openEdit = (p: ProductRow) => {
    setNotice(null);
    setError(null);
    setActiveId(p.id);
    setCreateOpen(false);
    setEditOpen(true);

    setForm({
      name: p.name || "",
      brand: p.brand || "",
      original_price: p.original_price !== null && p.original_price !== undefined ? String(p.original_price) : "",
      price: p.price !== null && p.price !== undefined ? String(p.price) : "",
      sizeCSV: (p.sizes || []).join(", "),
      category: p.category || "",
      gender: p.gender || "Unisex",
      colorCSV: (p.colors || []).join(", "),
      imagesCSV: (p.images || []).join(", "),
      in_stock: !!p.in_stock,
      fabric: p.fabric || "",
      care: p.care || "",
      description: p.description || "",
    });
  };

  const validateForm = () => {
    const name = form.name.trim();
    const brand = form.brand.trim();
    const category = form.category.trim();

    const priceNum = Number(form.price);
    if (!name) return "Name is required";
    if (!brand) return "Supplier name (brand) is required";
    if (!category) return "Category is required";
    if (!form.price.trim() || Number.isNaN(priceNum) || priceNum < 0) return "Valid price is required";

    return null;
  };

  const submitCreate = async () => {
    const v = validateForm();
    if (v) {
      setError(v);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (!isSupabaseConfigured) {
        const nextProduct: ProductRow = {
          id: getNextLocalProductId(products),
          name: form.name.trim(),
          brand: form.brand.trim(),
          category: form.category.trim(),
          gender: form.gender.trim() || "Unisex",
          price: Number(form.price),
          original_price: form.original_price.trim() ? Number(form.original_price) : null,
          images: csvToArray(form.imagesCSV),
          colors: csvToArray(form.colorCSV),
          sizes: csvToArray(form.sizeCSV),
          in_stock: form.in_stock,
          rating: null,
          reviews: null,
          fabric: form.fabric.trim() || null,
          care: form.care.trim() || null,
          description: form.description.trim() || null,
          tags: [],
        };

        const nextProducts = [nextProduct, ...products];
        persistLocalProducts(nextProducts);
        setProducts(nextProducts);

        setNotice({ tone: "success", text: "Product created successfully." });
        closeModals();
        return;
      }

      const payload: Partial<ProductRow> = {

        name: form.name.trim(),
        brand: form.brand.trim(),
        category: form.category.trim(),
        gender: form.gender.trim() || "Unisex",
        price: Number(form.price),
        original_price: form.original_price.trim() ? Number(form.original_price) : null,
        images: csvToArray(form.imagesCSV),
        colors: csvToArray(form.colorCSV),
        sizes: csvToArray(form.sizeCSV),
        in_stock: form.in_stock,
        fabric: form.fabric.trim() || null,
        care: form.care.trim() || null,
        description: form.description.trim() || null,
      };

      const { data, error } = await (supabase as any)
        .from("products")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;

      setProducts((prev) => [data as ProductRow, ...prev]);
      setNotice({ tone: "success", text: "Product created successfully." });
      closeModals();
    } catch (e: unknown) {
      setNotice(null);
      const message = e instanceof Error ? e.message : "Failed to create product";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async () => {
    if (activeId === null) return;

    const v = validateForm();
    if (v) {
      setError(v);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (!isSupabaseConfigured) {
        setProducts((prev) => {
          const updatedProducts = prev.map((product) =>
            product.id === activeId
              ? {
                  ...product,
                  name: form.name.trim(),
                  brand: form.brand.trim(),
                  category: form.category.trim(),
                  gender: form.gender.trim() || "Unisex",
                  price: Number(form.price),
                  original_price: form.original_price.trim() ? Number(form.original_price) : null,
                  images: csvToArray(form.imagesCSV),
                  colors: csvToArray(form.colorCSV),
                  sizes: csvToArray(form.sizeCSV),
                  in_stock: form.in_stock,
                  fabric: form.fabric.trim() || null,
                  care: form.care.trim() || null,
                  description: form.description.trim() || null,
                }
              : product
          );

          persistLocalProducts(updatedProducts);
          return updatedProducts;
        });

        setNotice({ tone: "success", text: "Product updated successfully." });
        closeModals();
        return;
      }

      const payload: Partial<ProductRow> = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        category: form.category.trim(),
        gender: form.gender.trim() || "Unisex",
        price: Number(form.price),
        original_price: form.original_price.trim() ? Number(form.original_price) : null,
        images: csvToArray(form.imagesCSV),
        colors: csvToArray(form.colorCSV),
        sizes: csvToArray(form.sizeCSV),
        in_stock: form.in_stock,
        fabric: form.fabric.trim() || null,
        care: form.care.trim() || null,
        description: form.description.trim() || null,
      };

      const { data, error } = await (supabase as any)
        .from("products")
        .update(payload)
        .eq("id", activeId)
        .select("*")
        .single();

      if (error) throw error;

      setProducts((prev) => prev.map((p) => (p.id === activeId ? (data as ProductRow) : p)));
      setNotice({ tone: "success", text: "Product updated successfully." });
      closeModals();
    } catch (e: unknown) {
      setNotice(null);
      const message = e instanceof Error ? e.message : "Failed to update product";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: number) => {
    const ok = confirm(`Delete product #${id}? This cannot be undone.`);
    if (!ok) return;

    setDeletingId(id);
    setError(null);
    setNotice(null);

    try {
      if (!isSupabaseConfigured) {
        setProducts((prev) => {
          const nextProducts = prev.filter((product) => product.id !== id);
          persistLocalProducts(nextProducts);
          return nextProducts;
        });
        setNotice({ tone: "success", text: "Product deleted successfully." });
        return;
      }

      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setNotice({ tone: "success", text: "Product deleted successfully." });
    } catch (e: unknown) {
      setNotice(null);
      const message = e instanceof Error ? e.message : "Failed to delete product";
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-products-shell">
      <div className="admin-products-header">
        <div className="admin-products-hero-card">
          <div>
            <div className="admin-kicker">Admin</div>
            <h1 className="admin-page-title">Products</h1>
            <p className="admin-page-copy">
              Manage your catalog, pricing, and inventory from one clear overview.
            </p>
          </div>

          <div className="admin-products-stats">
            <span className="admin-pill admin-pill-success">
              {isSupabaseConfigured ? "Supabase connected" : "Offline storage mode"}
            </span>
            <span className="admin-pill admin-pill-info">
              {products.length} products in view
            </span>
            <span className="admin-pill admin-pill-neutral">
              {products.filter((product) => product.in_stock).length} in stock
            </span>
          </div>
        </div>

        <button type="button" onClick={openCreate} className="admin-cta-button">
          + Add product
        </button>
      </div>

      <div className="admin-products-search-panel">
        <div className="admin-search-layout">
          <label className="admin-search-field">
            <span className="admin-search-label">Search products</span>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search by name, brand, category, or ID"
              className="admin-search-input"
            />
          </label>
          <div className="admin-search-actions">
            <span className="admin-count-pill">
              {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
            </span>
            {filter.trim() ? (
              <button type="button" onClick={() => setFilter("")} className="admin-secondary-button">
                Clear search
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <div
          style={{
            marginBottom: 16,
            borderRadius: 12,
            padding: 12,
            background: "rgba(248, 113, 113, 0.14)",
            color: "#fecaca",
          }}
        >
          {error}
        </div>
      ) : null}

      {notice ? (
        <div
          style={{
            marginBottom: 16,
            borderRadius: 12,
            padding: 12,
            background:
              notice.tone === "success"
                ? "rgba(74, 222, 128, 0.14)"
                : notice.tone === "info"
                  ? "rgba(59, 130, 246, 0.14)"
                  : "rgba(248, 113, 113, 0.14)",
            color: notice.tone === "success" ? "#bbf7d0" : notice.tone === "info" ? "#bfdbfe" : "#fecaca",
          }}
        >
          {notice.text}
        </div>
      ) : null}

      {loading ? (
        <div className="admin-empty-state">Loading products…</div>
      ) : filteredProducts.length === 0 ? (
        <div className="admin-empty-state admin-empty-state-soft">
          <div className="admin-empty-title">No products match your search.</div>
          <p className="admin-empty-copy">
            Try a different keyword or add a new product to get started.
          </p>
          <div className="admin-empty-actions">
            {filter.trim() ? (
              <button type="button" onClick={() => setFilter("")} className="admin-secondary-button">
                Clear search
              </button>
            ) : null}
            <button type="button" onClick={openCreate} className="admin-cta-button admin-cta-button-inline">
              + Add product
            </button>
          </div>
        </div>
      ) : (
        <div className="admin-products-table-wrap">
          <table className="admin-products-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td data-label="ID">{product.id}</td>
                  <td data-label="Product">
                    <div className="admin-product-cell">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="admin-product-thumb" />
                      ) : (
                        <div className="admin-product-thumb admin-product-thumb-fallback">∎</div>
                      )}
                      <div>
                        <div className="admin-product-name">{product.name}</div>
                        <div className="admin-product-meta">{product.gender}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Brand">{product.brand}</td>
                  <td data-label="Category">{product.category}</td>
                  <td data-label="Stock">
                    <span className={product.in_stock ? "admin-stock-badge admin-stock-badge-success" : "admin-stock-badge admin-stock-badge-danger"}>
                      {product.in_stock ? "In stock" : "Out of stock"}
                    </span>
                  </td>
                  <td data-label="Price">
                    <div className="admin-price-block">
                      <div className="admin-price-value">{formatCurrency(product.price)}</div>
                      {product.original_price ? (
                        <div className="admin-price-meta">Was {formatCurrency(product.original_price)}</div>
                      ) : null}
                    </div>
                  </td>
                  <td data-label="Actions">
                    <div className="admin-action-row">
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        disabled={deletingId !== null}
                        className="admin-secondary-button"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(product.id)}
                        disabled={deletingId === product.id}
                        className="admin-delete-button"
                      >
                        {deletingId === product.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(createOpen || editOpen) ? (
        <div className="admin-modal-backdrop" onClick={closeModals}>
          <div className="admin-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <div className="admin-kicker">{editOpen ? "Edit product" : "Create product"}</div>
                <h2 className="admin-modal-title">{editOpen ? "Update product details" : "Add a new product"}</h2>
                <p className="admin-modal-copy">
                  {editOpen
                    ? "Update pricing, stock, and imagery for the selected product."
                    : "Add a product and use the guided fields below to save a complete listing."}
                </p>
              </div>
              <button type="button" onClick={closeModals} className="admin-modal-close">
                ✕
              </button>
            </div>

            <div className="admin-products-form-grid">
              <label className="admin-form-field">
                <span className="admin-form-label">Name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder={FORM_HELP_TEXT.name}
                  className="admin-form-input"
                />
                <span className="admin-form-help">{FORM_HELP_TEXT.name}</span>
              </label>
              <label className="admin-form-field">
                <span className="admin-form-label">Brand</span>
                <input
                  value={form.brand}
                  onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                  required
                  placeholder={FORM_HELP_TEXT.brand}
                  className="admin-form-input"
                />
                <span className="admin-form-help">{FORM_HELP_TEXT.brand}</span>
              </label>
              <label className="admin-form-field">
                <span className="admin-form-label">Category</span>
                <select
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  required
                  className="admin-form-input"
                >
                  <option value="">Select a category</option>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <span className="admin-form-help">{FORM_HELP_TEXT.category}</span>
              </label>
              <label className="admin-form-field">
                <span className="admin-form-label">Gender</span>
                <select
                  value={form.gender}
                  onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                  className="admin-form-input"
                >
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <span className="admin-form-help">{FORM_HELP_TEXT.gender}</span>
              </label>
              <label className="admin-form-field">
                <span className="admin-form-label">Price</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  required
                  placeholder="e.g. 149"
                  className="admin-form-input"
                />
                <span className="admin-form-help">{FORM_HELP_TEXT.price}</span>
              </label>
              <label className="admin-form-field">
                <span className="admin-form-label">Original price</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={form.original_price}
                  onChange={(e) => setForm((prev) => ({ ...prev, original_price: e.target.value }))}
                  placeholder="e.g. 199"
                  className="admin-form-input"
                />
                <span className="admin-form-help">{FORM_HELP_TEXT.original_price}</span>
              </label>
              <label className="admin-form-field">
                <span className="admin-form-label">Sizes</span>
                <input
                  value={form.sizeCSV}
                  onChange={(e) => setForm((prev) => ({ ...prev, sizeCSV: e.target.value }))}
                  placeholder={FORM_HELP_TEXT.sizeCSV}
                  className="admin-form-input"
                />
                <span className="admin-form-help">{FORM_HELP_TEXT.sizeCSV}</span>
              </label>
              <label className="admin-form-field">
                <span className="admin-form-label">Colors</span>
                <input
                  value={form.colorCSV}
                  onChange={(e) => setForm((prev) => ({ ...prev, colorCSV: e.target.value }))}
                  placeholder={FORM_HELP_TEXT.colorCSV}
                  className="admin-form-input"
                />
                <span className="admin-form-help">{FORM_HELP_TEXT.colorCSV}</span>
              </label>
              <label className="admin-form-field">
                <span className="admin-form-label">Images</span>
                <input
                  value={form.imagesCSV}
                  onChange={(e) => setForm((prev) => ({ ...prev, imagesCSV: e.target.value }))}
                  placeholder={FORM_HELP_TEXT.imagesCSV}
                  className="admin-form-input"
                />
                <span className="admin-form-help">{FORM_HELP_TEXT.imagesCSV}</span>
              </label>
              <label className="admin-form-field">
                <span className="admin-form-label">Fabric</span>
                <input
                  value={form.fabric}
                  onChange={(e) => setForm((prev) => ({ ...prev, fabric: e.target.value }))}
                  placeholder={FORM_HELP_TEXT.fabric}
                  className="admin-form-input"
                />
                <span className="admin-form-help">{FORM_HELP_TEXT.fabric}</span>
              </label>
              <label className="admin-form-field">
                <span className="admin-form-label">Care</span>
                <input
                  value={form.care}
                  onChange={(e) => setForm((prev) => ({ ...prev, care: e.target.value }))}
                  placeholder={FORM_HELP_TEXT.care}
                  className="admin-form-input"
                />
                <span className="admin-form-help">{FORM_HELP_TEXT.care}</span>
              </label>
              <label className="admin-form-field admin-form-field-wide">
                <span className="admin-form-label">Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  placeholder={FORM_HELP_TEXT.description}
                  className="admin-form-input"
                />
                <span className="admin-form-help">{FORM_HELP_TEXT.description}</span>
              </label>
              <label className="admin-form-checkbox admin-form-field-wide">
                <input
                  type="checkbox"
                  checked={form.in_stock}
                  onChange={(e) => setForm((prev) => ({ ...prev, in_stock: e.target.checked }))}
                  className="admin-checkbox-input"
                />
                <span className="admin-form-checkbox-text">
                  <span className="admin-form-checkbox-title">In stock</span>
                  <span className="admin-form-checkbox-copy">Keep this checked when the product is available for purchase.</span>
                </span>
              </label>
            </div>

            <div className="admin-modal-actions">
              <button type="button" onClick={closeModals} className="admin-secondary-button">
                Cancel
              </button>
              <button
                type="button"
                onClick={editOpen ? submitEdit : submitCreate}
                disabled={saving}
                className="admin-cta-button admin-cta-button-inline"
              >
                {saving ? "Saving…" : editOpen ? "Save changes" : "Create product"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div style={{ padding: "80px", textAlign: "center" }}>Loading Products…</div>}>
      <AdminProductsContent />
    </Suspense>
  );
}
