import type { ApiOgMetadata } from "@/generated/models/ApiOgMetadata";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  buildBreadcrumbList,
  canonicalUrl,
  cleanText,
  compactJsonLdObject,
  graphJsonLd,
  interactionCounter,
  nodeId,
  propertyValue,
  toAbsoluteHttpUrl,
} from "./utils";
import { organizationNode, webPageNode, websiteNode } from "./site";
import type { JsonLdObject } from "./types";

export function buildWavesIndexPageJsonLd(): JsonLdObject {
  const wavesId = nodeId("/waves", "waves");

  return graphJsonLd([
    organizationNode(),
    websiteNode(),
    compactJsonLdObject({
      "@type": "Collection",
      "@id": wavesId,
      name: "Waves",
      description:
        "Public 6529 waves for discussions, curation, submissions, and collaboration.",
      url: canonicalUrl("/waves"),
      creator: { "@id": nodeId("/", "organization") },
    }),
    webPageNode({
      path: "/waves",
      name: "Waves",
      description: "Browse and explore 6529 waves.",
      mainEntityId: wavesId,
      type: ["CollectionPage", "WebPage"],
    }),
    buildBreadcrumbList([
      { name: "Home", path: "/" },
      { name: "Waves", path: "/waves" },
    ]),
  ]);
}

export function buildWavePageJsonLd({
  wave,
  path,
  dropMetadata,
}: {
  readonly wave: ApiWave;
  readonly path: string;
  readonly dropMetadata?: ApiOgMetadata | null | undefined;
}): JsonLdObject {
  const waveId = nodeId(`/waves/${wave.id}`, "wave");
  const dropNode = dropMetadata?.drop
    ? buildDropNode({ metadata: dropMetadata, path, waveId })
    : null;
  const mainEntityId = dropNode?.["@id"];

  return graphJsonLd([
    organizationNode(),
    websiteNode(),
    compactJsonLdObject({
      "@type": "Collection",
      "@id": waveId,
      name: wave.name,
      description: cleanText(wave.description_drop?.parts?.[0]?.content),
      url: canonicalUrl(`/waves/${wave.id}`),
      image: toAbsoluteHttpUrl(wave.picture),
      creator: buildProfileRef(wave.author),
      dateCreated: formatMillis(wave.created_at),
      interactionStatistic: [
        interactionCounter("FollowAction", wave.metrics?.subscribers_count),
        interactionCounter("WriteAction", wave.metrics?.drops_count),
      ].filter((value): value is JsonLdObject => value !== undefined),
      additionalProperty: [
        propertyValue("Wave ID", wave.id),
        propertyValue("Serial Number", wave.serial_no),
      ].filter((value): value is JsonLdObject => value !== undefined),
    }),
    webPageNode({
      path,
      name: dropMetadata?.drop?.title ?? wave.name,
      description: dropMetadata?.drop?.description ?? "6529 wave",
      mainEntityId: typeof mainEntityId === "string" ? mainEntityId : waveId,
      image:
        dropMetadata?.drop?.media?.[0]?.url ??
        dropMetadata?.wave?.media?.[0]?.url ??
        wave.picture,
      type: ["CollectionPage", "WebPage"],
    }),
    buildBreadcrumbList([
      { name: "Home", path: "/" },
      { name: "Waves", path: "/waves" },
      { name: wave.name, path: `/waves/${wave.id}` },
    ]),
    ...(dropNode ? [dropNode] : []),
  ]);
}

function buildDropNode({
  metadata,
  path,
  waveId,
}: {
  readonly metadata: ApiOgMetadata;
  readonly path: string;
  readonly waveId: string;
}): JsonLdObject | null {
  const drop = metadata.drop;
  if (!drop) {
    return null;
  }

  const id = nodeId(path, "drop");
  const voteInteraction = interactionCounter(
    "VoteAction",
    drop.votes?.voters_count
  );

  return compactJsonLdObject({
    "@type": "SocialMediaPosting",
    "@id": id,
    headline: cleanText(drop.title) ?? `Drop #${drop.serial_no}`,
    articleBody: cleanText(drop.content ?? drop.description),
    datePublished: formatMillis(drop.submitted_at),
    image: drop.media
      ?.map((media) => toAbsoluteHttpUrl(media.url))
      .filter(isString),
    url: canonicalUrl(path),
    author: metadata.author ? buildProfileRef(metadata.author) : undefined,
    isPartOf: { "@id": waveId },
    interactionStatistic: voteInteraction ? [voteInteraction] : undefined,
    additionalProperty: [
      propertyValue("Drop ID", drop.id),
      propertyValue("Serial Number", drop.serial_no),
      propertyValue("Drop Type", drop.drop_type),
      propertyValue("Submission Status", drop.submission_status),
    ].filter((value): value is JsonLdObject => value !== undefined),
  });
}

function buildProfileRef(profile: {
  readonly handle?: string | null | undefined;
  readonly primary_address?: string | null | undefined;
  readonly pfp?: string | null | undefined;
}): JsonLdObject {
  const handle = cleanText(profile.handle);

  return compactJsonLdObject({
    "@type": "Person",
    name: handle ?? profile.primary_address,
    alternateName: handle,
    url: handle ? canonicalUrl(`/${handle}`) : undefined,
    image: toAbsoluteHttpUrl(profile.pfp),
    identifier: profile.primary_address,
  });
}

function formatMillis(value: number | null | undefined): string | undefined {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function isString(value: string | undefined): value is string {
  return typeof value === "string";
}
