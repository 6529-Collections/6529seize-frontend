import type { Metadata } from "next";

import MigratedWordPressStaticPage from "@/components/migrated-wordpress/MigratedWordPressStaticPage";
import { getMigratedWordPressPageMetadata } from "@/components/migrated-wordpress/metadata";
import { authorNft6529MigratedWordPressPage as content } from "./content";

export default function AuthorNft6529Page() {
  return <MigratedWordPressStaticPage content={content} />;
}

export function generateMetadata(): Metadata {
  return getMigratedWordPressPageMetadata(content);
}
