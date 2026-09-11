import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumAckBarMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/ack-bar",
  title: "ACK BAR",
  description:
    "ACK BAR ACK Bar is a space co-designed with ACK. The 6529 Museum currently has the largest collector of ACK art in the world. VISIT ACK BAR",
  section: "Museum",
  blocks: [
    {
      type: "heading",
      content: "ACK BAR",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>ACK Bar is a space co-designed with ACK. The 6529 Museum currently has the largest collector of ACK art in the world. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://oncyber.io/6529om?coords=106.87x2.8x447.93x-2.55" rel="noopener noreferrer" target="_blank" data-migrated-wordpress-button>VISIT ACK BAR </a></p>'
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/ACK-Bar-Screenshot.jpg",
        alt: "6529.io",
        width: 1920,
        height: 930,
        href: "https://oncyber.io/6529om?coords=106.87x2.8x447.93x-2.55",
      },
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
