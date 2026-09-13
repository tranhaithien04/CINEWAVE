"use client";

import type { ReactNode } from "react";

import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { CatalogProvider } from "@/hooks/use-catalog";
import { NotificationProvider } from "@/hooks/use-notifications";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CatalogProvider>
          <SmoothScrollProvider>
            {children}
            <Toaster />
          </SmoothScrollProvider>
        </CatalogProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
