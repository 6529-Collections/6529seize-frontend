import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  museumResearchEditorialMedia,
  resolveExactWorkMediaById,
} from "@/app/museum/network/research/media";
import type {
  MuseumExternalProposalPresentationMedia,
  MuseumMedia,
  MuseumPublication,
} from "@/lib/museum/publication/types";

interface ResearchMediaDerivative {
  readonly file: string;
  readonly sha256: string;
  readonly width: number;
  readonly height: number;
}

interface ResearchMediaAsset {
  readonly id: string;
  readonly files: readonly string[];
  readonly mediaType: string;
  readonly preservationStatus: "retained_verified" | "retained_unverified";
  readonly sourceWorkId?: string;
  readonly role: string;
  readonly derivatives?: readonly ResearchMediaDerivative[];
}

interface ResearchMediaManifest {
  readonly assets: readonly ResearchMediaAsset[];
}

describe("Museum Research retained media", () => {
  it("keeps every Magnum display derivative present and hash-exact", () => {
    const publicRoot = join(
      process.cwd(),
      "public",
      "museum",
      "research",
      "editorial"
    );
    const manifest = JSON.parse(
      readFileSync(join(publicRoot, "media-manifest.json"), "utf8")
    ) as ResearchMediaManifest;
    const assets = manifest.assets.filter(
      (asset) =>
        asset.role === "museum_local_display_copy_of_governed_accession_media"
    );

    expect(assets.map((asset) => asset.sourceWorkId)).toEqual([
      "6529NM-W-0024",
      "6529NM-W-0025",
      "6529NM-W-0026",
      "6529NM-W-0027",
      "6529NM-W-0028",
    ]);

    for (const asset of assets) {
      expect(asset.preservationStatus).toBe("retained_verified");
      expect(asset.derivatives).toHaveLength(2);
      for (const derivative of asset.derivatives ?? []) {
        const bytes = readFileSync(join(publicRoot, derivative.file));
        expect(createHash("sha256").update(bytes).digest("hex")).toBe(
          derivative.sha256
        );
      }
    }
  });

  it("keeps every declared editorial derivative present and hash-exact", () => {
    const publicRoot = join(
      process.cwd(),
      "public",
      "museum",
      "research",
      "editorial"
    );
    const manifest = JSON.parse(
      readFileSync(join(publicRoot, "media-manifest.json"), "utf8")
    ) as ResearchMediaManifest;

    for (const asset of manifest.assets) {
      expect(asset.preservationStatus).toBe("retained_verified");
      expect(asset.derivatives).toBeDefined();
      expect(asset.derivatives?.map((derivative) => derivative.file)).toEqual(
        asset.files
      );
      for (const derivative of asset.derivatives ?? []) {
        const bytes = readFileSync(join(publicRoot, derivative.file));
        expect(createHash("sha256").update(bytes).digest("hex")).toBe(
          derivative.sha256
        );
      }
    }
  });

  it("builds media metadata from the manifest without drift", () => {
    const publicRoot = join(
      process.cwd(),
      "public",
      "museum",
      "research",
      "editorial"
    );
    const manifest = JSON.parse(
      readFileSync(join(publicRoot, "media-manifest.json"), "utf8")
    ) as ResearchMediaManifest;

    for (const asset of manifest.assets) {
      const derivative = asset.derivatives?.at(-1);
      if (derivative === undefined) throw new Error(`missing:${asset.files}`);
      const media = museumResearchEditorialMedia({
        id: asset.id,
        file: derivative.file,
        altText: asset.id,
        creditLine: "test",
        licenseLabel: "test",
        licenseUrl: "https://example.com/license",
      });

      expect(media.mediaType).toBe(asset.mediaType);
      expect(media.width).toBe(derivative.width);
      expect(media.height).toBe(derivative.height);
      expect(media.preservationStatus).toBe(asset.preservationStatus);
      expect(media.sha256).toBe(`sha256:${derivative.sha256}`);
    }
  });

  it("aligns stable Magnum URLs with their manifest dimensions", () => {
    const publicRoot = join(
      process.cwd(),
      "public",
      "museum",
      "research",
      "editorial"
    );
    const manifest = JSON.parse(
      readFileSync(join(publicRoot, "media-manifest.json"), "utf8")
    ) as ResearchMediaManifest;
    const stableAssets = manifest.assets.filter(
      (asset) => asset.sourceWorkId !== undefined
    );

    for (const asset of stableAssets) {
      const derivative = asset.derivatives?.find((candidate) =>
        candidate.file.endsWith("-1280.webp")
      );
      if (asset.sourceWorkId === undefined || derivative === undefined) {
        throw new Error(`missing-stable-derivative:${asset.id}`);
      }
      const sourceMedia = museumResearchEditorialMedia({
        id: asset.id,
        file: derivative.file,
        altText: asset.id,
        creditLine: "test",
        licenseLabel: "test",
        licenseUrl: "https://example.com/license",
      });
      const publication = {
        works: [{ id: asset.sourceWorkId, media: [sourceMedia] }],
      } as unknown as MuseumPublication;

      expect(
        resolveExactWorkMediaById(publication, asset.sourceWorkId)
      ).toEqual({
        media: expect.objectContaining({
          url: `/museum/research/editorial/${derivative.file}`,
          width: derivative.width,
          height: derivative.height,
        }),
        mediaSrcSet: expect.stringContaining(`${derivative.width}w`),
      });
    }
  });

  it("replaces upstream delivery metadata with the retained Magnum derivative contract", () => {
    const publicRoot = join(
      process.cwd(),
      "public",
      "museum",
      "research",
      "editorial"
    );
    const manifest = JSON.parse(
      readFileSync(join(publicRoot, "media-manifest.json"), "utf8")
    ) as ResearchMediaManifest;
    const asset = manifest.assets.find(
      (candidate) => candidate.sourceWorkId === "6529NM-W-0024"
    );
    const derivative = asset?.derivatives?.find((candidate) =>
      candidate.file.endsWith("-1280.webp")
    );
    if (asset === undefined || derivative === undefined) {
      throw new Error("missing-stable-magnum-fixture");
    }
    const presentationMedia = {
      id: "upstream-magnum-media",
      kind: "external_proposal_presentation",
      mediaUrl: "https://example.com/source.jpg",
      mediaMimeType: "image/jpeg",
      sourceByteSize: 1,
      variants: [
        {
          url: "https://example.com/delivery.jpg",
          width: 1280,
          height: 960,
          byteSize: 1,
          sha256: `sha256:${"a".repeat(64)}`,
        },
      ],
      width: 1280,
      height: 960,
      altText: "Governed alt text",
      source: { mediaRecordPath: "records/media.json" },
      credit: {
        creditLine: "Governed credit",
        sourcePath: "records/media.json",
      },
      rights: {
        licenseLabel: "All Rights Reserved",
        licenseUrl: null,
      },
      download: "not_permitted",
      preservation: "not_retained",
      affordances: [],
    } as unknown as MuseumExternalProposalPresentationMedia;
    const publication = {
      works: [
        {
          id: "6529NM-W-0024",
          media: [],
          presentationMedia: [presentationMedia],
        },
      ],
    } as unknown as MuseumPublication;

    expect(resolveExactWorkMediaById(publication, "6529NM-W-0024")).toEqual({
      media: expect.objectContaining({
        mediaType: asset.mediaType,
        url: `/museum/research/editorial/${derivative.file}`,
        sourcePath: "public/museum/research/editorial/media-manifest.json",
        custody: "retained",
        preservationStatus: asset.preservationStatus,
        sha256: `sha256:${derivative.sha256}`,
        upstreamProvider: null,
        altText: "Governed alt text",
      }),
      mediaSrcSet: expect.stringContaining(`${derivative.width}w`),
    });
  });

  it("preserves the original media for an unmapped work", () => {
    const media: MuseumMedia = {
      id: "test-media",
      artworkId: "6529NM-W-9999",
      kind: "still",
      role: "source",
      mediaType: "image/webp",
      width: 320,
      height: 240,
      altText: "test",
      credit: {
        creditLine: "test",
        licenseLabel: "test",
        licenseUrl: "https://example.com/license",
        rightsExpressionId: null,
        sourcePath: "test",
      },
      sourcePath: "test",
      custody: "retained",
      url: "https://example.com/fallback.webp",
      preservationStatus: "retained_verified",
      sha256: `sha256:${"a".repeat(64)}`,
      upstreamProvider: null,
    };
    const publication = {
      works: [{ id: "6529NM-W-9999", media: [media] }],
    } as unknown as MuseumPublication;

    expect(resolveExactWorkMediaById(publication, "6529NM-W-9999")).toEqual({
      media,
    });
  });
});
