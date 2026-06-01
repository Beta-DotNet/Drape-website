import React from "react";

export function PromoCarouselSkeleton() {
  return (
    <section aria-label="Promotions loading" className="mx-auto w-full px-4 pb-4 pt-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[28px] bg-neutral-200 p-6 sm:p-8 animate-pulse">
        <div className="aspect-video md:aspect-[21/9] rounded-[22px] bg-gray-200" style={{ minHeight: '200px', maxHeight: '674px' }} />
        <div className="mt-6 space-y-4 max-w-3xl">
          <div className="h-6 w-3/5 rounded-xl bg-gray-200" />
          <div className="h-4 w-4/5 rounded-xl bg-gray-200" />
          <div className="h-12 w-36 rounded-full bg-gray-200" />
        </div>
      </div>
    </section>
  );
}

export function ProductCardSkeleton() {
  return (
    <article className="rounded-[22px] border border-white/30 bg-neutral-100 p-4 animate-pulse shadow-sm">
      <div className="h-48 rounded-[18px] bg-gray-200" />
      <div className="mt-4 space-y-3">
        <div className="h-4 w-2/5 rounded-xl bg-gray-200" />
        <div className="h-5 w-4/5 rounded-xl bg-gray-200" />
        <div className="flex items-center justify-between gap-3">
          <div className="h-5 w-1/3 rounded-xl bg-gray-200" />
          <div className="h-9 w-16 rounded-full bg-gray-200" />
        </div>
      </div>
    </article>
  );
}

export function ProductGridSkeleton() {
  return (
    <section className="trending-section">
      <div className="section-heading">
        <div className="line"></div>
        <span className="section-label">Trending</span>
        <div className="line"></div>
      </div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

export function ProductDetailPageSkeleton() {
  return (
    <main className="animate-pulse px-6 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="aspect-square lg:h-[420px] rounded-[28px] bg-gray-200" />
          <div className="flex gap-3 overflow-x-auto">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 w-24 rounded-[18px] bg-gray-200" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-6 w-1/4 rounded-xl bg-gray-200" />
          <div className="h-10 w-3/4 rounded-xl bg-gray-200" />
          <div className="h-8 w-1/3 rounded-xl bg-gray-200" />
          <div className="h-5 w-full rounded-xl bg-gray-200" />
          <div className="space-y-3">
            <div className="h-12 rounded-[18px] bg-gray-200" />
            <div className="h-12 rounded-[18px] bg-gray-200" />
          </div>
          <div className="h-48 rounded-[22px] bg-gray-200" />
        </div>
      </div>
    </main>
  );
}

export function CheckoutSummarySkeleton() {
  return (
    <div className="space-y-4 rounded-[22px] bg-neutral-100 p-5 animate-pulse">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex gap-3 rounded-[18px] bg-gray-200 p-4">
          <div className="h-20 w-20 rounded-[18px] bg-gray-200" />
          <div className="flex-1 space-y-3 py-1">
            <div className="h-4 w-3/5 rounded-xl bg-gray-200" />
            <div className="h-3 w-1/2 rounded-xl bg-gray-200" />
            <div className="h-3 w-2/5 rounded-xl bg-gray-200" />
          </div>
        </div>
      ))}
      <div className="mt-4 h-10 rounded-full bg-gray-200" />
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="space-y-4 rounded-[28px] bg-neutral-100 p-5 animate-pulse">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="flex gap-3 rounded-[18px] bg-gray-200 p-4">
          <div className="h-20 w-20 rounded-[18px] bg-gray-200" />
          <div className="flex-1 space-y-3 py-1">
            <div className="h-4 w-3/5 rounded-xl bg-gray-200" />
            <div className="h-3 w-1/2 rounded-xl bg-gray-200" />
            <div className="h-3 w-2/5 rounded-xl bg-gray-200" />
          </div>
        </div>
      ))}
      <div className="mt-4 h-10 rounded-full bg-gray-200" />
    </div>
  );
}

export function UserProfileSkeleton() {
  return (
    <section className="view active px-6 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl rounded-[28px] bg-neutral-100 p-8 animate-pulse">
        <div className="flex flex-col items-center gap-6 rounded-[28px] bg-white p-8 shadow-sm sm:flex-row sm:items-start">
          <div className="h-20 w-20 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-4 py-2">
            <div className="h-6 w-2/5 rounded-xl bg-gray-200" />
            <div className="h-5 w-3/5 rounded-xl bg-gray-200" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ShopPageSkeleton() {
  return (
    <section className="view active animate-pulse">
      <div className="shop-layout">
        <aside className="filter-sidebar" aria-hidden="true" style={{ display: 'none' }}>
          {/* Filter skeleton hidden on mobile */}
        </aside>
        <div className="shop-main">
          <div className="products-grid">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ChatPageSkeleton() {
  return (
    <div className="gui-chat-shell animate-pulse" style={{ minHeight: "70vh" }}>
      <div className="rounded-[28px] bg-neutral-100 p-6 space-y-4">
        <div className="h-5 w-32 rounded bg-gray-200" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3" style={{ maxWidth: "70%" }}>
              <div className="h-12 flex-1 rounded-2xl bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LoginPageSkeleton() {
  return (
    <section className="view active auth-page-shell animate-pulse">
      <div className="auth-page-grid">
        <div className="auth-hero-panel">
          <div className="space-y-3">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-8 w-64 rounded bg-gray-200" />
            <div className="h-4 w-80 rounded bg-gray-200" />
          </div>
          <div className="h-24 rounded-[18px] bg-gray-200 mt-6" />
        </div>
        <div className="auth-card">
          <div className="space-y-4">
            <div className="h-5 w-48 rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function SignupPageSkeleton() {
  return (
    <section className="view active auth-page-shell animate-pulse">
      <div className="auth-page-grid auth-page-grid-signup">
        <div className="auth-hero-panel">
          <div className="space-y-3">
            <div className="h-4 w-16 rounded bg-gray-200" />
            <div className="h-8 w-80 rounded bg-gray-200" />
            <div className="h-4 w-96 rounded bg-gray-200" />
          </div>
        </div>
        <div className="auth-card">
          <div className="grid gap-4">
            <div className="h-10 w-full rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function AdminPageSkeleton() {
  return (
    <div className="admin-products-shell animate-pulse">
      <div className="admin-products-header">
        <div className="admin-products-hero-card">
          <div className="space-y-3">
            <div className="h-4 w-16 rounded bg-gray-200" />
            <div className="h-8 w-48 rounded bg-gray-200" />
          </div>
        </div>
      </div>
      <div className="h-10 w-full rounded bg-gray-200 mt-6" />
      <div className="space-y-4 mt-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded bg-gray-200" />
        ))}
      </div>
    </div>
  );
}

export function OrderConfirmationSkeleton() {
  return (
    <main className="animate-pulse px-6 py-12 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gray-200" />
          <div className="h-8 w-48 rounded bg-gray-200" />
        </div>
        <div className="h-24 rounded-[18px] bg-gray-200" />
      </div>
    </main>
  );
}

export function DealsSkeleton() {
  return (
    <section className="deals-section animate-pulse">
      <div className="section-heading">
        <div className="line"></div>
        <span className="section-label">DEALS</span>
        <div className="line"></div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 w-72 rounded-2xl bg-gray-200 flex-shrink-0" />
        ))}
      </div>
    </section>
  );
}
