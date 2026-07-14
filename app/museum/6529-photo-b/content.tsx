import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529PhotoBMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-photo-b",
  title: "6529 PHOTO B",
  description:
    "6529 PHOTO B 6529 Photo B is our second photography gallery, also with pieces from established and emerging collections. At some point it will be merged into a larger space. VISIT 6529 PHOTO B",
  section: "Museum",
  blocks: [
    {
      type: "heading",
      content: "6529 PHOTO B",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>6529 Photo B is our second photography gallery, also with pieces from established and emerging collections. At some point it will be merged into a larger space. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://oncyber.io/6529om?coords=107.85x2.8x393.99x-1.59" rel="noopener noreferrer" target="_blank" data-migrated-wordpress-button>VISIT 6529 PHOTO B </a></p>'
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/6529-Photo-B-Screenshot.jpg",
        alt: "6529.io",
        width: 1920,
        height: 958,
        href: "https://oncyber.io/6529om?coords=107.85x2.8x393.99x-1.59",
      },
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
