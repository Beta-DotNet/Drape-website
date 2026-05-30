import { Suspense } from "react";
import { OrderConfirmationSkeleton } from "@/components/skeletons";
import OrderConfirmationClient from "@/components/OrderConfirmationClient";

type OrderConfirmationPageProps = {
  searchParams?: {
    waUrl?: string | string[];
    orderId?: string | string[];
  };
};

function normalizeSearchParam(value: string | string[] | undefined) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] : value;
}

export default function OrderConfirmationPage({ searchParams }: OrderConfirmationPageProps) {
  const waUrl = normalizeSearchParam(searchParams?.waUrl);
  const orderId = normalizeSearchParam(searchParams?.orderId);

  return (
    <Suspense fallback={<OrderConfirmationSkeleton />}>
      <OrderConfirmationClient waUrl={waUrl} orderId={orderId} />
    </Suspense>
  );
}

