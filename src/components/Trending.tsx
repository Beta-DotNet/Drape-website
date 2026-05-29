"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/lib/data";
import ProductCard from "./ProductCard";
import { ProductGridSkeleton } from "./skeletons";

function mapSupabaseProductRow(row: unknown): Product {
  const product = row as Partial<{
    id: number | string;
    name: string;
    brand: string;
    category: string;
    gender: string | null;
    price: number | string;
    original_price: number | string | null;
    images: unknown;
    colors: unknown;
    sizes: unknown;
    rating: number | null;
    reviews: number | null;
    fabric: string | null;
    care: string | null;
    description: string | null;
    tags: unknown;
    in_stock: boolean | null;
  }>;

  return {
    id: typeof product.id === "number" ? product.id : Number(product.id ?? 0),
    name: typeof product.name === "string" ? product.name : "",
    brand: typeof product.brand === "string" ? product.brand : "",
    category: typeof product.category === "string" ? product.category : "",
    gender: typeof product.gender === "string" ? product.gender : "Unisex",
    price: typeof product.price === "number" ? product.price : Number(product.price ?? 0),
    originalPrice:
      typeof product.original_price === "number"
        ? product.original_price
        : typeof product.original_price === "string"
          ? Number(product.original_price)
          : null,
    images: Array.isArray(product.images)
      ? product.images.filter((item): item is string => typeof item === "string")
      : [],
    colors: Array.isArray(product.colors)
      ? product.colors.filter((item): item is string => typeof item === "string")
      : [],
    sizes: Array.isArray(product.sizes)
      ? product.sizes.filter((item): item is string => typeof item === "string")
      : [],
    rating: typeof product.rating === "number" ? product.rating : 0,
    reviews: typeof product.reviews === "number" ? product.reviews : 0,
    fabric: typeof product.fabric === "string" ? product.fabric : "",
    care: typeof product.care === "string" ? product.care : "",
    description: typeof product.description === "string" ? product.description : "",
    tags: Array.isArray(product.tags)
      ? product.tags.filter((item): item is string => typeof item === "string")
      : [],
    inStock: typeof product.in_stock === "boolean" ? product.in_stock : Boolean(product.in_stock),
  };
}

export default function Trending() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("rating", { ascending: false })
          .order("reviews", { ascending: false });

        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        const liveProducts = Array.isArray(data) ? data.map(mapSupabaseProductRow) : [];
        setProducts(liveProducts);
      } catch {
        if (isMounted) {
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <ProductGridSkeleton />;
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="trending-section">
      <div className="section-heading">
        <div className="line"></div>
        <span className="section-label">Trending</span>
        <div className="line"></div>
      </div>
      <div className="products-grid" id="trending-grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
