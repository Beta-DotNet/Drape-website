import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ProductModalProvider } from "@/components/ProductModalContext";
import ToastContainer from "@/components/ToastContainer";

export const metadata: Metadata = {
  title: "drape — AI-Powered Fashion Marketplace",
  description: "Shop fashion with confidence. drape uses AI body scanning to recommend your perfect size across every brand.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ProductModalProvider>
          <Header />
          <div id="app">
            {children}
          </div>
          <Footer />
          <ToastContainer />
        </ProductModalProvider>
      </body>
    </html>
  );
}

