"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, RotateCcw, Scan } from "lucide-react";
import { toast } from "sonner";

import type { Seat } from "@/@types/seat";
import {
  createSeatPickerScene,
  hoverSeat,
  pickSeatId,
  resetOverview,
  resizeSeatPicker,
  setSelectedSeats,
  setTopDownView,
  tickSeatPicker,
  viewFromSeat,
  zoomSeatPicker,
  type CameraMode,
  type SeatPickerScene,
} from "@/components/three/create-seat-picker-scene";
import { Button } from "@/components/ui/button";
import { formatVnd, seatPrice } from "@/data/mock-catalog";
import { isSeatTaken } from "@/utils/seat";
import { cn } from "@/utils/cn";

const DRAG_THRESHOLD = 12;

function seatLabel(seat: Seat) {
  return `${seat.row}${seat.number}`;
}

function typeLabel(type: Seat["type"]) {
  if (type === "VIP") return "VIP";
  if (type === "COUPLE") return "Đôi";
  return "Thường";
}

export function SeatMap3D({
  seats,
  selectedIds,
  priceBase,
  onToggle,
}: {
  seats: Seat[];
  selectedIds: string[];
  priceBase: number;
  onToggle: (seat: Seat) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pickerRef = useRef<SeatPickerScene | null>(null);
  const selectedRef = useRef(selectedIds);
  const dragRef = useRef({ active: false, moved: false, x: 0, y: 0 });
  const [tip, setTip] = useState<{ x: number; y: number; seat: Seat } | null>(null);
  const [mode, setMode] = useState<CameraMode>("orbit");
  const [viewingLabel, setViewingLabel] = useState<string | null>(null);

  useEffect(() => {
    selectedRef.current = selectedIds;
  }, [selectedIds]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const picker = createSeatPickerScene(canvas, seats);
    pickerRef.current = picker;
    setSelectedSeats(picker, selectedRef.current);

    const parent = canvas.parentElement;
    const resize = () => {
      if (!parent) return;
      resizeSeatPicker(picker, parent.clientWidth, parent.clientHeight);
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (parent) observer.observe(parent);

    let frame = 0;
    const loop = () => {
      tickSeatPicker(picker);
      frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomSeatPicker(picker, event.deltaY);
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("wheel", onWheel);
      picker.dispose();
      pickerRef.current = null;
    };
  }, [seats]);

  useEffect(() => {
    const picker = pickerRef.current;
    if (picker) setSelectedSeats(picker, selectedIds);
  }, [selectedIds]);

  function seatFromId(id: string | null) {
    return id ? (seats.find((seat) => seat.id === id) ?? null) : null;
  }

  function goOverview() {
    const picker = pickerRef.current;
    if (!picker) return;
    resetOverview(picker);
    setMode("orbit");
    setViewingLabel(null);
  }

  function goTopDown() {
    const picker = pickerRef.current;
    if (!picker) return;
    setTopDownView(picker);
    setMode("orbit");
    setViewingLabel(null);
  }

  function goSeatView(seat?: Seat | null) {
    const picker = pickerRef.current;
    const target = seat ?? (selectedIds[0] ? seatFromId(selectedIds[0]) : null);
    if (!picker || !target) {
      toast.error("Chọn một ghế để xem góc nhìn ra màn hình.");
      return;
    }
    if (viewFromSeat(picker, target.id)) {
      setMode("seat");
      setViewingLabel(seatLabel(target));
      toast.message(`Góc nhìn từ ghế ${seatLabel(target)}`);
    }
  }

  function updateHover(event: React.PointerEvent<HTMLCanvasElement>) {
    const picker = pickerRef.current;
    if (!picker || dragRef.current.active || picker.mode === "seat") return;
    const id = pickSeatId(picker, event.clientX, event.clientY);
    hoverSeat(picker, id);
    const seat = seatFromId(id);
    const rect = event.currentTarget.getBoundingClientRect();
    if (canvasRef.current) {
      canvasRef.current.style.cursor = seat ? (isSeatTaken(seat) ? "not-allowed" : "pointer") : "grab";
    }
    setTip(seat ? { x: event.clientX - rect.left, y: event.clientY - rect.top, seat } : null);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#06070d] shadow-xl shadow-cyan-500/10">
      <canvas
        ref={canvasRef}
        className="h-[420px] w-full touch-none md:h-[560px] lg:h-[620px]"
        aria-label="Sơ đồ ghế 3D"
        onPointerDown={(event) => {
          if (pickerRef.current?.mode === "seat") return;
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = { active: true, moved: false, x: event.clientX, y: event.clientY };
          if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
        }}
        onPointerMove={(event) => {
          const picker = pickerRef.current;
          const drag = dragRef.current;
          if (picker && drag.active && picker.mode === "orbit") {
            const dx = event.clientX - drag.x;
            const dy = event.clientY - drag.y;
            if (Math.hypot(dx, dy) > DRAG_THRESHOLD) drag.moved = true;
            if (drag.moved) {
              picker.orbit.theta -= dx * 0.006;
              picker.orbit.phi -= dy * 0.005;
              drag.x = event.clientX;
              drag.y = event.clientY;
              setTip(null);
              hoverSeat(picker, null);
            }
            return;
          }
          updateHover(event);
        }}
        onPointerUp={(event) => {
          const picker = pickerRef.current;
          const drag = dragRef.current;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          drag.active = false;
          if (canvasRef.current) canvasRef.current.style.cursor = "grab";
          if (!picker || drag.moved || picker.mode === "seat") return;
          const id = pickSeatId(picker, event.clientX, event.clientY);
          const seat = seatFromId(id);
          if (seat && !isSeatTaken(seat)) onToggle(seat);
        }}
        onPointerCancel={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          dragRef.current.active = false;
          if (canvasRef.current) canvasRef.current.style.cursor = "grab";
        }}
        onLostPointerCapture={() => {
          dragRef.current.active = false;
          if (canvasRef.current) canvasRef.current.style.cursor = "grab";
        }}
        onDoubleClick={(event) => {
          const picker = pickerRef.current;
          if (!picker) return;
          const id = pickSeatId(picker, event.clientX, event.clientY);
          goSeatView(seatFromId(id));
        }}
        onPointerLeave={() => {
          if (dragRef.current.active) return;
          const picker = pickerRef.current;
          if (picker) hoverSeat(picker, null);
          setTip(null);
          if (canvasRef.current) canvasRef.current.style.cursor = "grab";
        }}
      />

      <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2">
        <p className="rounded-full bg-background/75 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur">
          {mode === "seat"
            ? `Đang ngồi ${viewingLabel ?? "ghế"} · nhìn ra màn hình`
            : "Kéo xoay · lăn zoom · double-click xem góc ghế"}
        </p>
      </div>

      <div className="absolute right-3 top-3 z-10 flex gap-1 rounded-xl border border-white/10 bg-background/80 p-1 backdrop-blur">
        <Button type="button" size="sm" variant="ghost" className="h-8 rounded-lg px-2" onClick={goOverview}>
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          Toàn cảnh
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-8 rounded-lg px-2" onClick={goTopDown}>
          <Scan className="mr-1 h-3.5 w-3.5" />
          Từ trên
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "seat" ? "default" : "ghost"}
          className={cn("h-8 rounded-lg px-2")}
          onClick={() => goSeatView()}
        >
          <Eye className="mr-1 h-3.5 w-3.5" />
          Góc ghế
        </Button>
      </div>

      {tip && mode === "orbit" ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-7 rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: tip.x, top: tip.y }}
        >
          <p className="font-medium">
            {seatLabel(tip.seat)} · {typeLabel(tip.seat.type)}
          </p>
          <p className="text-muted-foreground">
            {isSeatTaken(tip.seat) ? "Đã đặt / khóa" : formatVnd(seatPrice(priceBase, tip.seat.type))}
          </p>
        </div>
      ) : null}
    </div>
  );
}
