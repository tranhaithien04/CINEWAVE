"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/utils/cn";
import { seatsCrossAisle } from "@/utils/seat";

export type RoomSeatType = "STANDARD" | "VIP" | "COUPLE";

export type RoomSeatDef = {
  label: string;
  row: string;
  number: number;
  type: RoomSeatType;
  partner: string | null;
};

type Tool = "lock" | "standard" | "vip" | "couple" | "erase" | "add";

const TOOLS: Array<{ id: Tool; label: string }> = [
  { id: "lock", label: "Khóa" },
  { id: "standard", label: "Thường" },
  { id: "vip", label: "VIP" },
  { id: "couple", label: "Đôi" },
  { id: "erase", label: "Xóa" },
  { id: "add", label: "+ Ghế" },
];

type RowCell =
  | { kind: "seat"; seat: RoomSeatDef }
  | { kind: "ghost"; row: string; number: number; label: string };

function nextRowLetter(rows: string[]) {
  const codes = rows.map((row) => row.charCodeAt(0));
  const max = codes.length ? Math.max(...codes) : "A".charCodeAt(0) - 1;
  if (max >= "Z".charCodeAt(0)) return null;
  return String.fromCharCode(max + 1);
}

function clearCoupleLinks(seats: RoomSeatDef[], label: string): RoomSeatDef[] {
  const target = seats.find((seat) => seat.label === label);
  if (!target) return seats;
  const partner = target.partner;
  return seats.map((seat) => {
    if (seat.label === label || (partner && seat.label === partner)) {
      return {
        ...seat,
        type: seat.type === "COUPLE" ? ("STANDARD" as const) : seat.type,
        partner: null,
      };
    }
    if (seat.partner === label) return { ...seat, type: "STANDARD" as const, partner: null };
    return seat;
  });
}

function cellsForRow(row: string, list: RoomSeatDef[], showGhosts: boolean): RowCell[] {
  if (!showGhosts) {
    return list.map((seat) => ({ kind: "seat", seat }));
  }
  const byNumber = new Map(list.map((seat) => [seat.number, seat]));
  const maxExisting = list.reduce((max, seat) => Math.max(max, seat.number), 0);
  const end = Math.min(30, Math.max(maxExisting + 1, 1));
  const cells: RowCell[] = [];
  for (let number = 1; number <= end; number += 1) {
    const seat = byNumber.get(number);
    if (seat) cells.push({ kind: "seat", seat });
    else cells.push({ kind: "ghost", row, number, label: `${row}${number}` });
  }
  return cells;
}

type SeatLayoutEditorProps = {
  seats: RoomSeatDef[];
  blockedSeats: string[];
  onChangeSeats: (seats: RoomSeatDef[]) => void;
  onChangeBlocked: (blocked: string[]) => void;
  className?: string;
};

