import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumBatsoupyumMuseum2MigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/batsoupyum-museum-2",
  title: "BATSOUPLOUNGE",
  description:
    "BATSOUPLOUNGE Batsoupyum Museum is the personal collection of BatSoupYum. It is a superb collection in a broad set of genres, with a focus on early 1 of 1 art. VISIT BATSOUPLOUNGE",
  section: "Museum",
  blocks: [
    {
      type: "heading",
      content: "BATSOUPLOUNGE",
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
        '<p><a href="https://oncyber.io/6529om?coords=-120.46x2.8x320.42x1.39" rel="noopener noreferrer" target="_blank" data-migrated-wordpress-button>VISIT BATSOUPLOUNGE </a></p>'
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/BSY-Museum-2-Screenshot.jpg",
        alt: "6529.io",
        width: 1300,
        height: 642,
        href: "https://oncyber.io/6529om?coords=-120.46x2.8x320.42x1.39",
      },
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
