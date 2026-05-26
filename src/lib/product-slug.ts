import { DEFAULT_PRODUCTS, Product } from '@/lib/data';

export function getProductSlug(product: Product) {
  const base = product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return `${base}-${product.id}`;
}

export function findProductBySlug(slug: string) {
  return DEFAULT_PRODUCTS.find((product) => getProductSlug(product) === slug) ?? null;
}
