import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumBatsoupyumMuseum1MigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/batsoupyum-museum-1",
  title: "BATSOUPCAVE",
  description:
    "BATSOUPCAVE Batsoupyum Museum is the personal collection of BatSoupYum. It is a superb collection in a broad set of genres, with a focus on early 1 of 1 art. VISIT BATSOUPCAVE",
  section: "Museum",
  blocks: [
    {
      type: "heading",
      content: "BATSOUPCAVE",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Batsoupyum Museum is the personal collection of BatSoupYum. It is a superb collection in a broad set of genres, with a focus on early 1 of 1 art. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://oncyber.io/6529om?coords=-122.69x2.8x330.00x1.33" rel="noopener noreferrer" target="_blank" data-migrated-wordpress-button>VISIT BATSOUPCAVE </a></p>'
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/BSY-Museum-1-Screenshot.jpg",
        alt: "6529.io",
        width: 1300,
        height: 644,
        href: "https://oncyber.io/6529om?coords=-122.69x2.8x330.00x1.33",
      },
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
