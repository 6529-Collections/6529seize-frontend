import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1GriftersMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/grifters",
  title: "GRIFTERS",
  description:
    "Grifters XCOPY GRIFTER #201 Description “Grifters gonna grift!” is the declaration to encapsulate XCOPY’s Grifter 201, a bright yellow swindler with black orb eyes, pinpointed with yellow irises and wearing hot pink glasses etched with yellow dollar signs....",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Grifters</strong><br>XCOPY </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Grifter-201-600x600.jpg",
        alt: "6529.io",
        width: 600,
        height: 600,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/Grifter-201-600x600.jpg",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>GRIFTER #201</p>"),
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
        "<p>“Grifters gonna grift!” is the declaration to encapsulate XCOPY's Grifter 201, a bright yellow swindler with black orb eyes, pinpointed with yellow irises and wearing hot pink glasses etched with yellow dollar signs. The creature is jubilant with a sparkly helmet upon its head, mouth open wide to show a bright, jolly sun, always sunglass clad and luxurious. Against a black, grainy background, the colors and style embodies punk and retro color schemes, the sparkly headpiece adds a flair of style, the mood is flamboyant and thrilling, capturing the exultrant spirit of a swindler who has successfully swindled. </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