export function SeatLayoutEditor({
  seats,
  blockedSeats,
  onChangeSeats,
  onChangeBlocked,
  className,
}: SeatLayoutEditorProps) {
  const [tool, setTool] = useState<Tool>("lock");
  const [couplePick, setCouplePick] = useState<string | null>(null);

  const blocked = useMemo(
    () => new Set(blockedSeats.map((seat) => seat.toUpperCase())),
    [blockedSeats],
  );

  const rows = useMemo(() => {
    const map = new Map<string, RoomSeatDef[]>();
    for (const seat of seats) {
      const list = map.get(seat.row) ?? [];
      list.push(seat);
      map.set(seat.row, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.number - b.number);
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [seats]);

  function setType(label: string, type: RoomSeatType) {
    let next = clearCoupleLinks(seats, label);
    next = next.map((seat) => (seat.label === label ? { ...seat, type, partner: null } : seat));
    onChangeSeats(next);
  }

  function toggleBlock(label: string) {
    const next = new Set(blocked);
    if (next.has(label)) next.delete(label);
    else next.add(label);
    onChangeBlocked([...next].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })));
  }

  function makeCouple(aLabel: string, bLabel: string) {
    const a = seats.find((seat) => seat.label === aLabel);
    const b = seats.find((seat) => seat.label === bLabel);
    if (!a || !b) return;
    if (a.row !== b.row || Math.abs(a.number - b.number) !== 1) {
      toast.error("Ghế đôi phải liền kề cùng hàng.");
      return;
    }
    const colCount = Math.max(1, ...seats.filter((seat) => seat.row === a.row).map((seat) => seat.number));
    if (seatsCrossAisle(a.number, b.number, colCount)) {
      toast.error("Ghế đôi không được bắt cặp qua lối đi.");
      return;
    }
    let next = clearCoupleLinks(seats, aLabel);
    next = clearCoupleLinks(next, bLabel);
    next = next.map((seat) => {
      if (seat.label === aLabel) return { ...seat, type: "COUPLE", partner: bLabel };
      if (seat.label === bLabel) return { ...seat, type: "COUPLE", partner: aLabel };
      return seat;
    });
    onChangeSeats(next);
    setCouplePick(null);
  }

  function eraseSeat(label: string) {
    if (seats.length <= 1) {
      toast.error("Phòng cần ít nhất một ghế.");
      return;
    }
    const target = seats.find((seat) => seat.label === label);
    let next = seats.filter((seat) => seat.label !== label);
    if (target?.partner) {
      next = next.map((seat) =>
        seat.label === target.partner ? { ...seat, type: "STANDARD" as const, partner: null } : seat,
      );
    }
    onChangeSeats(next);
    onChangeBlocked(blockedSeats.filter((seat) => seat !== label && seat !== target?.partner));
  }

  function addOneSeat(row: string, number: number) {
    const label = `${row}${number}`;
    if (seats.some((seat) => seat.label === label)) {
      toast.error(`Ghế ${label} đã tồn tại.`);
      return;
    }
    if (number < 1 || number > 30) {
      toast.error("Số ghế phải từ 1–30.");
      return;
    }
    onChangeSeats([
      ...seats,
      { label, row, number, type: "STANDARD", partner: null },
    ]);
    toast.success(`Đã thêm ghế ${label}`);
  }

  function onSeatClick(seat: RoomSeatDef) {
    if (tool === "add") {
      toast.message("Bấm ô nét đứt (+) để thêm ghế mới.");
      return;
    }
    if (tool === "lock") {
      toggleBlock(seat.label);
      return;
    }
    if (tool === "standard") {
      setType(seat.label, "STANDARD");
      return;
    }
    if (tool === "vip") {
      setType(seat.label, "VIP");
      return;
    }
    if (tool === "erase") {
      eraseSeat(seat.label);
      return;
    }
    if (tool === "couple") {
      if (!couplePick) {
        setCouplePick(seat.label);
        toast.message(`Chọn ghế liền kề với ${seat.label}`);
        return;
      }
      if (couplePick === seat.label) {
        setCouplePick(null);
        return;
      }
      makeCouple(couplePick, seat.label);
    }
  }

  function addColumn() {
    if (!rows.length) return;
    const nextSeats = [...seats];
    for (const [row, list] of rows) {
      const maxNum = list.reduce((max, seat) => Math.max(max, seat.number), 0);
      if (maxNum >= 30) {
        toast.error("Tối đa 30 ghế mỗi hàng.");
        return;
      }
      const number = maxNum + 1;
      nextSeats.push({
        label: `${row}${number}`,
        row,
        number,
        type: "STANDARD",
        partner: null,
      });
    }
    onChangeSeats(nextSeats);
  }

  function addRow() {
    const rowIds = rows.map(([row]) => row);
    const row = nextRowLetter(rowIds);
    if (!row) {
      toast.error("Đã hết chữ hàng (A–Z).");
      return;
    }
    const width = rows[0]?.[1]?.length || 10;
    const next: RoomSeatDef[] = [...seats];
    for (let number = 1; number <= width; number += 1) {
      next.push({
        label: `${row}${number}`,
        row,
        number,
        type: "STANDARD",
        partner: null,
      });
    }
    onChangeSeats(next);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-1.5">
        {TOOLS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTool(item.id);
              setCouplePick(null);
              if (item.id === "add") {
                toast.message("Bấm ô nét đứt (+) trên sơ đồ để thêm 1 ghế.");
              }
            }}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors",
              tool === item.id
                ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-200"
                : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20",
            )}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={addColumn}
          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-gray-300 hover:border-cyan-500/30"
        >
          + Cột
        </button>
        <button
          type="button"
          onClick={addRow}
          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-gray-300 hover:border-cyan-500/30"
        >
          + Hàng
        </button>
      </div>

      <div className="mx-auto h-1.5 w-2/3 rounded-full bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
      <p className="text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Màn hình</p>

      <div className="max-h-[50vh] space-y-1.5 overflow-auto pr-1">
        {rows.map(([row, list]) => (
          <div key={row} className="flex items-center justify-center gap-1.5">
            <span className="w-4 text-center text-[10px] font-mono text-muted-foreground">{row}</span>
            {cellsForRow(row, list, tool === "add").map((cell) => {
              if (cell.kind === "ghost") {
                return (
                  <button
                    key={`ghost-${cell.label}`}
                    type="button"
                    title={`Thêm ghế ${cell.label}`}
                    onClick={() => addOneSeat(cell.row, cell.number)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-cyan-400/50 bg-cyan-500/5 text-[11px] font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/15"
                  >
                    +
                  </button>
                );
              }
              const seat = cell.seat;
              const isBlocked = blocked.has(seat.label);
              const picking = couplePick === seat.label;
              return (
                <button
                  key={seat.label}
                  type="button"
                  title={`${seat.label} · ${seat.type}${seat.partner ? ` ↔ ${seat.partner}` : ""}`}
                  onClick={() => onSeatClick(seat)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-semibold transition-colors",
                    isBlocked
                      ? "border border-rose-500/40 bg-rose-500/20 text-rose-200"
                      : seat.type === "VIP"
                        ? "border border-amber-400/40 bg-amber-400/15 text-amber-200 hover:bg-amber-400/25"
                        : seat.type === "COUPLE"
                          ? "border border-rose-400/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20"
                          : "border border-white/10 bg-white/5 text-gray-300 hover:border-cyan-500/40 hover:bg-cyan-500/10",
                    picking && "ring-2 ring-cyan-400",
                  )}
                >
                  {seat.number}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Công cụ: <span className="text-cyan-300">{TOOLS.find((item) => item.id === tool)?.label}</span>
        {tool === "couple" && couplePick ? ` · đang chọn cặp cho ${couplePick}` : null}
        {tool === "add" ? " · bấm ô (+) để thêm 1 ghế" : null}
        {" · "}
        Khóa:{" "}
        <span className="font-mono text-rose-300">
          {blockedSeats.length ? blockedSeats.join(", ") : "không có"}
        </span>
      </p>
    </div>
  );
}
