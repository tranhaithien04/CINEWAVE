import { AppMetaModel } from "../db/models.js";

export async function getAppMeta(key: string) {
  const doc = await AppMetaModel.findOne({ key }).lean();
  return doc?.value ?? null;
}

export async function setAppMeta(key: string, value: string) {
  await AppMetaModel.findOneAndUpdate({ key }, { key, value }, { upsert: true });
}
