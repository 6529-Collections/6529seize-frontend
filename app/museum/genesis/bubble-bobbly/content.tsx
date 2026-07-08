import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisBubbleBobblyMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/bubble-bobbly",
  title: "BUBBLE BOBBLY",
  description:
    "Bubble Blobby Jason Ting Mint Date: 05/07/2021 Artist Narrative Translucent color bubbles playfully mix and morph to create organic and ephemeral blobby forms. Chameleon is the dominant rare trait in Bubble Blobby - with animated color changes. Token: 47 Ke...",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Bubble Blobby</strong><br>Jason Ting <br>Mint Date: 05/07/2021 </p>"
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
        "<p>Translucent color bubbles playfully mix and morph to create organic and ephemeral blobby forms. </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/pMf3bE7v/s3_bubble_blobby_47.mp4",
        title: "Sorry, your browser doesn't support embedded videos.",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Chameleon is the dominant rare trait in Bubble Blobby – with animated color changes. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 47</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Palette: Silver &amp; Gold <br>Chameleon: Yes <br>Style: Orb </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>33/500 AR <br>33/500 ASR <br>34/500 RG </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/Qg42DIfk/s3_bubble_blobby_240.mp4",
        title: "Sorry, your browser doesn't support embedded videos.",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>240 is an example of a regular (not Chameleon) but with a rare color palette. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 240</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Palette: Golden Gate <br>Style: Breathe <br>Rotation: None </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>74/500 AR <br>87/500 ASR <br>88/500 RG </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/1ct3CGBv/s3_bubble_blobby_180.mp4",
        title: "Sorry, your browser doesn't support embedded videos.",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>180 is a classic standard normal Bubble Blobby. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 180</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits:</strong><br>Palette: Seafoam <br>Style: Scattered <br>Rotation: None </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>322/500 ASR <br>330/500 AR <br>334/500 RG </p>"
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
