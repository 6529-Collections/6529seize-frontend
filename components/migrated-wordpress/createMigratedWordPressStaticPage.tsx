import type { Metadata } from "next";

import MigratedWordPressStaticPage from "./MigratedWordPressStaticPage";
import { getMigratedWordPressPageMetadata } from "./metadata";
import type { MigratedWordPressStaticPageContent } from "./types";

export function createMigratedWordPressStaticPage(
  content: MigratedWordPressStaticPageContent
) {
  function Page() {
    return <MigratedWordPressStaticPage content={content} />;
  }

  function generateMetadata(): Metadata {
    return getMigratedWordPressPageMetadata(content);
  }

  return { Page, generateMetadata };
}
