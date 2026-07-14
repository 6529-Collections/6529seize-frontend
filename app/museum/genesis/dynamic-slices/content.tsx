import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisDynamicSlicesMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/dynamic-slices",
  title: "DYNAMIC SLICES",
  description:
    "Dynamic Slices pxlq Mint Date: 12/12/2020 Artist Narrative Text 6529 Museum Notes Text For your own interpretation. Token: Key Traits: Rarity: For your own interpretation. Token: Key Traits: Rarity: AR: Artacle Rarity | ASR: Artacle Statistical Rarity | RG:...",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Dynamic Slices</strong><br>pxlq <br>Mint Date: 12/12/2020 </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Artist Narrative <br></strong></p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Text</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>6529 Museum Notes</strong><br>Text </p>"
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
      html: migratedWordPressTrustedHtml("<p>For your own interpretation.</p>"),
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
      html: migratedWordPressTrustedHtml("<p>For your own interpretation.</p>"),
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
