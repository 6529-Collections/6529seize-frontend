import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529PublicDomainMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-public-domain",
  title: "6529 PUBLIC DOMAIN",
  description:
    "6529 PUBLIC DOMAIN 6529 Public Domain contains the art of the 6529 Museum that was placed by the artist in the public domain. Please take this art and do great things with it. VISIT 6529 PUBLIC DOMAIN",
  section: "Museum",
  blocks: [
    {
      type: "heading",
      content: "6529 PUBLIC DOMAIN",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>6529 Public Domain contains the art of the 6529 Museum that was placed by the artist in the public domain. Please take this art and do great things with it. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://oncyber.io/6529om?coords=90.32x2.8x-97.37x0.01" rel="noopener noreferrer" target="_blank" data-migrated-wordpress-button>VISIT 6529 PUBLIC DOMAIN </a></p>'
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/6529-Public-Domain-Screenshot.jpg",
        alt: "6529.io",
        width: 1920,
        height: 951,
        href: "https://oncyber.io/6529om?coords=90.32x2.8x-97.37x0.01",
      },
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
