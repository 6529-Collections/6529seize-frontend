import {
  buildBreadcrumbList,
  canonicalUrl,
  cleanText,
  compactJsonLdObject,
  graphJsonLd,
  nodeId,
  toAbsoluteHttpUrl,
} from "./utils";
import { organizationNode, webPageNode, websiteNode } from "./site";
import type { JsonLdObject } from "./types";

export function buildArticlePageJsonLd({
  path,
  headline,
  description,
  image,
  author,
  datePublished,
  dateModified,
  section,
}: {
  readonly path: string;
  readonly headline: string;
  readonly description?: string | undefined;
  readonly image?: string | undefined;
  readonly author?: string | undefined;
  readonly datePublished?: string | undefined;
  readonly dateModified?: string | undefined;
  readonly section?: string | undefined;
}): JsonLdObject {
  const articleId = nodeId(path, "article");

  return graphJsonLd([
    organizationNode(),
    websiteNode(),
    webPageNode({
      path,
      name: headline,
      description,
      mainEntityId: articleId,
      image,
    }),
    buildBreadcrumbList([
      { name: "Home", path: "/" },
      { name: section ?? "Articles", path: sectionPath(section) },
      { name: headline, path },
    ]),
    compactJsonLdObject({
      "@type": "Article",
      "@id": articleId,
      headline,
      description: cleanText(description),
      image: toAbsoluteHttpUrl(image),
      url: canonicalUrl(path),
      datePublished,
      dateModified,
      author: author
        ? compactJsonLdObject({ "@type": "Person", name: author })
        : undefined,
      publisher: { "@id": nodeId("/", "organization") },
      isPartOf: { "@id": nodeId("/", "website") },
    }),
  ]);
}

function sectionPath(section: string | undefined): string {
  if (section === "News") {
    return "/category/news";
  }

  if (section === "Education") {
    return "/education";
  }

  return "/category/blog";
}
