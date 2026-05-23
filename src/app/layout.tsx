import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

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
        <Header />
        <div id="app">
          {children}
        </div>
      </body>
    </html>
  );
}
