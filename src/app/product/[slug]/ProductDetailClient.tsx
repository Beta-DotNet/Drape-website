'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReviewSystem from '@/components/ReviewSystem';
import { showToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/data';

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

function determineRecommendedSize(profile: SizeProfile | null, product: Product) {
  if (!profile) return '';

  const cat = product.category.toLowerCase();

  if (cat === 'shoes') {
    return profile.shoeSize || profile.brandSizes?.Nike?.Shoes || '9';
  }

  if (cat === 'bottoms') {
    return (
      profile.brandSizes?.[product.brand]?.Bottoms ||
      profile.brandSizes?.Nike?.Bottoms ||
      'M'
    );
  }

  return profile.brandSizes?.[product.brand]?.Tops || profile.brandSizes?.Nike?.Tops || 'L';
}

function loadStoredSizeProfile(): SizeProfile | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem('drape_size_profile');
    if (!raw) return null;
    return JSON.parse(raw) as SizeProfile;
  } catch (error) {
    console.error('Could not load size profile:', error);
    return null;
  }
}

function syncLocalCart(item: {
  product_id: number;
  name: string;
  brand: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  isAiMatched: boolean;
}) {
  try {
    const stored = localStorage.getItem('drape_cart') || '[]';
    const cart = JSON.parse(stored);

    if (!Array.isArray(cart)) return;

    const existingIndex = cart.findIndex(
      (entry: { product_id: number; size: string; color: string }) =>
        entry.product_id === item.product_id &&
        entry.size === item.size &&
        entry.color === item.color
    );

    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push(item);
    }

    localStorage.setItem('drape_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart_updated'));
  } catch (error) {
    console.error('Failed to sync local cart for product page:', error);
  }
}

