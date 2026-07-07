import type { Metadata } from "next";

import MigratedWordPressArticlePage from "@/components/migrated-wordpress/MigratedWordPressArticlePage";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildArticlePageJsonLd } from "@/lib/structured-data/article";
import {
  getAppMetadata,
  LARGE_IMAGE_TWITTER_CARD,
} from "@/components/providers/metadata";
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

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: `${article.title} - 6529.io`,
    description: article.description,
    ogImage: article.heroImage?.src,
    ogImageAlt: article.heroImage?.alt,
    ogImageHeight: article.heroImage?.height,
    ogImageWidth: article.heroImage?.width,
    twitterCard: LARGE_IMAGE_TWITTER_CARD,
  });
}
