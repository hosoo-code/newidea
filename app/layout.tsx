import Header from "@/components/navbar/Header";
import "./globals.css";
import { Inter } from "next/font/google";
import Footer from "@/components/footer/Footer";
import { ReactNode } from "react";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.kinomangas.net"),
  title: "Kino Mangas",
  description: "Кино Мангас",
  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
  // Холбоосыг Messenger/Facebook зэрэгт хуваалцахад гарах зураг (1200x630)
  openGraph: {
    type: "website",
    siteName: "Kino Mangas",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Kino Mangas" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "app-bg-enhanced")}>
        <Header />
        {children}
        <Footer />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
