import mongoose from "mongoose";

export async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Thiếu MONGODB_URI. Thêm connection string Atlas vào backend/.env");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log(`MongoDB connected → ${mongoose.connection.name}`);
}

export function mongoStatus() {
  return mongoose.connection.readyState === 1 ? "connected" : "disconnected";
}

export function toPlain<T>(doc: unknown): T | null {
  if (!doc || typeof doc !== "object") return null;
  const { _id: _unusedId, __v: _unusedV, ...rest } = doc as Record<string, unknown>;
  return rest as T;
}

export function toPlainList<T>(docs: unknown[]): T[] {
  return docs.map((doc) => toPlain<T>(doc)).filter((item): item is T => item !== null);
}
