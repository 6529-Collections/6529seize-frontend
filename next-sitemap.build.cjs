const fs = require("node:fs");

require("tsx/cjs");

if (!process.env.PUBLIC_RUNTIME) {
  process.env.PUBLIC_RUNTIME = fs.readFileSync(
    ".next/PUBLIC_RUNTIME.json",
    "utf8"
  );
}

const sitemapConfig = require("./next-sitemap.config.ts");
const config = sitemapConfig.default ?? sitemapConfig;

if (!config || typeof config !== "object") {
  throw new Error("next-sitemap config did not export a config object");
}

module.exports = config;
