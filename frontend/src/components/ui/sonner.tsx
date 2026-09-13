"use client";

import type { CSSProperties, ComponentProps } from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      closeButton
      richColors
      expand
      offset={80}
      gap={14}
      duration={5200}
      visibleToasts={5}
      className="toaster group"
      style={{ "--width": "26rem" } as CSSProperties}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:border-white/20 group-[.toaster]:bg-[#13172c] group-[.toaster]:text-white group-[.toaster]:shadow-2xl group-[.toaster]:shadow-cyan-500/25",
          title: "group-[.toast]:font-display group-[.toast]:text-sm group-[.toast]:font-semibold group-[.toast]:text-white",
          description: "group-[.toast]:text-sm group-[.toast]:text-gray-100",
          actionButton:
            "group-[.toast]:bg-cyan-400 group-[.toast]:text-[#06070d] group-[.toast]:font-semibold",
          cancelButton: "group-[.toast]:bg-white/10 group-[.toast]:text-gray-200",
          closeButton: "group-[.toast]:border-white/20 group-[.toast]:bg-[#13172c] group-[.toast]:text-white",
          success: "group-[.toaster]:border-emerald-400/50 group-[.toaster]:shadow-emerald-500/25",
          error: "group-[.toaster]:border-rose-400/50 group-[.toaster]:shadow-rose-500/25",
          warning: "group-[.toaster]:border-amber-400/50 group-[.toaster]:shadow-amber-400/25",
          info: "group-[.toaster]:border-cyan-400/50 group-[.toaster]:shadow-cyan-400/25",
          icon: "group-[.toast]:text-cyan-300",
        },
      }}
      {...props}
    />
  );
}
