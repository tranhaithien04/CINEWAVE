"use client";

import {
  Ban,
  CheckCircle2,
  Clock3,
  Clapperboard,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import type { AppNotification } from "@/api/notifications";

const toneByType: Record<string, { icon: typeof Ticket; className: string }> = {
  PAYMENT_SUCCESS: {
    icon: CheckCircle2,
    className: "!border-emerald-400/60 !bg-[#12352c] !text-emerald-50",
  },
  HOLD_EXPIRING: {
    icon: Clock3,
    className: "!border-amber-400/60 !bg-[#3a2a10] !text-amber-50",
  },
  SHOWTIME_REMINDER: {
    icon: Clapperboard,
    className: "!border-cyan-400/70 !bg-[#102a38] !text-cyan-50",
  },
  AGE_VERIFIED: {
    icon: ShieldCheck,
    className: "!border-emerald-400/60 !bg-[#12352c] !text-emerald-50",
  },
  AGE_FAILED: {
    icon: ShieldAlert,
    className: "!border-rose-400/60 !bg-[#3a1220] !text-rose-50",
  },
  BOOKING_CANCELLED: {
    icon: Ban,
    className: "!border-rose-400/60 !bg-[#3a1220] !text-rose-50",
  },
  BOOKING_REFUNDED: {
    icon: Wallet,
    className: "!border-amber-400/60 !bg-[#3a2a10] !text-amber-50",
  },
  TICKET_CHECKED_IN: {
    icon: CheckCircle2,
    className: "!border-emerald-400/60 !bg-[#12352c] !text-emerald-50",
  },
  REFUND_READY: {
    icon: Wallet,
    className: "!border-amber-400/60 !bg-[#3a2a10] !text-amber-50",
  },
  ADMIN_BROADCAST: {
    icon: Ticket,
    className: "!border-cyan-400/70 !bg-[#102a38] !text-cyan-50",
  },
};

const fallback = {
  icon: Ticket,
  className: "!border-cyan-400/70 !bg-[#102a38] !text-cyan-50",
};

export function showAppNotificationToast(note: AppNotification) {
  const tone = toneByType[note.type] ?? fallback;
  const Icon = tone.icon;

  toast(note.title, {
    description: note.body,
    duration: 4500,
    position: "top-center",
    icon: <Icon className="h-5 w-5" strokeWidth={2.25} />,
    action: {
      label: "Xem ngay",
      onClick: () => {
        window.location.assign(note.href || "/notifications");
      },
    },
    className: tone.className,
  });
}
