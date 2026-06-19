import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type MetadataSourceGuardrail = {
  readonly requiredSnippets: readonly string[];
  readonly routePath: string;
};

// Manually enrolled routes: add new standardized metadata surfaces here.
const standardizedMetadataSources: readonly MetadataSourceGuardrail[] = [
  {
    routePath: "app/the-memes/page.tsx",
    requiredSnippets: [
      "getLargeSocialCardMetadata(",
      "getCollectionSocialCardImagePath(",
    ],
  },
  {
    routePath: "app/the-memes/mint/page.tsx",
    requiredSnippets: [
      "getLargeSocialCardMetadata(",
      "getCollectionSocialCardImagePath(",
    ],
  },
  {
    routePath: "app/meme-lab/page.tsx",
    requiredSnippets: [
      "getLargeSocialCardMetadata(",
      "getCollectionSocialCardImagePath(",
    ],
  },
  {
    routePath: "app/6529-gradient/page.tsx",
    requiredSnippets: [
      "getLargeSocialCardMetadata(",
      "getCollectionSocialCardImagePath(",
    ],
  },
  {
    routePath: "app/6529-gradient/[id]/page.tsx",
    requiredSnippets: [
      "getLargeSocialCardMetadata(",
      "getNftSocialCardImagePath(",
    ],
  },
  {
    routePath: "app/rememes/page.tsx",
    requiredSnippets: [
      "getLargeSocialCardMetadata(",
      "getCollectionSocialCardImagePath(",
    ],
  },
  {
    routePath: "app/rememes/add/page.tsx",
    requiredSnippets: [
      "getLargeSocialCardMetadata(",
      "getCollectionSocialCardImagePath(",
    ],
  },
  {
    routePath: "app/rememes/[contract]/[id]/page.tsx",
    requiredSnippets: [
      "getLargeSocialCardMetadata(",
      "getNftSocialCardImagePath(",
    ],
  },
  {
    routePath: "app/nextgen/[[...view]]/page.tsx",
    requiredSnippets: [
      "getLargeSocialCardMetadata(",
      "getCollectionSocialCardImagePath(",
    ],
  },
  {
    routePath: "app/nextgen/manager/page.tsx",
    requiredSnippets: [
      "getLargeSocialCardMetadata(",
      "getCollectionSocialCardImagePath(",
    ],
  },
  {
    routePath: "app/nextgen/collection/[collection]/page-utils.ts",
    requiredSnippets: [
      "getLargeSocialCardMetadata(",
      "getCollectionSocialCardImagePath(",
    ],
  },
  {
    routePath: "app/nextgen/collection/[collection]/[[...view]]/page.tsx",
    requiredSnippets: ["getNextgenCollectionMetadata("],
  },
  {
    routePath: "app/nextgen/token/[token]/[[...view]]/page.tsx",
    requiredSnippets: [
      "getLargeSocialCardMetadata(",
      "getNftSocialCardImagePath(",
    ],
  },
];

// Heuristics for the most common drift patterns, not exhaustive source parsing.
const manualLargeTwitterCard = /twitterCard\s*:\s*["']summary_large_image["']/;
const directBaseEndpointOgImage =
  /ogImage\s*:\s*`[^`]*\$\{publicEnv\.BASE_ENDPOINT\}/;

const readSource = (routePath: string): string => {
  const absoluteRoutePath = path.join(process.cwd(), routePath);

  if (!existsSync(absoluteRoutePath)) {
    throw new Error(
      `Expected guardrailed metadata route "${routePath}" to exist. ` +
        "If this route moved or was renamed, update standardizedMetadataSources."
    );
  }

  return readFileSync(absoluteRoutePath, "utf8");
};

describe("standardized social-card metadata route guardrails", () => {
  it.each(standardizedMetadataSources)(
    "$routePath keeps using shared social-card metadata helpers",
    ({ requiredSnippets, routePath }) => {
      const source = readSource(routePath);

      requiredSnippets.forEach((snippet) => {
        expect(source).toContain(snippet);
      });
      expect(source).not.toMatch(manualLargeTwitterCard);
      expect(source).not.toMatch(directBaseEndpointOgImage);
    }
  );
});
