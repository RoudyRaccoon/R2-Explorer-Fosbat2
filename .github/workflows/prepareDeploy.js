// packages/github-action/prepareDeploy.js
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";

// ------------------------
// CONFIG
// ------------------------
const ROOT = path.resolve("../../"); // adjust if necessary
const DASHBOARD_SRC = path.join(ROOT, "dist/spa"); // Quasar SPA build output
const WORKER_DIR = path.join(ROOT, "packages/github-action"); // Worker folder
const WORKER_PUBLIC_DIR = path.join(WORKER_DIR, "public"); // Worker serves files from here

console.log("Preparing deployment...");

// ------------------------
// 1. Ensure Worker public folder exists
// ------------------------
fs.ensureDirSync(WORKER_PUBLIC_DIR);

// ------------------------
// 2. Clean old assets
// ------------------------
fs.emptyDirSync(WORKER_PUBLIC_DIR);

// ------------------------
// 3. Copy latest SPA build to Worker public folder
// ------------------------
console.log(`Copying latest SPA build from ${DASHBOARD_SRC} to Worker public folder...`);
fs.copySync(DASHBOARD_SRC, WORKER_PUBLIC_DIR, { overwrite: true });

// ------------------------
// 4. Optional: inject environment variables
// ------------------------
const envVars = {
  R2EXPLORER_WORKER_NAME: process.env.R2EXPLORER_WORKER_NAME,
  R2EXPLORER_CONFIG: process.env.R2EXPLORER_CONFIG,
  R2EXPLORER_BUCKETS: process.env.R2EXPLORER_BUCKETS,
  R2EXPLORER_DOMAIN: process.env.R2EXPLORER_DOMAIN,
};

const envFile = path.join(WORKER_DIR, ".env");
fs.writeFileSync(envFile, Object.entries(envVars).map(([k,v]) => `${k}=${v}`).join("\n"));
console.log("Environment variables written.");

// ------------------------
// 5. Done
// ------------------------
console.log("Worker prepared for deployment.");
