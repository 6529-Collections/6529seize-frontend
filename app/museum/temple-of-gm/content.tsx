import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumTempleOfGmMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/temple-of-gm",
  title: "TEMPLE OF GM",
  description:
    "TEMPLE OF GM The Temple of gm is our crowd-sourced collection of gm art, the key message of the metaverse. Also, gm. VISIT TEMPLE OF GM",
  section: "Museum",
  blocks: [
    {
      type: "heading",
      content: "TEMPLE OF GM",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>The Temple of gm is our crowd-sourced collection of gm art, the key message of the metaverse. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Also, gm.</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://oncyber.io/6529om?coords=-74.35x2.8x-107.85x-0.17" rel="noopener noreferrer" target="_blank" data-migrated-wordpress-button>VISIT TEMPLE OF GM </a></p>'
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Temple-of-GM-Screenshot.jpg",
        alt: "6529.io",
        width: 1920,
        height: 953,
        href: "https://oncyber.io/6529om?coords=-74.35x2.8x-107.85x-0.17",
      },
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
