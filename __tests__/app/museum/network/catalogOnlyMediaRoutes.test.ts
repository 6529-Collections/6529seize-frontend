import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function routeSource(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function functionBody(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return source.slice(startIndex, endIndex);
}

describe("typed Museum routes keep media catalog-only", () => {
  it("does not read legacy artwork media inside the typed Collection branch", () => {
    const source = routeSource("app/museum/network/collection/page.tsx");
    const typedBranch = functionBody(
      source,
      "if (typedHoldings !== undefined)",
      "const artworks = tryCaseyArtworksFromPublication"
    );

    expect(typedBranch).not.toContain("publication.artworks");
    expect(typedBranch).not.toContain("legacyMedia");
    expect(typedBranch).toContain("MuseumPublicWorkTextFigure");
  });

  it.each([
    [
      "acquisitions",
      "app/museum/network/acquisitions/page.tsx",
      "function AcquisitionPreview",
      "function AcquisitionEditorialRow",
      "return legacyAcquisitionPreview",
    ],
    [
      "home",
      "app/museum/network/page.tsx",
      "function MuseumAcquisitionStoryMedia",
      "function MuseumAcquisitionStories",
      "return legacyAcquisitionStoryMedia",
    ],
  ])(
    "closes the typed %s preview before its pre-ontology adapter",
    (_, path, start, end, legacyMarker) => {
      const body = functionBody(routeSource(path), start, end);
      const typedBoundary = body.indexOf(
        "if (publication.works !== undefined)"
      );
      const legacyBoundary = body.indexOf(legacyMarker);

      expect(typedBoundary).toBeGreaterThanOrEqual(0);
      expect(legacyBoundary).toBeGreaterThan(typedBoundary);
      expect(body.slice(0, typedBoundary)).toContain("presentationMedia[0]");
      expect(body.slice(typedBoundary, legacyBoundary)).toContain(
        "MuseumPublicWorkTextFigure"
      );
    }
  );
});
