import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const routePath = (...segments: string[]): string =>
  join(process.cwd(), "app", "museum", "network", ...segments);

describe("Network Museum route contract", () => {
  it("ships the canonical hubs and typed detail route families", () => {
    const requiredRoutes = [
      ["collection", "page.tsx"],
      ["artists", "page.tsx"],
      ["artists", "[slug]", "page.tsx"],
      ["acquisitions", "page.tsx"],
      ["acquisitions", "[slug]", "page.tsx"],
      ["works", "page.tsx"],
      ["works", "[workId]", "page.tsx"],
      ["projects", "page.tsx"],
      ["projects", "[slug]", "page.tsx"],
      ["organizations", "page.tsx"],
      ["organizations", "[slug]", "page.tsx"],
      ["acquisition-programs", "page.tsx"],
      ["acquisition-programs", "[slug]", "page.tsx"],
      ["research", "page.tsx"],
      ["research", "[slug]", "page.tsx"],
      ["about", "page.tsx"],
      ["about", "governance", "page.tsx"],
      ["about", "governance", "[decisionId]", "page.tsx"],
    ];

    for (const route of requiredRoutes) {
      expect(existsSync(routePath(...route))).toBe(true);
    }
  });

  it("reserves Exhibition as a source type without exposing a route family", () => {
    expect(existsSync(routePath("exhibitions"))).toBe(false);
    const routeSource = readFileSync(
      join(process.cwd(), "lib", "museum", "publication", "routes.ts"),
      "utf8"
    );
    expect(routeSource).not.toContain("museumExhibitionHref");
  });
});
