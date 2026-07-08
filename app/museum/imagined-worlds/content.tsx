import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumImaginedWorldsMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/imagined-worlds",
  title: "IMAGINED WORLDS",
  description:
    "IMAGINED WORLDS Imagined Worlds is a gallery focused on interesting visions of different worlds by artists. The first half of the gallery tends towards the fantastical, the second towards the futuristic. VISIT IMAGINED WORLDS",
  section: "Museum",
  blocks: [
    {
      type: "heading",
      content: "IMAGINED WORLDS",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Imagined Worlds is a gallery focused on interesting visions of different worlds by artists. The first half of the gallery tends towards the fantastical, the second towards the futuristic. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://oncyber.io/6529om?coords=115.81x2.8x-47.23x-1.50" rel="noopener noreferrer" target="_blank" data-migrated-wordpress-button>VISIT IMAGINED WORLDS </a></p>'
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Imagined-Worlds-Screenshot.jpg",
        alt: "6529.io",
        width: 1920,
        height: 895,
        href: "https://oncyber.io/6529om?coords=115.81x2.8x-47.23x-1.50",
      },
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
