import manifest from "@/app/manifest";
import { getAppEnvironment } from "@/config/appEnvironment";
import { publicEnv } from "@/config/env";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("web app manifest", () => {
  const result = manifest();

  it("names the app after the current environment", () => {
    const environment = getAppEnvironment(publicEnv.BASE_ENDPOINT);

    expect(result.name).toBe(environment.title);
    expect(result.short_name).toBe(
      environment.isProduction ? "6529" : environment.title
    );
  });

  it("opens in a regular browser tab and stays within the origin root", () => {
    expect(result.display).toBe("browser");
    expect(result.start_url).toBe("/");
    expect(result.scope).toBe("/");
    expect(result.id).toBe("/");
  });

  it("uses the black brand surface for the splash and toolbar colors", () => {
    expect(result.background_color).toBe("#000000");
    expect(result.theme_color).toBe("#000000");
  });

  it("references committed icons for each declared size and purpose", () => {
    expect(result.icons?.map(({ sizes, purpose }) => [sizes, purpose])).toEqual(
      [
        ["192x192", "any"],
        ["512x512", "any"],
        ["512x512", "maskable"],
      ]
    );

    for (const icon of result.icons ?? []) {
      expect(existsSync(join(process.cwd(), "public", icon.src))).toBe(true);
    }
  });
});
