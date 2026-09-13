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

export const metadata = {
  title: "CINEWAVE",
  description: "Đặt vé xem phim 3D · xác minh tuổi khi suất yêu cầu",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={`dark ${sans.variable} ${display.variable}`}>
      <body className="min-h-screen bg-[#0a0c16] font-sans text-foreground antialiased">
        <Providers>
          <SiteLayout>{children}</SiteLayout>
        </Providers>
      </body>
    </html>
  );
}
