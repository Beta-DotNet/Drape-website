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

  // Find matching products (up to 3) in static DEFAULT_PRODUCTS catalog
  const matchingProducts = DEFAULT_PRODUCTS.filter(product => {
    const nameMatch = product.name.toLowerCase().includes(lowerQuery);
    const brandMatch = product.brand.toLowerCase().includes(lowerQuery);
    const categoryMatch = product.category.toLowerCase().includes(lowerQuery);
    const tagMatch = product.tags.some(t => t.toLowerCase().includes(lowerQuery));
    const descMatch = product.description.toLowerCase().includes(lowerQuery);

    return nameMatch || brandMatch || categoryMatch || tagMatch || descMatch;
  }).slice(0, 3);

  return {
    originalQuery: trimmed,
    translatedQuery: isShona ? translated : null,
    shonaTerm: isShona ? shonaTerm : null,
    categories: matchingCategories,
    products: matchingProducts
  };
}
