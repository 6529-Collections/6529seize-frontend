import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisCryptocubeMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/cryptocube",
  title: "CRYPTOCUBE",
  description:
    "Cryptocube Han Mint Date: 12/03/2020 Artist Narrative 256 Virtual Landmarks. CryptoCubes started with thoughts about 3D virtual spaces and the article I wrote when I first started creating them 2+ year ago. Like other collectible projects, cubes also have c...",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "heading",
      content: "Cryptocube Han Mint Date: 12/03/2020",
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
        "<p>256 Virtual Landmarks. CryptoCubes started with thoughts about 3D virtual spaces and the article I wrote when I first started creating them 2+ year ago. Like other collectible projects, cubes also have certain properties +Color +Volume +Shape. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>However, it is not limited to just a collectible project. The final CryptoCube representation is a static gif. Only 256 CryptoCubes will exist in 3D metaverses. When a person owns a CryptoCube, they do not just get the static gif. They also get several other files such as 3D files to use in 3D lands. CryptoCubes have also different 2D visuals which are only available for it's owners. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>With the NFTs, we took an interest in CryptoPunks for the avatars and each avatar has became our “identity”, we took an interest in ArtBlocks for the generative art and each piece has became our “taste”, we took an interest in CryptoArt, each creation has became our “symbol”. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>3D Metaverses are providing us faster and more efficient opportunities to think creatively. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Liquid identities, easily customizable places, virtual meeting points and so on. When we compare our virtual worlds to real life, CryptoCubes may have the potential to be a symbolic landmark building/statue for DAOs, Museums, Dapps, Decentralized Companies in 3D Lands. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><b>6529 Museum Notes <br></b>Crytocubes are believed to be one of the first 3D generative NFT collection and are great fun in 3D. </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/cryptocube-298x300.png",
        alt: "6529.io",
        width: 298,
        height: 300,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/cryptocube-298x300.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 118</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p><strong>Key Traits:</strong></p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Color: Mixed (143) <br>Shape: P (23) <br>Volume: Tiny (58) </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p><strong>Rarity:</strong></p>"),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
