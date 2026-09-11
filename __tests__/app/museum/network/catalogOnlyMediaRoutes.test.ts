import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function routeSource(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function bracedBlock(source: string, marker: string): string {
  const markerIndex = source.indexOf(marker);
  expect(markerIndex).toBeGreaterThanOrEqual(0);
  const openBrace = source.indexOf("{", markerIndex + marker.length);
  expect(openBrace).toBeGreaterThan(markerIndex);

  let depth = 0;
  for (let index = openBrace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(markerIndex, index + 1);
  }

  throw new Error(`Unclosed source block: ${marker}`);
}

describe("typed Museum routes keep media catalog-only", () => {
  it("does not read legacy artwork media inside the typed Collection branch", () => {
    const source = routeSource("app/museum/network/collection/page.tsx");
    const typedBranch = bracedBlock(
      source,
      "if (publication.works !== undefined)"
    );

    expect(typedBranch).not.toContain("publication.artworks");
    expect(typedBranch).not.toContain("legacyMedia");
    expect(typedBranch).toContain("isMuseumPermanentCollectionWork");
    expect(typedBranch).toContain("publicWorkItem(work, publication, view)");
  });

  it("presents governed accession media on permanent Collection cards", () => {
    const source = routeSource("app/museum/network/collection/page.tsx");
    const workProjection = bracedBlock(source, "function publicWorkItem(");

    expect(workProjection).toContain("work.presentationMedia?.[0]");
    expect(workProjection).toContain('kind: "proposal"');
    expect(workProjection).toContain("requireIntentForLargeSource: false");
    expect(workProjection).toContain("presentationMedia.credit.creditLine");
  });

  it("derives the Collection history from active holdings and acquisitions", () => {
    const source = routeSource("app/museum/network/collection/page.tsx");

    expect(source).toContain("holdings.length");
    expect(source).toContain("accessionedAcquisitions.length");
    expect(source).toContain("acquisitionHistoryDescription");
    expect(source).not.toContain("twelve works");
    expect(source).not.toContain("two completed gifts");
    expect(source).not.toContain("readonly creditLine?: string");
  });

  it("requires the typed acquisition catalog before building acquisition media", () => {
    const route = routeSource("app/museum/network/acquisitions/page.tsx");
    const landing = routeSource(
      "components/museum/acquisition/MuseumAcquisitionLanding.tsx"
    );
    const guard = route.indexOf("publication.works === undefined");
    const indexBuild = route.indexOf("buildMuseumAcquisitionIndex(");

    expect(guard).toBeGreaterThanOrEqual(0);
    expect(indexBuild).toBeGreaterThan(guard);
    expect(route).not.toContain("tryCaseyArtworksFromPublication");
    expect(landing).toContain(
      "if (publication.works === undefined) return [];"
    );
    expect(landing).toContain("selectMuseumStillMedia(work.media)");
    expect(landing).not.toContain("tryCaseyArtworksFromPublication");
    expect(landing).not.toContain("publication.artworks");
  });

  it("keeps large acquisition originals behind the existing intent gate", () => {
    const landing = routeSource(
      "components/museum/acquisition/MuseumAcquisitionLanding.tsx"
    );

    expect(landing).toContain("variants={media.variants}");
    expect(landing).not.toContain("requireIntentForLargeSource={false}");
  });

  it("selects the typed home branch before the legacy adapter", () => {
    const source = routeSource("app/museum/network/page.tsx");
    const typedBranch = bracedBlock(
      source,
      "if (publicationState.publication.works !== undefined)"
    );
    const legacyAdapter = source.indexOf(
      "const artworks = tryCaseyArtworksFromPublication"
    );

    expect(typedBranch).toContain("MuseumTypedNetworkHome");
    expect(typedBranch).not.toContain("tryCaseyArtworksFromPublication");
    expect(legacyAdapter).toBeGreaterThan(
      source.indexOf("if (publicationState.publication.works !== undefined)")
    );
  });

  it("presents the typed homepage collection through one acquisition section", () => {
    const source = routeSource("app/museum/network/page.tsx");
    const typedHomeStart = source.indexOf("function MuseumTypedNetworkHome(");
    const typedHomeEnd = source.indexOf(
      "function MuseumCaseyPresentation(",
      typedHomeStart
    );
    const typedHome = source.slice(typedHomeStart, typedHomeEnd);

    expect(typedHomeStart).toBeGreaterThanOrEqual(0);
    expect(typedHomeEnd).toBeGreaterThan(typedHomeStart);
    expect(typedHome).toContain("<MuseumTypedHomeHero");
    expect(typedHome.match(/<MuseumAcquisitionStories\b/gu)).toHaveLength(1);
    expect(source).not.toContain("MuseumTypedCollectionPresentation");
  });
});
