import React from "react";

export function PromoCarouselSkeleton() {
  return (
    <section aria-label="Promotions loading" className="mx-auto w-full px-4 pb-4 pt-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[28px] bg-neutral-200 p-6 sm:p-8 animate-pulse">
        <div className="h-64 md:h-96 rounded-[22px] bg-gray-200" />
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
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
          <div className="h-[420px] rounded-[28px] bg-gray-200" />
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