export default function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || '');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || '');
  const [sizeProfile] = useState<SizeProfile | null>(() => loadStoredSizeProfile());
  const [isAdding, setIsAdding] = useState(false);

  const recommendedSize = determineRecommendedSize(sizeProfile, product);

  useEffect(() => {
    setSelectedImage(product.images[0]);
    setSelectedSize(product.sizes[0] || '');
    setSelectedColor(product.colors[0] || '');
  }, [product.id]);

  const handleAddToBag = async () => {
    setIsAdding(true);
    try {
      const chosenSize = selectedSize || product.sizes[0] || 'L';
      const chosenColor = selectedColor || product.colors[0] || 'Default';

      const { data } = await supabase.auth.getUser();

      if (data.user?.id) {
        const { error } = await supabase
          .from('cart_items')
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
            { onConflict: 'user_id,product_id,size' }
          );

        if (error) throw error;
      }

      syncLocalCart({
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
          label: 'View bag',
          onAction: () => window.dispatchEvent(new Event('open_cart_drawer')),
        },
      });
    } catch (error) {
      console.error('Error saving to cart:', error);
      showToast({ message: 'Could not save this item to your bag right now.' });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <main style={{ padding: '84px 24px 64px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <Link
          href="/shop"
          style={{ color: 'var(--navy)', fontWeight: 700, display: 'inline-flex', marginBottom: 24 }}
        >
          ← Back to shop
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1.1fr) minmax(320px, 1fr)', gap: 28 }}>
          <div style={{ background: 'var(--surface, #f8fafc)', borderRadius: 24, padding: 16 }}>
            <Image
              src={selectedImage}
              alt={product.name}
              width={720}
              height={840}
              unoptimized
              style={{ width: '100%', height: 'auto', borderRadius: 18, objectFit: 'cover' }}
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 14, overflowX: 'auto' }}>
              {product.images.map((image) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  style={{
                    border: selectedImage === image ? '2px solid var(--navy)' : '2px solid transparent',
                    borderRadius: 14,
                    overflow: 'hidden',
                    padding: 0,
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <Image src={image} alt={product.name} width={88} height={104} unoptimized style={{ display: 'block' }} />
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <p style={{ textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--text-soft)', fontSize: 12, fontWeight: 800 }}>
                {product.brand}
              </p>
              <h1 style={{ fontFamily: 'var(--font-h, Arial)', fontSize: 32, margin: '6px 0 8px' }}>{product.name}</h1>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontFamily: 'var(--font-h, Arial)', fontSize: 30, fontWeight: 800, color: 'var(--navy)' }}>
                  ${product.price}
                </span>
                {product.originalPrice ? (
                  <span style={{ color: 'var(--text-soft)', textDecoration: 'line-through' }}>
                    ${product.originalPrice}
                  </span>
                ) : null}
              </div>
              <p style={{ marginTop: 14, color: 'var(--text-mid)', lineHeight: 1.7 }}>{product.description}</p>
            </div>

            {sizeProfile && recommendedSize ? (
              <div
                style={{
                  padding: 16,
                  borderRadius: 18,
                  background: 'linear-gradient(135deg, #10243f 0%, #1a3a52 100%)',
                  color: '#fff',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: 28 }}>✨</div>
                <div>
                  <div style={{ textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 11, opacity: 0.8 }}>
                    AI size recommendation
                  </div>
                  <div style={{ fontFamily: 'var(--font-h, Arial)', fontSize: 24, fontWeight: 800 }}>Size {recommendedSize}</div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: 16,
                  borderRadius: 18,
                  border: '1px dashed rgba(249, 211, 67, 0.55)',
                  background: 'rgba(249, 211, 67, 0.08)',
                }}
              >
                <div style={{ fontFamily: 'var(--font-h, Arial)', fontSize: 20, fontWeight: 800, color: 'var(--navy)' }}>
                  Find your size with AI Body Scan
                </div>
                <p style={{ marginTop: 8, color: 'var(--text-mid)', lineHeight: 1.6 }}>
                  Save a size profile to unlock accurate fit recommendations across every brand.
                </p>
              </div>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <strong>Select size</strong>
                <span style={{ color: 'var(--navy)', fontSize: 13 }}>Fit-guided by your measurements</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    style={{
                      minWidth: 48,
                      minHeight: 48,
                      borderRadius: 12,
                      border: selectedSize === size ? '2px solid var(--navy)' : '1.5px solid var(--border-mid)',
                      background: selectedSize === size ? 'var(--navy)' : '#fff',
                      color: selectedSize === size ? '#fff' : 'var(--navy)',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <strong>Colour</strong>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {product.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    style={{
                      borderRadius: 999,
                      border: selectedColor === color ? '2px solid var(--navy)' : '1.5px solid var(--border-mid)',
                      background: selectedColor === color ? 'var(--navy)' : '#fff',
                      color: selectedColor === color ? '#fff' : 'var(--navy)',
                      padding: '10px 16px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleAddToBag}
                disabled={isAdding}
                style={{
                  flex: 1,
                  minWidth: 220,
                  border: 'none',
                  borderRadius: 999,
                  background: 'var(--navy)',
                  color: '#fff',
                  padding: '14px 18px',
                  fontWeight: 800,
                  cursor: isAdding ? 'wait' : 'pointer',
                }}
              >
                {isAdding ? 'Adding…' : `Add to Bag — $${product.price.toFixed(2)}`}
              </button>
              <button
                type="button"
                onClick={() => router.push('/shop')}
                style={{
                  border: '1.5px solid var(--border-mid)',
                  borderRadius: 999,
                  background: '#fff',
                  color: 'var(--navy)',
                  padding: '14px 18px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Browse more
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <div style={{ padding: 14, borderRadius: 16, background: 'var(--surface, #f8fafc)' }}>
                <div style={{ fontSize: 12, textTransform: 'uppercase', opacity: 0.7 }}>Fabric</div>
                <div style={{ marginTop: 6, fontWeight: 700 }}>{product.fabric}</div>
              </div>
              <div style={{ padding: 14, borderRadius: 16, background: 'var(--surface, #f8fafc)' }}>
                <div style={{ fontSize: 12, textTransform: 'uppercase', opacity: 0.7 }}>Care</div>
                <div style={{ marginTop: 6, fontWeight: 700 }}>{product.care}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <h2 style={{ fontFamily: 'var(--font-h, Arial)', fontSize: 24, marginBottom: 12 }}>Reviews</h2>
              <ReviewSystem key={product.id} product={product} initialAverage={product.rating} initialCount={product.reviews} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

