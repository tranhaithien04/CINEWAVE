import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { UserRecord } from "../models/user.js";

const dataDir = path.join(process.cwd(), "data");
const usersFile = path.join(dataDir, "users.json");

async function readUsers(): Promise<UserRecord[]> {
  try {
    const raw = await readFile(usersFile, "utf8");
    return JSON.parse(raw) as UserRecord[];
  } catch {
    return [];
  }
}

async function writeUsers(users: UserRecord[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(usersFile, JSON.stringify(users, null, 2), "utf8");
}

export async function findUserByEmail(email: string) {
  const users = await readUsers();
  return users.find((user) => user.email === email) ?? null;
}

export async function findUserById(id: string) {
  const users = await readUsers();
  return users.find((user) => user.id === id) ?? null;
}

export async function createUser(user: UserRecord) {
  const users = await readUsers();
  users.push(user);
  await writeUsers(users);
  return user;
}

export async function listUsers() {
  return readUsers();
}

export async function updateUser(id: string, patch: Partial<UserRecord>) {
  const users = await readUsers();
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], ...patch };
  await writeUsers(users);
  return users[index];
}
