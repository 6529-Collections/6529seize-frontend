import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisTheBlocksOfArtMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/the-blocks-of-art",
  title: "THE BLOCKS OF ART",
  description:
    "The Blocks of Art Shvembldr Mint Date: 05/28/2021 Artist Narrative This project is dedicated to Art Blocks. Each panel on the block is a small generative art piece with several random parameters that lives its own life, at the same time being part of the co...",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>The Blocks of Art</strong><br>Shvembldr <br>Mint Date: 05/28/2021 </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Artist Narrative <br></strong></p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/VkhiSBko/s3_blocks_of_art_8.mp4",
        title: "Sorry, your browser doesn't support embedded videos.",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>A statistically rare Blocks of Art, due to layout and palette. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 8</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>windows: 9<br>centrifuge: 6<br>cross: 0 </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>12/500 AR <br>17/500 ASR <br>115/500 RG </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/ONOYXWbP/s3_blocks_of_art_280.mp4",
        title: "Sorry, your browser doesn't support embedded videos.",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>A classic Blocks of Art in our favorite palette. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 280</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>pendulum: 6<br>rain: 6<br>brick: 5 </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>181/500 RG <br>285/500 ASR <br>370/500 AR </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/cEg17hoB/s3_blocks_of_art_109.mp4",
        title: "Sorry, your browser doesn't support embedded videos.",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>A classic Blocks of Art in a common palette.</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 109</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>mesmerizer: 5<br>letter: B<br>bouncy: 1 </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>424/500 RG <br>425/500 AS <br>253/500 AR </p>"
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
