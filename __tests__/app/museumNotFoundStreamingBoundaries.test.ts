import fs from "node:fs";
import path from "node:path";
import {
  APP_ROOT,
  findStreamingBoundaries,
} from "./support/notFoundStreamingBoundaries";

function collectMuseumDetailRoutes(directory: string): string[] {
  const routes: string[] = [];
  for (const entry of fs.readdirSync(path.join(APP_ROOT, directory), {
    withFileTypes: true,
  })) {
    if (!entry.isDirectory()) continue;
    const child = `${directory}/${entry.name}`;
    if (
      child.includes("[") &&
      fs.existsSync(path.join(APP_ROOT, child, "page.tsx"))
    ) {
      routes.push(child);
    }
    routes.push(...collectMuseumDetailRoutes(child));
  }
  return routes;
}

const museumDetailRoutes = collectMuseumDetailRoutes("museum/network");

describe("Museum not-found streaming boundaries", () => {
  it("covers every Museum detail route", () => {
    expect(museumDetailRoutes.length).toBeGreaterThan(10);
  });

  it.each(museumDetailRoutes)(
    "keeps /%s free of streaming boundaries above its page",
    (route) => {
      expect(fs.existsSync(path.join(APP_ROOT, route))).toBe(true);
      expect(findStreamingBoundaries(route)).toEqual([]);
    }
  );
});
