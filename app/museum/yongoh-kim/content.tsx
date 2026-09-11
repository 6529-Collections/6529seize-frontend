import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumYongohKimMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/yongoh-kim",
  title: "YONGOH KIM",
  description:
    "YONGOH KIM Yongoh Kim is probably the world’s largest collection of NFTs by South Korean artist Yongoh Kim. We simply like his aesthetic and think it works together cohesively. 90% of the pieces the Museum has acquired are currently on display; we need to m...",
  section: "Museum",
  blocks: [
    {
      type: "heading",
      content: "YONGOH KIM",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Yongoh Kim is probably the world's largest collection of NFTs by South Korean artist Yongoh Kim. We simply like his aesthetic and think it works together cohesively. 90% of the pieces the Museum has acquired are currently on display; we need to make a bigger gallery. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://oncyber.io/6529om?coords=116.94x2.8x-21.20x-1.59" rel="noopener noreferrer" target="_blank" data-migrated-wordpress-button>VISIT THE YONGOH KIM GALLERY </a></p>'
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Yongoh-Kim-Screenshot.jpg",
        alt: "6529.io",
        width: 1920,
        height: 955,
        href: "https://oncyber.io/6529om?coords=116.94x2.8x-21.20x-1.59",
      },
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
