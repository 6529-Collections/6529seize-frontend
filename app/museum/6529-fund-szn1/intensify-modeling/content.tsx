import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1IntensifyModelingMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/intensify-modeling",
  title: "INTENSIFY MODELING",
  description:
    "Intensify Modeling Botto Project Intensify Modeling Description This piece from Botto, a decentralized artist that generates art inspired by the community’s votes, hides a half human half beast within its vibrant coils. The color and texture is decadent and...",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Intensify Modeling</strong><br>Botto Project </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/IntensifyModeling.jpeg",
        alt: "6529.io",
        width: 2048,
        height: 2048,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/IntensifyModeling.jpeg",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Intensify Modeling </p>"),
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
        "<p>This piece from Botto, a decentralized artist that generates art inspired by the community's votes, hides a half human half beast within its vibrant coils. The color and texture is decadent and reminiscent of a Venetian mask, ivory, gold, burgundy swirl together with dark shadows of emerald and black. The texture appears to swirl to the center where a mysterious face can be seen, just the bit of an eye, half-closed, a sharp nose, and then a pouting red mouth against an alabaster face. Gold and berry swirls take the place of hair and rise like plumes ruffled by the wind, forming a sumptuous mane. The gold lines mirror the pattern of smoke rising from a candle into the surrounding darkness, creating a mysterious and haunting beauty. </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
