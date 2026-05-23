"use client";

import React, { createContext, useContext, useState } from "react";
import { Product } from "@/lib/data";
import ProductModal from "./ProductModal";

interface ProductModalContextType {
  activeProduct: Product | null;
  openProductModal: (product: Product) => void;
  closeProductModal: () => void;
}

const ProductModalContext = createContext<ProductModalContextType | undefined>(undefined);

export function ProductModalProvider({ children }: { children: React.ReactNode }) {
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  const openProductModal = (product: Product) => {
    setActiveProduct(product);
  };

  const closeProductModal = () => {
    setActiveProduct(null);
  };

  return (
    <ProductModalContext.Provider value={{ activeProduct, openProductModal, closeProductModal }}>
      {children}
      {activeProduct && (
        <ProductModal product={activeProduct} onClose={closeProductModal} />
      )}
    </ProductModalContext.Provider>
  );
}

export function useProductModal() {
  const context = useContext(ProductModalContext);
  if (!context) {
    throw new Error("useProductModal must be used within a ProductModalProvider");
  }
  return context;
}
