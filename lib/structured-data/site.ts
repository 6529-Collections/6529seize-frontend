import {
  canonicalUrl,
  cleanText,
  compactJsonLdObject,
  getSiteUrl,
  graphJsonLd,
  nodeId,
  ORGANIZATION_NAME,
  SITE_NAME,
  toAbsoluteHttpUrl,
} from "./utils";
import type { JsonLdObject } from "./types";

const SITE_DESCRIPTION =
  "6529 is a decentralized network society and open community for digital art, culture, identity, and collective action.";

export function organizationNode(): JsonLdObject {
  return compactJsonLdObject({
    "@type": "Organization",
    "@id": nodeId("/", "organization"),
    name: ORGANIZATION_NAME,
    alternateName: SITE_NAME,
    url: getSiteUrl(),
    logo: toAbsoluteHttpUrl("/6529io.png"),
    description: SITE_DESCRIPTION,
    sameAs: ["https://twitter.com/6529Collections"],
  });
}

export function websiteNode(): JsonLdObject {
  return compactJsonLdObject({
    "@type": "WebSite",
    "@id": nodeId("/", "website"),
    name: SITE_NAME,
    url: getSiteUrl(),
    publisher: { "@id": nodeId("/", "organization") },
  });
}

export function webPageNode({
  path,
  name,
  description,
  mainEntityId,
  image,
  type = "WebPage",
}: {
  readonly path: string;
  readonly name: string;
  readonly description?: string | null | undefined;
  readonly mainEntityId?: string | undefined;
  readonly image?: string | null | undefined;
  readonly type?: string | readonly string[] | undefined;
}): JsonLdObject {
  return compactJsonLdObject({
    "@type": type,
    "@id": nodeId(path, "webpage"),
    url: canonicalUrl(path),
    name,
    description: cleanText(description),
    image: toAbsoluteHttpUrl(image),
    isPartOf: { "@id": nodeId("/", "website") },
    publisher: { "@id": nodeId("/", "organization") },
    mainEntity: mainEntityId ? { "@id": mainEntityId } : undefined,
  });
}

export function buildHomePageJsonLd(): JsonLdObject {
  return graphJsonLd([
    organizationNode(),
    websiteNode(),
    webPageNode({
      path: "/",
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      mainEntityId: nodeId("/", "organization"),
      image: "/6529io-banner.png",
    }),
  ]);
}
