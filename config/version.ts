import { execSync } from "node:child_process";

export function logOnceConfig(label: string, message: string) {
  if (!process.env[`__LOG_${label}_ONCE__`]) {
    process.env[`__LOG_${label}_ONCE__`] = "1";
    process.env["__LOG_ENV_ONCE__"] = "1";
    console.log(`${label}: ${message}`);
  }
}

export function computeVersionFromEnvOrGit() {
  let VERSION = process.env["VERSION"];
  if (VERSION) {
    logOnceConfig("VERSION (explicit)", VERSION);
    return VERSION;
  }
  try {
    VERSION = execSync("git rev-parse HEAD").toString().trim();
    logOnceConfig("VERSION (from git HEAD)", VERSION);
  } catch {
    VERSION = "6529seize";
    logOnceConfig("VERSION (default)", VERSION);
  }
  return VERSION;
}
