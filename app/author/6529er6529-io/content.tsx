import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const author_6529er6529IoMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/author/6529er6529-io",
  title: "6529er",
  description: "Archive of migrated 6529 posts authored by 6529er.",
  section: "Author",
  blocks: [
    {
      type: "heading",
      content: "About 6529er",
    },
    {
      type: "heading",
      content: "INTRODUCING OM",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p> INTRODUCING OM This is the launch date of the alpha version of the first district of OM.&nbsp; The goal of OM is to build a fully [...]</p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
