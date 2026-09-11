import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumAcMuseumMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/ac-museum",
  title: "AC COLLECTION",
  description:
    "AC COLLECTION AC Museum is the personal collection of AC. It contains the world’s best Subscape collection and other important generative art. VISIT AC COLLECTION",
  section: "Museum",
  blocks: [
    {
      type: "heading",
      content: "AC COLLECTION",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>AC Museum is the personal collection of AC. It contains the world's best Subscape collection and other important generative art. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://oncyber.io/6529om?coords=-139.01x14.52x402.20x1.49" rel="noopener noreferrer" target="_blank" data-migrated-wordpress-button>VISIT AC COLLECTION </a></p>'
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/AC-Collection-Screenshot.jpg",
        alt: "6529.io",
        width: 1300,
        height: 640,
        href: "https://oncyber.io/6529om?coords=-139.01x14.52x402.20x1.49",
      },
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
