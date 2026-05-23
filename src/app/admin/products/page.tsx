"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
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

function toStringList(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function csvToArray(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
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

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [filter, setFilter] = useState<string>("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  const [form, setForm] = useState<ProductFormState>(EmptyForm());

  const lastLoadedAtRef = useRef<number>(0);

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
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts((data as ProductRow[]) || []);
      lastLoadedAtRef.current = Date.now();
    } catch (e: any) {
      setError(e?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setForm(EmptyForm());
    setActiveId(null);
    setEditOpen(false);
    setCreateOpen(true);
  };

  const openEdit = (p: ProductRow) => {
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

  const closeModals = () => {
    setCreateOpen(false);
    setEditOpen(false);
    setActiveId(null);
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
        // rating/reviews/tags can be left to defaults
      };

      const { data, error } = await supabase.from("products").insert(payload).select("*").single();
      if (error) throw error;

      setProducts((prev) => [data as ProductRow, ...prev]);
      closeModals();
    } catch (e: any) {
      setError(e?.message || "Failed to create product");
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

      const { data, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", activeId)
        .select("*")
        .single();

      if (error) throw error;

      setProducts((prev) => prev.map((p) => (p.id === activeId ? (data as ProductRow) : p)));
      closeModals();
    } catch (e: any) {
      setError(e?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: number) => {
    const ok = confirm(`Delete product #${id}? This cannot be undone.`);
    if (!ok) return;

    setDeletingId(id);
    setError(null);
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) {
      setError(e?.message || "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: 20,
        minHeight: "calc(100vh - var(--header-h))",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gold)" }}>
            Admin
          </div>
          <h1 style={{ margin
