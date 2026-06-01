'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReviewSystem from '@/components/ReviewSystem';
import MobileBottomCTA from '@/components/MobileBottomCTA';
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
  const [sizeProfile, setSizeProfile] = useState<SizeProfile | null>(() => loadStoredSizeProfile());
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

  const triggerMockScan = () => {
    const mockProfile = {
      hasScanned: true,
      measurements: {
        height: 180,
        weight: 75,
        chest: 98,
        waist: 82,
        hips: 100,
        inseam: 80,
        shoeSize: "9",
      },
      brandSizes: {
        Nike: { Tops: "L", Bottoms: "M", Shoes: "10" },
        Zara: { Tops: "M", Bottoms: "M", Shoes: "9.5" },
        "Retro Supply": { Tops: "L", Bottoms: "L", Shoes: "10" },
        "Jonathan D": { Tops: "L", Bottoms: "32", Shoes: "9" },
      },
    };

    localStorage.setItem("drape_size_profile", JSON.stringify(mockProfile));
    setSizeProfile(mockProfile);
    alert("AI scan successful! Your size recommendations are now active across all products.");
    window.dispatchEvent(new Event("drape_auth_session_changed"));
  };

  return (
    <main className="product-detail-page min-h-screen px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pt-24">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#1a3a52] transition hover:text-[#f9d343] mb-6"
        >
          ← Back to shop
        </Link>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Gallery Column */}
          <div className="bg-[#eef0f7] rounded-3xl p-4 h-fit">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white">
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                priority
                unoptimized
                className="object-cover"
              />
            </div>
            {/* Thumbnails list */}
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {product.images.map((image) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={`relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    selectedImage === image ? 'border-[#1a3a52]' : 'border-transparent'
                  }`}
                >
                  <Image
                    src={image}
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Details Column */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748b]">
                {product.brand}
              </p>
              <h1 className="font-h text-3xl sm:text-4xl text-[#0f172a] tracking-tight mt-1.5 mb-3">{product.name}</h1>
              
              <div className="flex items-baseline gap-3">
                <span className="font-h text-3xl font-extrabold text-[#1a3a52]">
                  ${product.price}
                </span>
                {product.originalPrice ? (
                  <span className="text-base text-[#64748b] line-through">
                    ${product.originalPrice}
                  </span>
                ) : null}
              </div>
              <p className="mt-4 text-[#334155] leading-relaxed text-sm sm:text-base">{product.description}</p>
            </div>

            {sizeProfile && recommendedSize ? (
              <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-[#10243f] to-[#1a3a52] p-4 text-white shadow-md border border-[#f9d343]/20">
                <div className="text-3xl">✨</div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#f9d343]">
                    AI size recommendation
                  </div>
                  <div className="font-h text-2xl font-bold tracking-tight">Size {recommendedSize}</div>
                </div>
              </div>
            ) : (
              <div
                onClick={triggerMockScan}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-[#f9d343]/40 bg-[#f9d343]/5 p-5 transition hover:bg-[#f9d343]/10"
              >
                <div className="font-h text-lg font-bold text-[#1a3a52] flex items-center gap-2">
                  <span>🤖</span> Find your size with AI Body Scan
                </div>
                <p className="mt-2 text-sm text-[#334155] leading-relaxed">
                  Save a size profile to unlock accurate fit recommendations across every brand.
                </p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <strong className="text-[#0f172a]">Select Size</strong>
                <span className="text-xs text-[#64748b]">Fit-guided by your measurements</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`flex h-12 min-w-[48px] items-center justify-center rounded-xl border-2 font-bold transition ${
                      selectedSize === size
                        ? 'border-[#1a3a52] bg-[#1a3a52] text-white'
                        : 'border-[#0f172a]/10 bg-white text-[#1a3a52] hover:border-[#1a3a52]/40'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3">
                <strong className="text-[#0f172a]">Colour</strong>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`rounded-full border-2 px-5 py-2.5 text-sm font-semibold transition ${
                      selectedColor === color
                        ? 'border-[#1a3a52] bg-[#1a3a52] text-white'
                        : 'border-[#0f172a]/10 bg-white text-[#1a3a52] hover:border-[#1a3a52]/40'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 flex-wrap mt-4">
              <button
                type="button"
                onClick={handleAddToBag}
                disabled={isAdding}
                className="flex-1 min-w-[220px] rounded-full bg-[#1a3a52] text-white py-3.5 px-6 font-bold hover:bg-[#122a3e] active:scale-[0.98] transition disabled:opacity-50"
              >
                {isAdding ? 'Adding…' : `Add to Bag — $${product.price.toFixed(2)}`}
              </button>
              <button
                type="button"
                onClick={() => router.push('/shop')}
                className="rounded-full border border-[#0f172a]/20 bg-white text-[#1a3a52] py-3.5 px-6 font-bold hover:bg-slate-50 transition"
              >
                Browse more
              </button>
            </div>

            <div className="border-t border-[#0f172a]/10 pt-4 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#eef0f7]/60">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Fabric</div>
                <div className="mt-1.5 font-bold text-[#0f172a]">{product.fabric}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#eef0f7]/60">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Care</div>
                <div className="mt-1.5 font-bold text-[#0f172a]">{product.care}</div>
              </div>
            </div>

            <div className="border-t border-[#0f172a]/10 pt-4">
              <h2 className="font-h text-2xl text-[#0f172a] mb-4">Reviews</h2>
              <ReviewSystem key={product.id} product={product} initialAverage={product.rating} initialCount={product.reviews} />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile bottom CTA */}
      <MobileBottomCTA
        productName={product.name}
        price={product.price}
        onAddToCart={handleAddToBag}
        onFindSize={triggerMockScan}
        isAdding={isAdding}
        selectedSize={selectedSize}
      />
    </main>
  );
}
