import fs from "node:fs";

export function resolveAssetsFlagFromEnv() {
  return (
    (process.env["ASSETS_FROM_S3"] ?? "false").toString().toLowerCase() ===
    "true"
  );
}

export function loadAssetsFlagAtRuntime() {
  let flag = (process.env["ASSETS_FROM_S3"] ?? "").toString().toLowerCase();
  if (!flag && fs.existsSync(".next/ASSETS_FROM_S3")) {
    flag = fs.readFileSync(".next/ASSETS_FROM_S3", "utf8").trim().toLowerCase();
  }
  return flag === "true";
}
