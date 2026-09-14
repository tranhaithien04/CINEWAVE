import { randomUUID } from "node:crypto";

import { readJsonFile, writeJsonFile } from "./json-store.js";

export type AgeVerificationRecord = {
  id: string;
  userId: string;
  bookingId: string | null;
  showtimeId: string | null;
  movieSlug: string | null;
  rating: string | null;
  requiredAge: number;
  computedAge: number | null;
  passed: boolean;
  confidence: number | null;
  idNumberHash: string | null;
  idMasked: string | null;
  rawImageDeleted: boolean;
  failureReason: string | null;
  createdAt: string;
  expiresAt: string | null;
};

const FILE = "age-verifications.json";

async function readAll() {
  return readJsonFile<AgeVerificationRecord[]>(FILE, []);
}

export async function saveAgeVerification(record: AgeVerificationRecord) {
  const items = await readAll();
  const index = items.findIndex((item) => item.id === record.id);
  if (index === -1) items.push(record);
  else items[index] = record;
  await writeJsonFile(FILE, items);
  return record;
}

export async function createAgeVerification(
  input: Omit<AgeVerificationRecord, "id" | "createdAt"> & { id?: string },
) {
  const record: AgeVerificationRecord = {
    ...input,
    id: input.id ?? randomUUID(),
    createdAt: new Date().toISOString(),
  };
  return saveAgeVerification(record);
}

export async function listAgeVerificationsByUser(userId: string) {
  const items = await readAll();
  return items
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
