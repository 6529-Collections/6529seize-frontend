import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisAutoglyphsMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/autoglyphs",
  title: "AUTOGLYPHS",
  description:
    "Autoglyphs Larva Labs Mint Date: 04/08/2019 Artist Narrative Autoglyphs are the first “on-chain” generative art on the Ethereum blockchain. They are a completely self-contained mechanism for the creation and ownership of an artwork. Autoglyphs are an experi...",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Autoglyphs</strong><br>Larva Labs <br>Mint Date: 04/08/2019 </p>"
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
        "<p>Autoglyphs are the first “on-chain” generative art on the Ethereum blockchain. They are a completely self-contained mechanism for the creation and ownership of an artwork. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Autoglyphs are an experiment in generative art, each one unique and created by code running on the Ethereum blockchain. The glyphs were originally created in 2019 by anyone who was willing to donate the creation fee of 0.2Ξ (around $35 at the time) to our chosen charity, 350.org. The creator of each glyph became the first owner of that glyph. After 512 glyphs were created, the generator shut itself off forever and the glyphs are only be available on the secondary market. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>The Autoglyphs are a highly optimized generative algorithm capable of creating billions of unique artworks, wrapped inside an ERC-721 interface. While ERC-721 is the standard for “non-fungible tokens” (something that the CryptoPunks helped define), it is generally used to manage ownership of digital items stored elsewhere. The key difference with the Autoglyphs is that the art is inside the contract itself, it is literally “art on the blockchain.” </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>This becomes obvious if you examine any glyph creation transaction on the blockchain. The event data contains the full output of the generator, and hence the artwork itself. The actual code to generate the Autoglyphs is tiny and optimized to run efficiently on Ethereum nodes. </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/508.png",
        alt: "6529.io",
        width: 1200,
        height: 1200,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/508.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Autoglyphs are the first “on-chain” generative art on the Ethereum blockchain. A completely self-contained mechanism for the creation and ownership of an artwork. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 508</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits:</strong><br>Symbol Scheme (21) </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity:</strong><br>1/512 </p>"
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
