import "dotenv/config";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");

import { connectMongo } from "./db/mongo.js";
import { createApp } from "./helpers/create-app.js";
import { startBackgroundJobs } from "./helpers/jobs.js";
import { ensureAppSeed } from "./helpers/seed.js";

const port = Number(process.env.PORT ?? 4000);

await connectMongo();

const app = createApp();

await ensureAppSeed();

startBackgroundJobs();

app.listen(port, () => {
  console.log(`CINEWAVE API listening on :${port}`);
});
