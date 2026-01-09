import { publicEnvSchema } from "./env.schema";
import fs from "node:fs";

export function persistBakedArtifacts(
  publicEnv: string,
  ASSETS_FROM_S3: boolean
) {
  try {
    fs.mkdirSync(".next", { recursive: true });
    fs.writeFileSync(
      ".next/PUBLIC_RUNTIME.json",
      JSON.stringify(publicEnv),
      "utf8"
    );
    fs.writeFileSync(
      ".next/ASSETS_FROM_S3",
      ASSETS_FROM_S3 ? "true" : "false",
      "utf8"
    );
  } catch {}
}

export function loadBakedRuntimeConfig(VERSION: string) {
  let baked = {};
  if (process.env["PUBLIC_RUNTIME"]) {
    baked = JSON.parse(process.env["PUBLIC_RUNTIME"]);
  } else if (fs.existsSync(".next/PUBLIC_RUNTIME.json")) {
    baked = JSON.parse(fs.readFileSync(".next/PUBLIC_RUNTIME.json", "utf8"));
  }
  const parsed = publicEnvSchema.safeParse({ ...baked, VERSION });
  if (!parsed.success) throw parsed.error; // FAIL-FAST
  return parsed.data;
}
