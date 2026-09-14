import { UserModel } from "../db/models.js";
import { toPlain, toPlainList } from "../db/mongo.js";
import type { UserRecord } from "../models/user.js";

export async function findUserByEmail(email: string) {
  const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean();
  return toPlain<UserRecord>(doc);
}

export async function findUserById(id: string) {
  const doc = await UserModel.findOne({ id }).lean();
  return toPlain<UserRecord>(doc);
}

export async function findUserByGoogleId(googleId: string) {
  const doc = await UserModel.findOne({ googleId }).lean();
  return toPlain<UserRecord>(doc);
}

export async function findUserByEmailVerifyTokenHash(tokenHash: string) {
  const doc = await UserModel.findOne({ emailVerifyTokenHash: tokenHash }).lean();
  return toPlain<UserRecord>(doc);
}

export async function createUser(user: UserRecord) {
  const created = await UserModel.create({
    ...user,
    email: user.email.toLowerCase(),
  });
  return toPlain<UserRecord>(created.toObject())!;
}

export async function listUsers() {
  const docs = await UserModel.find().sort({ createdAt: 1 }).lean();
  return toPlainList<UserRecord>(docs);
}

export async function updateUser(id: string, patch: Partial<UserRecord>) {
  const nextPatch = patch.email ? { ...patch, email: patch.email.toLowerCase() } : patch;
  const doc = await UserModel.findOneAndUpdate({ id }, nextPatch, { new: true }).lean();
  return toPlain<UserRecord>(doc);
}
