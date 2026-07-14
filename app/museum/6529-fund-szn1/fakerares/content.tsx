import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1FakeraresMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/fakerares",
  title: "FAKERARES",
  description:
    "FAKERARES Various Artists FAKAMOTO CARD FAKEWARS BY ACK PEPECYBER BY DANGIUZ",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>FAKERARES</strong><br>Various Artists </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/FAKAMOTO.jpg",
        alt: "6529.io",
        width: 400,
        height: 560,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/FAKAMOTO.jpg",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>FAKAMOTO CARD</p>"),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/FAKEWARS-ACK.gif",
        alt: "6529.io",
        width: 400,
        height: 560,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/FAKEWARS-ACK.gif",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>FAKEWARS BY ACK </p>"),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/CYBER-PEPE-DANGUIZ.jpg",
        alt: "6529.io",
        width: 400,
        height: 560,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/CYBER-PEPE-DANGUIZ.jpg",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>PEPECYBER BY DANGIUZ </p>"),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
