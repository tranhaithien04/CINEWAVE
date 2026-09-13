import "dotenv/config";

import { createApp } from "./helpers/create-app.js";
import { startBackgroundJobs } from "./helpers/jobs.js";
import { ensureAppSeed } from "./helpers/seed.js";

const port = Number(process.env.PORT ?? 4000);

const app = createApp();

await ensureAppSeed();

startBackgroundJobs();

app.listen(port, () => {
  console.log(`CINEWAVE API listening on :${port}`);
});
