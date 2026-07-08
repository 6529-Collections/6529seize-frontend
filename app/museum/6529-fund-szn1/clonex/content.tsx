import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1ClonexMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/clonex",
  title: "CLONEX",
  description:
    "Designed by Japanese artist Takashi Murakami in partnership with RTFKT, CloneX presents a population of richly varied avatars with traits drawn from contemporary art and digital identity.",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>CloneX</strong><br>RTFKT x Takashi Murakami </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/CloneX-17307-600x600.png",
        alt: "6529.io",
        width: 600,
        height: 600,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/CloneX-17307-600x600.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>CLONEX #17307</p>"),
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
        "<p>In partnership with RTFKT, designed by Japanese artist Takashi Murakami, the CloneX collection features a population of avatars that have unique features and traits designed by the artist who has an extensive background in contemporary art. Complete with a dazzling array of features and traits, the possibilities for the avatar generation is endless and an entire universe of characters result from the varied process. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>CloneX 17307 features a female figure with human DNA wearing a kitsune helmet. The elegant sleek lines of the fox spirit of Japanese folklore cover her face and give her an otherworldly appearance, red cat-eyes, floral emblem on the forehead and charming pointed ears. Masking all her human features, she almost does not appear human at all except for her cheek and human ear, as well as her ponytail of beautifully braided and detailed purple hair. She wears a VVS stud in her ear, high quality sparkling diamond, and a drip charm lightning bolt necklace around her neck. Her clothes are marvelously detailed, a brilliantly shaded yellow collar against a dark sweater. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>The lovely, careful shading gives full-bodied dimension and realism to the figure, the vivid colors are reminiscent of rich animation, the style and curvature of lines are rich in the anime style. The details give life to this figure and contribute to a storied sense of the figure, placing her within an entire realm of possibility within the scope of myth and magic. </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
