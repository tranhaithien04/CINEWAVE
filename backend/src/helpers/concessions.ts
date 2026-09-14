import { randomUUID } from "node:crypto";

import { readJsonFile, writeJsonFile } from "./json-store.js";

export type ConcessionItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
};

export type ConcessionLine = {
  id: string;
  qty: number;
  name: string;
  unitPrice: number;
};

export const CONCESSION_SEED: ConcessionItem[] = [
  {
    id: "combo-solo",
    name: "Combo 1 người",
    description: "Bắp vừa + Pepsi vừa",
    price: 79000,
    active: true,
  },
  {
    id: "combo-doi",
    name: "Combo 2 người",
    description: "Bắp lớn + 2 Pepsi",
    price: 149000,
    active: true,
  },
  {
    id: "popcorn-l",
    name: "Bắp rang lớn",
    description: "Caramel hoặc phô mai",
    price: 65000,
    active: true,
  },
  {
    id: "pepsi",
    name: "Pepsi vừa",
    description: "Ly 32oz",
    price: 35000,
    active: true,
  },
  {
    id: "nachos",
    name: "Nachos phô mai",
    description: "Khay nachos nóng",
    price: 55000,
    active: true,
  },
];

const FILE = "concessions.json";

let cache: ConcessionItem[] | null = null;
const byId = new Map<string, ConcessionItem>();

function rebuildIndex(items: ConcessionItem[]) {
  byId.clear();
  for (const item of items) byId.set(item.id, item);
}

function normalizeItem(raw: Partial<ConcessionItem> & { id: string; name: string; price: number }): ConcessionItem {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? "",
    price: Math.round(Number(raw.price) || 0),
    active: raw.active !== false,
  };
}

export async function ensureConcessionMenuLoaded() {
  if (cache) return cache;
  const stored = await readJsonFile<ConcessionItem[]>(FILE, []);
  const items = (stored.length ? stored : CONCESSION_SEED).map((item) =>
    normalizeItem({
      ...item,
      id: item.id || `c-${randomUUID().slice(0, 8)}`,
      name: item.name || "Món mới",
      price: item.price ?? 0,
    }),
  );
  if (!stored.length) await writeJsonFile(FILE, items);
  cache = items;
  rebuildIndex(items);
  return items;
}

export async function listConcessionMenu(includeInactive = false) {
  const items = await ensureConcessionMenuLoaded();
  return includeInactive ? [...items] : items.filter((item) => item.active);
}

async function persist(items: ConcessionItem[]) {
  cache = items;
  rebuildIndex(items);
  await writeJsonFile(FILE, items);
  return items;
}

export async function saveConcessionItem(input: {
  id?: string;
  name: string;
  description?: string;
  price: number;
  active?: boolean;
}) {
  const items = await ensureConcessionMenuLoaded();
  const id = (input.id ?? `c-${randomUUID().slice(0, 8)}`).trim();
  const next = normalizeItem({
    id,
    name: input.name.trim(),
    description: (input.description ?? "").trim(),
    price: input.price,
    active: input.active !== false,
  });
  if (!next.name || next.price <= 0) {
    throw new Error("VALIDATION_ERROR");
  }
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) items.push(next);
  else items[index] = next;
  await persist(items);
  return next;
}

export async function deleteConcessionItem(id: string) {
  const items = await ensureConcessionMenuLoaded();
  const next = items.filter((item) => item.id !== id);
  if (next.length === items.length) return false;
  await persist(next);
  return true;
}

/** Sync resolver — call ensureConcessionMenuLoaded() first in request handlers. */
export function resolveConcessions(input: Array<{ id?: string; qty?: number }> | undefined): ConcessionLine[] {
  if (!input?.length) return [];
  if (!cache) rebuildIndex(CONCESSION_SEED);
  const merged = new Map<string, number>();
  for (const row of input) {
    const id = String(row.id ?? "").trim();
    const qty = Math.round(Number(row.qty ?? 0));
    if (!id || !Number.isFinite(qty) || qty <= 0) continue;
    merged.set(id, Math.min(8, (merged.get(id) ?? 0) + qty));
  }
  const lines: ConcessionLine[] = [];
  for (const [id, qty] of merged) {
    const item = byId.get(id);
    if (!item || !item.active) continue;
    lines.push({ id: item.id, qty, name: item.name, unitPrice: item.price });
  }
  return lines;
}

export function computeConcessionTotal(lines: ConcessionLine[]) {
  return lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
}

/** @deprecated use listConcessionMenu — kept for transitional imports */
export const CONCESSION_MENU = CONCESSION_SEED;
