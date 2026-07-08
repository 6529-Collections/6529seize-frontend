import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisWatercolorDreamsMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/watercolor-dreams",
  title: "WATERCOLOR DREAMS",
  description:
    "Watercolor Dreams NumbersInMotion Mint Date: 04/30/21 Artist Narrative Watercolor Dreams is an exploration in simulation, a meditation on traditional techniques in watercolor, and an ode to serendipity. Where will this curve end? When will this shade fade?...",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Watercolor Dreams</strong><br>NumbersInMotion <br>Mint Date: 04/30/21 </p>"
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
        "<p>Watercolor Dreams is an exploration in simulation, a meditation on traditional techniques in watercolor, and an ode to serendipity. Where will this curve end? When will this shade fade? How will the movement come alive? Sit back, relax, and watch the colors wash over the canvas. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>6529 Museum Notes</strong><br>Watercolor Dreams are melodic and calming. </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/EieDu2iw/s3_watercolor_dreams_171.mp4",
        title: "Sorry, your browser doesn't support embedded videos.",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>171 is one of the five rarest Watercolor Dreams with the isWavey trait. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 171</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>isWavey: TRUE <br>angleAmplitude: 20 <br>palette: puzzling </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>5/600 RG <br>1/600 AR <br>3/600 RS </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/SUuf1pA4/s3_watercolor_dreams_538.mp4",
        title: "Sorry, your browser doesn't support embedded videos.",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Dark bluish and purplish colors move around in a ghostly fashion. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 538</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>palette: lustful <br>composition: corner x<br>angleAmplitude: 50 </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>355/600 RG <br>396/600 AR <br>336/600 RS </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/lrjXRG0i/s3_watercolor_dreams_64.mp4",
        title: "Sorry, your browser doesn't support embedded videos.",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Purple &amp; pink hues make up the look of this distrinctive output. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 64</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>palette: stimulated <br>composition: x<br>angleAmplitude: 25 </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>428/600 RG <br>441/600 AR <br>418/600 RS </p>"
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
