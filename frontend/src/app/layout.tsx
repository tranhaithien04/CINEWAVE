import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";

import { Providers } from "@/templates/providers";
import { SiteLayout } from "@/templates/site-layout";

import "./globals.css";

const sans = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const siteName = "CINEWAVE";
const description = "Đặt vé xem phim 3D · xác minh tuổi khi suất yêu cầu";
const fallbackAppUrl = "http://localhost:3000";

function getMetadataBase() {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? fallbackAppUrl;
  try {
    return new URL(raw);
  } catch {
    return new URL(fallbackAppUrl);
  }
}

export const viewport: Viewport = {
  themeColor: "#0a0c16",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description,
  applicationName: siteName,
  keywords: ["CINEWAVE", "đặt vé xem phim", "rạp chiếu", "ghế 3D", "vé QR", "xác minh tuổi"],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "1024x1024" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    siteName,
    title: siteName,
    description,
    images: [
      {
        url: "/og.png",
        width: 1280,
        height: 720,
        alt: "CINEWAVE — Đặt vé xem phim 3D · xác minh tuổi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description,
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="vi"
      className={`dark ${sans.variable} ${display.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-[#0a0c16] font-sans text-foreground antialiased"
        suppressHydrationWarning
      >
        <Providers>
          <SiteLayout>{children}</SiteLayout>
        </Providers>
      </body>
    </html>
  );
}
