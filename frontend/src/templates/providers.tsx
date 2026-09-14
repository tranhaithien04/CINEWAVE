"use client";

import type { ReactNode } from "react";

import { MotionProvider } from "@/components/motion";
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
          <MotionProvider>
            <SmoothScrollProvider>
              {children}
              <Toaster />
            </SmoothScrollProvider>
          </MotionProvider>
        </CatalogProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
