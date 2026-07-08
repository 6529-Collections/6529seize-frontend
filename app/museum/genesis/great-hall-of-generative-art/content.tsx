import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisGreatHallOfGenerativeArtMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/great-hall-of-generative-art",
  title: "GREAT HALL OF GENERATIVE ART",
  description:
    "6529 Museum Great Hall Various Artists Collection Description The 6529 Museum Great Hall is focused on independent collections by generative artists. It is a work in progress with room to expand as we collect from more artists and collections. Some of the a...",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>6529 Museum Great Hall</strong><br>Various Artists </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Collection Description <br></strong></p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>The 6529 Museum Great Hall is focused on independent collections by generative artists. It is a work in progress with room to expand as we collect from more artists and collections. Some of the artist work curated to date include Sturec, Ezra Millar, Monica Rizzolli, Boncuk, Kristy Glas, Arise, Case REAS and ge1doot. In time, the curational direction of the Great Hall will emerge more clearly. </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2021/12/6529-Gradient-40.png",
        alt: "6529 Gradient #40",
        width: 2400,
        height: 2400,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2021/12/6529-Gradient-40.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Artwork description…</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token:</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p><strong>Key Traits:</strong></p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p><strong>Rarity:</strong></p>"),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2021/12/6529-Gradient-40.png",
        alt: "6529 Gradient #40",
        width: 2400,
        height: 2400,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2021/12/6529-Gradient-40.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Artwork description…</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token:</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p><strong>Key Traits:</strong></p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p><strong>Rarity:</strong></p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>AR: Artacle Rarity | ASR: Artacle Statistical Rarity | RG: Rarity Guide | RS: Rarity Studio </strong></p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
