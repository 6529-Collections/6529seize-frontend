import type { Metadata } from "next";

import MigratedWordPressStaticPage from "@/components/migrated-wordpress/MigratedWordPressStaticPage";
import {
  getAppMetadata,
  LARGE_IMAGE_TWITTER_CARD,
} from "@/components/providers/metadata";
import { aboutMissionMigratedWordPressPage as content } from "./content";

export default function AboutMissionPage() {
  return <MigratedWordPressStaticPage content={content} />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: `${content.title} - 6529.io`,
    description: content.description,
    ogImage: content.heroImage?.src,
    ogImageAlt: content.heroImage?.alt,
    ogImageHeight: content.heroImage?.height,
    ogImageWidth: content.heroImage?.width,
    twitterCard: LARGE_IMAGE_TWITTER_CARD,
  });
}
