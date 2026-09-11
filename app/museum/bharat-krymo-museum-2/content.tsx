import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumBharatKrymoMuseum2MigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/bharat-krymo-museum-2",
  title: "BHARAT KRYMO MUSEE D'ART 2",
  description:
    "BHARAT KRYMO MUSEE D'ART 2 Bharat Krymo Museum is the personal collection of Bharat Krymo, one of the great collectors in the NFT world, particularly in 1 of 1 art. VISIT BHARAT KRYMO MUSEE D'ART 2",
  section: "Museum",
  blocks: [
    {
      type: "heading",
      content: "BHARAT KRYMO MUSEE D'ART 2",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Bharat Krymo Museum is the personal collection of Bharat Krymo, one of the great collectors in the NFT world, particularly in 1 of 1 art. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://oncyber.io/6529om?coords=-125.23x2.8x195.75x1.32" rel="noopener noreferrer" target="_blank" data-migrated-wordpress-button>VISIT BHARAT KRYMO MUSEE D\'ART 2 </a></p>'
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/BK-Museum-2-Screenshot.jpg",
        alt: "6529.io",
        width: 1300,
        height: 643,
        href: "https://oncyber.io/6529om?coords=-125.23x2.8x195.75x1.32",
      },
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
