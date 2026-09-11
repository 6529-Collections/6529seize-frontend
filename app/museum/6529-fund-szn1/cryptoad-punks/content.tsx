import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1CryptoadPunksMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/cryptoad-punks",
  title: "CRYPTOAD PUNKS",
  description:
    "CrypToad Punks toadleone CRYPTOAD PUNK #2566 Description Randomly generated Toad Punks have “no roadmap. Just vibes. Just Toad Punks.” These simplistic designs offer a cool aesthetic with a variety of traits, such as type and headwear, a variety of eyeglass...",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>CrypToad Punks</strong><br>toadleone </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Toad-Punks-2566.png",
        alt: "6529.io",
        width: 600,
        height: 600,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Toad-Punks-2566.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>CRYPTOAD PUNK #2566 </p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Description <br></strong></p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Randomly generated Toad Punks have “no roadmap. Just vibes. Just Toad Punks.” These simplistic designs offer a cool aesthetic with a variety of traits, such as type and headwear, a variety of eyeglasses and eyeshadows, mohawks, messy hair, stringy hair, etc. Toad Punk 2566 is minty blue with black and teal pixel eyes, two rectangles for nose and mouth, sitting in amphibious leisure against a smoky gray background. This alien type toad is otherworldly due to his sparkly eyes and he wears a silver do-rag on his head. </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
