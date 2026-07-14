import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisGenesisDcaMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/genesis-dca",
  title: "GENESIS",
  description:
    "Genesis DCA Mint Date: 11/27/2020 Artist Narrative Genesis: Generative System. A block hash string is interpreted into a visual composition using a set of algorithmic rules. Compositions may contain grids, gradients, lines, shapes, and colors that harmonize...",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Genesis</strong><br>DCA <br>Mint Date: 11/27/2020 </p>"
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
      html: migratedWordPressTrustedHtml(
        "<p>Genesis: Generative System. A block hash string is interpreted into a visual composition using a set of algorithmic rules. Compositions may contain grids, gradients, lines, shapes, and colors that harmonize with each other. Each mint is one of a kind and designed to stand-alone. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>6529 Museum Notes</strong><br>Genesis, along with Squiggles and Construction Token, launched on Day 1 of Art Blocks. It is historically important. </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Genesis-20-300x223.png",
        alt: "6529.io",
        width: 300,
        height: 223,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Genesis-20-300x223.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>One of the first 100 tokens minted on Art Blocks and statistically rare. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 20</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Curve: Glowing Bezier <br>Trapezoid: Black <br>Grid: Standard </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>14/512 AR <br>50/512 ASR </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Genesis-283-300x226.png",
        alt: "6529.io",
        width: 300,
        height: 226,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Genesis-283-300x226.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>The faint white sprinkles are the unusual trait in this Genesis. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 283</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Dots: White Sprinkles <br>Trapezoid: Black <br>Triangle1: All </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>79/512 AR <br>113/512 ASR </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Genesis-295-300x224.png",
        alt: "6529.io",
        width: 300,
        height: 224,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Genesis-295-300x224.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>A classic Genesis with a nice background.</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 295</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Grid: Standard <br>Rect1: 1Count <br>Rect2: 3Count </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>430/512 AR <br>434/512 ASR </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>AR: Artacle Rarity | ASR: Artacle Statistical Rarity | RG: Rarity Guide | RS: Rarity Studio </strong></p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
