/**
 * @jest-environment node
 */

import fs from "node:fs";
import path from "node:path";

const APP_DIR = path.resolve(__dirname, "..", "..", "app");

const { scanAppRoutes } = require("../../scripts/routes-manifest.cjs") as {
  scanAppRoutes: (appDir: string) => string[];
};

describe("removed /feed route", () => {
  it("has no page or route handler, so Next serves its normal 404", () => {
    expect(fs.existsSync(path.join(APP_DIR, "feed"))).toBe(false);
    expect(scanAppRoutes(APP_DIR).filter((route) => route === "/feed")).toEqual(
      []
    );
  });

  it("is left to the profile route, which answers 404 for unknown handles", () => {
    expect(scanAppRoutes(APP_DIR)).toContain("/[user]");
  });
});
