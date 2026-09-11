import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumSozetLoungeMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/sozet-lounge",
  title: "SOZET LOUNGE",
  description:
    "SOZET LOUNGE Sozet Lounge contains the Tezos art collected by the 6529 Museum. It is an experimental collection, but it is interesting and fun. VISIT SOZET LOUNGE",
  section: "Museum",
  blocks: [
    {
      type: "heading",
      content: "SOZET LOUNGE",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Sozet Lounge contains the Tezos art collected by the 6529 Museum. It is an experimental collection, but it is interesting and fun. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://oncyber.io/6529om?coords=116.56x2.8x-5.36x-1.59" rel="noopener noreferrer" target="_blank" data-migrated-wordpress-button>VISIT SOZET LOUNGE </a></p>'
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Sozet-Lounge-Screenshot.jpg",
        alt: "6529.io",
        width: 1920,
        height: 949,
        href: "https://oncyber.io/6529om?coords=116.56x2.8x-5.36x-1.59",
      },
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
