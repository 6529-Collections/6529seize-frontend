import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumBonafidehanMuseumMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/bonafidehan-museum",
  title: "BONAFIDEHAN GALLERY",
  description:
    "BONAFIDEHAN GALLERY Bonfidehan Museum is the personal collection of Bonafidehan. It is the world’s premier collection of Tyler Hobbs art. It is the largest collection of Fidenzas and Incomplete Controls in the world. VISIT BONAFIDEHAN GALLERY",
  section: "Museum",
  blocks: [
    {
      type: "heading",
      content: "BONAFIDEHAN GALLERY",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Bonfidehan Museum is the personal collection of Bonafidehan. It is the world's premier collection of Tyler Hobbs art. It is the largest collection of Fidenzas and Incomplete Controls in the world. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://oncyber.io/6529om?coords=-119.63x2.8x472.51x1.51" rel="noopener noreferrer" target="_blank" data-migrated-wordpress-button>VISIT BONAFIDEHAN GALLERY </a></p>'
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/BFH-Gallery-Screenshot.jpg",
        alt: "6529.io",
        width: 1300,
        height: 645,
        href: "https://oncyber.io/6529om?coords=-119.63x2.8x472.51x1.51",
      },
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
