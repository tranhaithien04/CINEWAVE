import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(path.join(dataDir, filename), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile(filename: string, value: unknown) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(path.join(dataDir, filename), JSON.stringify(value, null, 2), "utf8");
}
