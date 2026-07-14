import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529PhotoAMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-photo-a",
  title: "6529 PHOTO A",
  description:
    "6529 PHOTO A 6529 Photo A is our first photography gallery, with pieces from both highly established and emerging NFT photographers. We have outgrown this gallery and will eventually merge into a larger space. VISIT 6529 PHOTO A",
  section: "Museum",
  blocks: [
    {
      type: "heading",
      content: "6529 PHOTO A",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>6529 Photo A is our first photography gallery, with pieces from both highly established and emerging NFT photographers. We have outgrown this gallery and will eventually merge into a larger space. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://oncyber.io/6529om?coords=108.57x2.8x348.03x-1.62" rel="noopener noreferrer" target="_blank" data-migrated-wordpress-button>VISIT 6529 PHOTO A </a></p>'
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/6529-Photo-A-Screenshot.jpg",
        alt: "6529.io",
        width: 1920,
        height: 951,
        href: "https://oncyber.io/6529om?coords=108.57x2.8x348.03x-1.62",
      },
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
