import type { Metadata } from "next";

import MigratedWordPressArticlePage from "@/components/migrated-wordpress/MigratedWordPressArticlePage";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildArticlePageJsonLd } from "@/lib/structured-data/article";
import { getMigratedWordPressPageMetadata } from "@/components/migrated-wordpress/metadata";
import { disneyDeekayMigratedWordPressArticle as article } from "./content";

export default function BlogDisneyDeekayTheirSecretToAnimationPage() {
  return (
    <>
      <JsonLdScript
        data={buildArticlePageJsonLd({
          path: article.path,
          headline: article.title,
          description: article.description,
          image: article.heroImage?.src,
          author: article.author.label,
          datePublished: article.publishedAt,
          dateModified: article.modifiedAt,
          section: article.section,
        })}
      />
      <MigratedWordPressArticlePage content={article} />
    </>
  );
}

export function generateMetadata(): Metadata {
  return getMigratedWordPressPageMetadata(article);
}
