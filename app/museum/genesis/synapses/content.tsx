import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisSynapsesMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/synapses",
  title: "SYNAPSES",
  description:
    "Synapses Chaosconstruct Mint Date: 04/05/2021 Artist Narrative Synapses is a generative study on movement and texture. Thousands of particles flow in space leaving a trail of their journey. the movements are inspired by swarm behavior and flocking mechanism...",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Synapses</strong><br>Chaosconstruct <br>Mint Date: 04/05/2021 </p>"
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
        "<p>Synapses is a generative study on movement and texture. Thousands of particles flow in space leaving a trail of their journey. the movements are inspired by swarm behavior and flocking mechanism. The trails when left by each particle resembles the graphite or carbon smudges on the white canvas. The particles follow either single or multiple vectors to create these intricate details. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><b>6529 Museum Notes <br></b>Synapses are very pleasing and would look great, large, maybe in a club or theater. The 6529 Museum collection includes 2 of the 29 rare dark Synapses. </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/l9qTvMn8/s3_synapses_153.mp4",
        title: "SYNAPSES artwork video 1",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>#3 rarity across the collection of 700 Synapses. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 153</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Background: Dark <br>Orientation: The Spread <br>Origin: Center </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>3/700 RG <br>3/700 ASR <br>4/700 AR </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/elCRWChF/s3_synapses_504.mp4",
        title: "SYNAPSES artwork video 2",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>An aesthetically pleasing symmetrical pattern emanating from the centre. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 504</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Background: Dark <br>Orientation: The Spread <br>Origin: Center </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>3/700 AR <br>14/700 RG <br>14/700 ASR </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/bAa15lfK/s3_synapses_600.mp4",
        title: "SYNAPSES artwork video 3",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Black art on a light background like smoke dispersing in the wind. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 600</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Orientation: Free <br>Origin: Center <br>Background: Light </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>501/700 ASR <br>501/700 AR <br>601/700 RG </p>"
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
