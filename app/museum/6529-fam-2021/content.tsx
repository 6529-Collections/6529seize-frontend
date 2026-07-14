import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529Fam2021MigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fam-2021",
  title: "6529 FAM 2021",
  description:
    "6529 Fam 2021 is our crowdsourced collection of 6529-themed art. It is all fun.",
  section: "Museum",
  blocks: [
    {
      type: "heading",
      content: "6529 FAM 2021",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>6529 Fam 2021 is our crowdsourced collection of 6529-themed art. It is all fun. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://oncyber.io/6529om?coords=69.65x2.8x-96.75x0.02" rel="noopener noreferrer" target="_blank" data-migrated-wordpress-button>VISIT 6529 FAM 2021 </a></p>'
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/6529-Fam-Screenshot.jpg",
        alt: "6529.io",
        width: 1920,
        height: 960,
        href: "https://oncyber.io/6529om?coords=69.65x2.8x-96.75x0.02",
      },
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
