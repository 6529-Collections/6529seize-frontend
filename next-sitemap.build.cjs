require("tsx/cjs");

const sitemapConfig = require("./next-sitemap.config.ts");
const config = sitemapConfig.default ?? sitemapConfig;

if (!config || typeof config !== "object") {
  throw new Error("next-sitemap config did not export a config object");
}

module.exports = config;
