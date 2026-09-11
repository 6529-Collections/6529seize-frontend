import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisCryptoarteMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/cryptoarte",
  title: "CRYPTOARTE",
  description:
    "Cryptoarte Sebastián Brocher Mint Date: 07/13/2018 Artist Narrative Cryptoarte pre-dates Autoglyphs as possibly the first large generative collection minted as NFTs. Autoglyphs are the first generative art collection minted *on-chain* (with the code to draw...",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><b>Cryptoarte</b><br>Sebastián Brocher <br>Mint Date: 07/13/2018 </p>"
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
        "<p>Cryptoarte pre-dates Autoglyphs as possibly the first large generative collection minted as NFTs. Autoglyphs are the first generative art collection minted *on-chain* (with the code to draw the art embedded in the blockchain). The Cryptoarte collection started minting on July 13th 2018 with Painting #400 and then was rediscovered in JPEG Summer of 2021 when it finally minted out. Cryptoarte rarity is determined by the date it was first minted with the most prized by collectors being those minted before April 6th 2019 (pre-Autoglyph mints). </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>One of the most sought after rarity traits within each Cryptoarte are artworks that include the signature of one block miners or two block miners. The 6529 Museum #1963 contains both a one block and two block miner and is a pre-Autoglyph minted on October 18th 2018. In contrast to Autoglyphs, Cryptoarte is a large collection size at 9,895 unique, single edition paintings making each artwork quite common and accessible. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Rarer examples can be discovered within the collection through the technical traits noted by the artist. Rarity #8521 is one of 1,220 artworks with a prime number and also displays the rarer pink hued Cryptoarte palette. #9067 is also a prime numbered artwork and a good example of the variability in the collections color palette. </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/cryptoarte-1963-300x167.png",
        alt: "6529.io",
        width: 300,
        height: 167,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/cryptoarte-1963-300x167.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Generative art mined before Autoglyphs. Find the golden miner in the 235th block. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 1963</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><b>Key Traits: <br></b>Mint Date: 10/30/2018 <br>One Block Miner: 1<br>Two Block Minter: 1 </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><b>Rarity: <br></b>Mint Order Number: 340 <br>Miners Rarity: 61.16% </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/cryptoarte-8521-300x171.png",
        alt: "6529.io",
        width: 300,
        height: 171,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/cryptoarte-8521-300x171.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Pink color palettes and Prime paintings are rare in CryptoArte. Minted in ‘JPEG Summer' of 2021. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 8521</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Prime Painting: Yes (1220) <br>Mint Date: 08/09/2021 </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>Mint Order Number: 8778 <br>Miners Rarity: 37.38% </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/cryptoarte-9067-300x168.png",
        alt: "6529.io",
        width: 300,
        height: 168,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/cryptoarte-9067-300x168.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Look closer at the unique miner signatures inside each block in this yellow palette example. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 9067</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><b>Key Traits: <br></b>Prime Painting: Yes (1220) <br>Mint Date: 08/10/2021 </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><b>Rarity: <br></b>Mint Order Number: 9317 <br>Miners Rarity: 37.24% </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
