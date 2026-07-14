import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const categoryNewsMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/category/news",
  title: "NEWS",
  description: "Archive of migrated 6529 news posts.",
  section: "Archive",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>6529 News and Announcements</p>"),
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
