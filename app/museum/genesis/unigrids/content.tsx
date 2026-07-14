import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisUnigridsMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/unigrids",
  title: "UNIGRIDS",
  description:
    "Unigrids Zeblocks Mint Date: 01/26/2021 Artist Narrative Unigrids are collectible digital art pieces 100% stored on the Ethereum blockchain. Each Unigrid consists of 421 individual Pure Javascript generated SVG grids, ensuring each Unigrid is entirely uniqu...",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Unigrids</strong><br>Zeblocks <br>Mint Date: 01/26/2021 </p>"
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
        "<p>Unigrids are collectible digital art pieces 100% stored on the Ethereum blockchain. Each Unigrid consists of 421 individual Pure Javascript generated SVG grids, ensuring each Unigrid is entirely unique. Not only are Unigrids visually unique, but they also hide an ingenious animation and a generated beat to enhance your experience. Unigrids are an experiential piece of art, with a static image for printing, an animation, and companion beat – all generated and stored on the blockchain. You truly need to play around with Unigrids to understand the essence of them. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>6529 Museum Notes</strong><br>Unigrids are an early hybrid generative NFT, combining animation and a beat. They are one of our early ABC favorites. </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/d5BWzYqB/s2_unigrids_285.mp4",
        title: "UNIGRIDS artwork video 1",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>#285 is an ultra-rare, ultra-minimalistic Unigrid, acquired directly from the artist Zeblocks for great provenance. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 285</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Shape: Angled (30) <br># of colors: 2 (36) <br>Palette: Labradorite (39) </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>3/421 AR <br>8/421 ASR <br>8/421 RG </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/ZoANQyFC/s2_unigrids_7.mp4",
        title: "UNIGRIDS artwork video 2",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Pop-art pastel colors in the rarest palette (CYMK) are the defining feature of #7. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 7</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Palette: CMYK (11) <br>Beat: Beat1 (52) <br># of colors: 3 (93) </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>58/421 RG <br>88/421 ASR <br>88/421 RG </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/MnhImFIt/s2_unigrids_131.mp4",
        title: "UNIGRIDS artwork video 3",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>#131 is a classic representative Unigrid.</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 131</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Palette: Ocean Jasper (33) <br>Beat: Beat1 (52) <br>Shape: Angled-up (78) </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>208/421 ASR <br>209/421 RG <br>223/421 AR </p>"
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
