import { supabase } from "@/lib/supabase";
import { Product, DEFAULT_PRODUCTS } from "./data";

export interface SearchSuggestions {
  originalQuery: string;
  translatedQuery: string | null;
  shonaTerm: string | null;
  categories: string[];
  products: Product[];
}

// Robust local fallback dictionary mapping Shona terms to English equivalents
export const SHONA_DICTIONARY: Record<string, string> = {
  shangu: "shoes",
  bhurugwa: "pants",
  hembe: "shirt",
  rokwe: "dress",
  bhachi: "jacket",
  heti: "hat",
  zvipfeko: "clothing",
  shati: "shirt",
  bhutsu: "shoes",
  keds: "shoes",
  sokisi: "socks"
};

/**
 * Translates any Shona terms in a search query to their English equivalent.
 * Utilises Supabase 'shona_dictionary' database with a local robust fallback dictionary.
 */
export async function translateShonaTerm(query: string): Promise<{ 
  translated: string; 
  isShona: boolean; 
  shonaTerm: string | null; 
}> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return { translated: query, isShona: false, shonaTerm: null };
  }

  // Split query into words to translate them individually
  const words = cleanQuery.split(/\s+/);
  let isShona = false;
  let shonaTerm: string | null = null;

  const translatedWords = await Promise.all(
    words.map(async (word) => {
      // Clean word from punctuation
      const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      
      // 1. Try Supabase dictionary lookup
      try {
        const { data, error } = await supabase
          .from("shona_dictionary")
          .select("english_translation")
          .eq("shona_term", cleanWord)
          .maybeSingle();

        if (!error && data && data.english_translation) {
          isShona = true;
          shonaTerm = cleanWord;
          return data.english_translation;
        }
      } catch (e) {
        console.warn("Supabase dictionary lookup failed, falling back...", e);
      }

      // 2. Try Local fallback dictionary lookup
      if (SHONA_DICTIONARY[cleanWord]) {
        isShona = true;
        shonaTerm = cleanWord;
        return SHONA_DICTIONARY[cleanWord];
      }

      return word; // Keep original word if no match
    })
  );

  return {
    translated: translatedWords.join(" "),
    isShona,
    shonaTerm
  };
}

/**
 * Generates search suggestions including translations, matching categories, and products.
 */
export async function getSearchSuggestions(query: string): Promise<SearchSuggestions> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return {
      originalQuery: trimmed,
      translatedQuery: null,
      shonaTerm: null,
      categories: [],
      products: []
    };
  }

  // Translate first
  const { translated, isShona, shonaTerm } = await translateShonaTerm(trimmed);
  const activeSearchQuery = isShona ? translated : trimmed;
  const lowerQuery = activeSearchQuery.toLowerCase();

  // Find matching categories from the database or static catalog
  const allCategories = ["Shoes", "Tops", "Bottoms", "Accessories", "Kids"];
  const matchingCategories = allCategories.filter(cat => 
    cat.toLowerCase().includes(lowerQuery) || 
    lowerQuery.includes(cat.toLowerCase())
  );

  // Supabase-backed fuzzy product search
  // - Uses pg_trgm similarity via ilike fallback (server-side full-text can be added later)
  // - Still supports Shona translation by searching using activeSearchQuery
  // - Keeps results lightweight for dropdown performance
  let matchingProducts: Product[] = [];

  try {
    // Prefer translated term when Shona is detected
    const searchTerm = activeSearchQuery;

    // Multi-field fuzzy match (ILIKE) as an always-works baseline.
    // You can later swap to full-text (tsvector) scoring.
    const { data, error } = await supabase
      .from("products")
      .select("id, name, brand, category, price, images, tags, description")
      .or(
        `name.ilike.%${searchTerm}% ,brand.ilike.%${searchTerm}% ,category.ilike.%${searchTerm}% ,description.ilike.%${searchTerm}%`
      )
      .limit(5);

    if (!error && data) {
      matchingProducts = (data as any[]).map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        gender: p.gender,
        price: Number(p.price),
        original_price: p.original_price,
        images: p.images || [],
        colors: p.colors || [],
        sizes: p.sizes || [],
        rating: p.rating ?? 0,
        reviews: p.reviews ?? 0,
        fabric: p.fabric,
        care: p.care,
        description: p.description,
        tags: p.tags || [],
        in_stock: p.in_stock,
        created_at: p.created_at,
      }));

      // If we got empty results for the translated term, also try the raw query.
      if (matchingProducts.length === 0 && searchTerm.toLowerCase() !== trimmed.toLowerCase()) {
        const rawTerm = trimmed;
        const { data: rawData, error: rawError } = await supabase
          .from("products")
          .select("id, name, brand, category, price, images, tags, description")
          .or(
            `name.ilike.%${rawTerm}% ,brand.ilike.%${rawTerm}% ,category.ilike.%${rawTerm}% ,description.ilike.%${rawTerm}%`
          )
          .limit(5);

        if (!rawError && rawData) {
          matchingProducts = (rawData as any[]).map((p) => ({
            id: p.id,
            name: p.name,
            brand: p.brand,
            category: p.category,
            gender: p.gender,
            price: Number(p.price),
            original_price: p.original_price,
            images: p.images || [],
            colors: p.colors || [],
            sizes: p.sizes || [],
            rating: p.rating ?? 0,
            reviews: p.reviews ?? 0,
            fabric: p.fabric,
            care: p.care,
            description: p.description,
            tags: p.tags || [],
            in_stock: p.in_stock,
            created_at: p.created_at,
          }));
        }
      }
    }
  } catch (e) {
    console.warn("Supabase suggestions lookup failed; falling back to local catalog.", e);
  }

  // Fallback to static catalog for offline/dev when Supabase isn't ready.
  if (matchingProducts.length === 0) {
    matchingProducts = DEFAULT_PRODUCTS
      .filter((product) => {
        const nameMatch = product.name.toLowerCase().includes(lowerQuery);
        const brandMatch = product.brand.toLowerCase().includes(lowerQuery);
        const categoryMatch = product.category.toLowerCase().includes(lowerQuery);
        const tagMatch = product.tags.some((t) => t.toLowerCase().includes(lowerQuery));
        const descMatch = product.description.toLowerCase().includes(lowerQuery);

        return nameMatch || brandMatch || categoryMatch || tagMatch || descMatch;
      })
      .slice(0, 3);
  } else {
    matchingProducts = matchingProducts.slice(0, 3);
  }

  return {
    originalQuery: trimmed,
    translatedQuery: isShona ? translated : null,
    shonaTerm: isShona ? shonaTerm : null,
    categories: matchingCategories,
    products: matchingProducts,
  };
}
