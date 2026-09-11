import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const authorTeexelsMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/author/teexels",
  title: "teexels",
  description: "Archive of migrated 6529 posts authored by teexels.",
  section: "Author",
  blocks: [
    {
      type: "heading",
      content: "About Teexels",
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
