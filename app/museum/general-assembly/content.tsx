import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGeneralAssemblyMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/general-assembly",
  title: "GENERAL ASSEMBLY",
  description:
    "GENERAL ASSEMBLY General Assembly is the General Assembly of the various communities in the 6529 Museum. In time, we we expect it to be active in the world at large. VISIT GENERAL ASSEMBLY",
  section: "Museum",
  blocks: [
    {
      type: "heading",
      content: "GENERAL ASSEMBLY",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>General Assembly is the General Assembly of the various communities in the 6529 Museum. In time, we we expect it to be active in the world at large. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://oncyber.io/6529om?coords=-117.88x2.8x76.13x1.53" rel="noopener noreferrer" target="_blank" data-migrated-wordpress-button>VISIT GENERAL ASSEMBLY </a></p>'
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/General-Assembly-Screenshot.jpg",
        alt: "6529.io",
        width: 1920,
        height: 950,
        href: "https://oncyber.io/6529om?coords=-117.88x2.8x76.13x1.53",
      },
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
