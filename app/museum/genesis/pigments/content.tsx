import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisPigmentsMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/pigments",
  title: "PIGMENTS",
  description:
    "Pigments Darien Brito Mint Date: 08/23/2021 Artist Narrative Pigments is an exploration of color and spatial distortion. Each instance is an abstract representation aimed at evoking a micro or macro-environment; from unknown substances, or oil in a canvas,...",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Pigments</strong><br>Darien Brito <br>Mint Date: 08/23/2021 </p>"
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
        "<p>Pigments is an exploration of color and spatial distortion. Each instance is an abstract representation aimed at evoking a micro or macro-environment; from unknown substances, or oil in a canvas, to nebular formations. The pieces are animated, meant to be experienced live. If this proves to be too computationally intensive, or if you prefer a static view, feel free to press the spacebar. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><b>6529 Museum Notes <br></b>Pigments is an exceptionally attractive generative collection, generally mesmerizing to watch. </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Pigments-207-250x300.png",
        alt: "6529.io",
        width: 250,
        height: 300,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Pigments-207-250x300.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>The ‘Elico' color palette creates the mystical blues, greens and reds in this output. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 207</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Vortex: Soft <br>Palette: Elico <br>Vortex direction: Right </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>12/1024 RG <br>12/1024 ASR <br>25/1024 AR </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Pigments-46-250x300.png",
        alt: "6529.io",
        width: 250,
        height: 300,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Pigments-46-250x300.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>The ‘Tormenta' color palette, mixed with the ‘Cells' layout trait, creates a stormy feel. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 46</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Palette: Tormenta <br>Layout: Cells <br>Vortex: None </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>187/1024 RG <br>187/1024 ASR <br>205/1024 AR </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Pigments-880-250x300.png",
        alt: "6529.io",
        width: 250,
        height: 300,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Pigments-880-250x300.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>A dark, moody atmosphere from the ‘Tempesta' and ‘Cellophane' traits. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 880</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Palette: Tempesta <br>Layout: Cellophane <br>Vortex: None </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>454/1024 AR <br>554/1024 ASR <br>557/1024 AR </p>"
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
