import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  canonicalUrl,
  cleanText,
  compactJsonLdObject,
  graphJsonLd,
  nodeId,
  propertyValue,
  toAbsoluteHttpUrl,
} from "./utils";
import { organizationNode, webPageNode, websiteNode } from "./site";
import type { JsonLdObject } from "./types";

export function buildProfilePageJsonLd({
  profile,
  path,
}: {
  readonly profile: ApiIdentity;
  readonly path: string;
}): JsonLdObject {
  const display =
    cleanText(profile.handle) ?? cleanText(profile.display) ?? path;
  const profileId = nodeId(path, "profile");
  const mainEntity = buildProfileMainEntity(profile, profileId, display);
  const mainEntityId = mainEntity["@id"];

  return graphJsonLd([
    organizationNode(),
    websiteNode(),
    webPageNode({
      path,
      name: display,
      description: "6529 identity profile",
      mainEntityId: typeof mainEntityId === "string" ? mainEntityId : undefined,
      image: profile.pfp,
      type: isProfilePageEligible(profile.classification)
        ? ["ProfilePage", "WebPage"]
        : "WebPage",
    }),
    buildBreadcrumbListForProfile(display, path),
    mainEntity,
  ]);
}

function buildProfileMainEntity(
  profile: ApiIdentity,
  id: string,
  display: string
): JsonLdObject {
  const type = getProfileSchemaType(profile.classification);
  const rawSlug =
    cleanText(profile.normalised_handle) ??
    cleanText(profile.handle) ??
    cleanText(profile.display);
  const slug = rawSlug?.replace(/^@/, "");

  return compactJsonLdObject({
    "@type": type ?? "Thing",
    "@id": id,
    name: display,
    alternateName: cleanText(profile.handle),
    url: slug ? canonicalUrl(`/${slug}`) : undefined,
    image: toAbsoluteHttpUrl(profile.pfp),
    identifier: profile.id ?? profile.primary_wallet,
    additionalType: type ? undefined : profile.classification,
    additionalProperty: [
      propertyValue("Primary Wallet", profile.primary_wallet),
      propertyValue("Classification", profile.classification),
      propertyValue("Level", profile.level),
      propertyValue("TDH", profile.tdh),
      propertyValue("REP", profile.rep),
      propertyValue("CIC", profile.cic),
    ].filter((value): value is JsonLdObject => value !== undefined),
  });
}

function buildBreadcrumbListForProfile(
  display: string,
  path: string
): JsonLdObject {
  return compactJsonLdObject({
    "@type": "BreadcrumbList",
    itemListElement: [
      compactJsonLdObject({
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: canonicalUrl("/"),
      }),
      compactJsonLdObject({
        "@type": "ListItem",
        position: 2,
        name: display,
        item: canonicalUrl(path),
      }),
    ],
  });
}

function getProfileSchemaType(
  classification: ApiProfileClassification
): "Person" | "Organization" | undefined {
  if (
    classification === ApiProfileClassification.GovernmentName ||
    classification === ApiProfileClassification.Pseudonym
  ) {
    return "Person";
  }

  if (classification === ApiProfileClassification.Organization) {
    return "Organization";
  }

  return undefined;
}

function isProfilePageEligible(
  classification: ApiProfileClassification
): boolean {
  return getProfileSchemaType(classification) !== undefined;
}
