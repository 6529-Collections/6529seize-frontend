import fs from "node:fs";
import path from "node:path";

const globalStyles = fs
  .readFileSync(path.join(process.cwd(), "styles", "globals.css"), "utf8")
  .replaceAll(/\/\*[\s\S]*?\*\//gu, "");

const FONT_AWESOME_IMPORT =
  '@import "@fortawesome/fontawesome-svg-core/styles.css";';

describe("Font Awesome base styles", () => {
  // Server-rendered icons have no size until these rules load. Font Awesome
  // only adds them from JavaScript, so without this import an icon can paint
  // at the full container width before hydration.
  it("ship with the global stylesheet", () => {
    expect(globalStyles).toContain(FONT_AWESOME_IMPORT);
  });

  it("load before Tailwind so utility classes on icons still win", () => {
    expect(globalStyles.indexOf(FONT_AWESOME_IMPORT)).toBeLessThan(
      globalStyles.indexOf("@tailwind base;")
    );
  });
});
