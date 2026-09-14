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
      emailVerifiedAt: new Date().toISOString(),
    });
    console.log(`Seeded admin account ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } else {
    if (existing.role !== "ADMIN") {
      await updateUser(existing.id, { role: "ADMIN" });
    }
    if (!existing.emailVerifiedAt) {
      await updateUser(existing.id, { emailVerifiedAt: new Date().toISOString() });
    }
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
      emailVerifiedAt: new Date().toISOString(),
    });
    console.log("Seeded demo account demo@cinewave.vn / password1");
  } else if (!demo.emailVerifiedAt) {
    demo = (await updateUser(demo.id, { emailVerifiedAt: new Date().toISOString() })) ?? demo;
  }
  await ensureNotificationSeed(demo.id, demo.email);

  const STAFF_EMAIL = "staff@cinewave.vn";
  const existingStaff = await findUserByEmail(STAFF_EMAIL);
  if (!existingStaff) {
    await createUser({
      id: randomUUID(),
      email: STAFF_EMAIL,
      password: await bcrypt.hash("password1", 10),
      fullName: "Nhân viên Soát vé",
      role: "STAFF",
      createdAt: new Date().toISOString(),
      refreshTokenHash: null,
      emailVerifiedAt: new Date().toISOString(),
    });
    console.log(`Seeded staff account ${STAFF_EMAIL} / password1`);
  } else {
    if (existingStaff.role !== "STAFF") {
      await updateUser(existingStaff.id, { role: "STAFF" });
    }
    if (!existingStaff.emailVerifiedAt) {
      await updateUser(existingStaff.id, { emailVerifiedAt: new Date().toISOString() });
    }
  }
}
