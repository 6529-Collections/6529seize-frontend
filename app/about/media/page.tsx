import type { Metadata } from "next";

import MigratedWordPressStaticPage from "@/components/migrated-wordpress/MigratedWordPressStaticPage";
import { getMigratedWordPressPageMetadata } from "@/components/migrated-wordpress/metadata";
import { aboutMediaMigratedWordPressPage as content } from "./content";

export default function AboutMediaPage() {
  return <MigratedWordPressStaticPage content={content} />;
}

export function generateMetadata(): Metadata {
  return getMigratedWordPressPageMetadata(content);
}
