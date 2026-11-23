import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Little Postcard — Một nơi để ta dừng lại",
    template: "%s · Little Postcard",
  },
  description:
    "Little Postcard là kho lưu trữ những thước phim nhỏ, những khoảnh khắc dịu dàng và những điều đẹp đẽ vẫn luôn hiện diện quanh ta.",
  applicationName: "Little Postcard",
  openGraph: {
    type: "website",
    siteName: "Little Postcard",
    locale: "vi_VN",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f7f4",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-sm focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:text-surface"
        >
          Bỏ qua đến nội dung chính
        </a>
        <PublicHeader />
        {children}
        <PublicFooter />
      </body>
    </html>
  );
}
