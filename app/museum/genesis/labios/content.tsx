import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisLabiosMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/labios",
  title: "LABIOS",
  description:
    "Labios Manoloide Mint Date: 09/13/2021 Artist Narrative Manolo Gamboa Naon is an Argentinean visual artist and creative coder whose interest focuses mainly on exploring generative visual aesthetics based on plastic experimentation with code. His works explo...",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "heading",
      content: "Labios Manoloide Mint Date: 09/13/2021",
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
        "<p>Manolo Gamboa Naon is an Argentinean visual artist and creative coder whose interest focuses mainly on exploring generative visual aesthetics based on plastic experimentation with code. His works explore the potential of programming as an expressive language in the framework of generativity and process art. Combining images and video, he explores the possible relationships between chaos and order, organic and artificial, randomness and control. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><b>6529 Museum Notes <br></b>Manolo is a legendary figure in the generative art community, who has minted some of his top generative outputs as 1of1 NFTs. There is a broad range of output types in Manolo's work and we are happy to be able to have collected Labios for the 6529 Museum. </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/labios-298x300.png",
        alt: "6529.io",
        width: 298,
        height: 300,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/labios-298x300.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 28386</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>1/1 </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
