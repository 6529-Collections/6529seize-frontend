import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumSunshineSquareMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/sunshine-square",
  title: "SUNSHINE SQUARE",
  description:
    "SUNSHINE SQUARE Sunshine Square is our ode to summer.jpg and sunshine (its star and our hero). VISIT SUNSHINE SQUARE",
  section: "Museum",
  blocks: [
    {
      type: "heading",
      content: "SUNSHINE SQUARE",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Sunshine Square is our ode to summer.jpg and sunshine (its star and our hero). </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://oncyber.io/6529om?coords=-0.99x2.8x-181.98x-0.13" rel="noopener noreferrer" target="_blank" data-migrated-wordpress-button>VISIT SUNSHINE SQUARE </a></p>'
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Sunshine-Square-Screenshot.jpg",
        alt: "6529.io",
        width: 1920,
        height: 901,
        href: "https://oncyber.io/6529om?coords=-0.99x2.8x-181.98x-0.13",
      },
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
