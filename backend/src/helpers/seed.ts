import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

import { ensureBookingSeed } from "./booking-store.js";
import { ensureCatalogSeed } from "./catalog-store.js";
import { ensureNotificationSeed } from "./notification-store.js";
import { createUser, findUserByEmail, updateUser } from "./user-store.js";

const ADMIN_EMAIL = "admin@cinewave.vn";
const ADMIN_PASSWORD = "password1";

export async function ensureAppSeed() {
  await ensureCatalogSeed();
  await ensureBookingSeed();

  const existing = await findUserByEmail(ADMIN_EMAIL);
  if (!existing) {
    await createUser({
      id: randomUUID(),
      email: ADMIN_EMAIL,
      password: await bcrypt.hash(ADMIN_PASSWORD, 10),
      fullName: "CineWave Admin",
      role: "ADMIN",
      createdAt: new Date().toISOString(),
      refreshTokenHash: null,
    });
    console.log(`Seeded admin account ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } else if (existing.role !== "ADMIN") {
    await updateUser(existing.id, { role: "ADMIN" });
  }

  let demo = await findUserByEmail("demo@cinewave.vn");
  if (!demo) {
    demo = await createUser({
      id: randomUUID(),
      email: "demo@cinewave.vn",
      password: await bcrypt.hash("password1", 10),
      fullName: "Khách Demo",
      role: "CUSTOMER",
      createdAt: new Date().toISOString(),
      refreshTokenHash: null,
    });
    console.log("Seeded demo account demo@cinewave.vn / password1");
  }
  await ensureNotificationSeed(demo.id, demo.email);
}
