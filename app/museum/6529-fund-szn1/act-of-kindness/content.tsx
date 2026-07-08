import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1ActOfKindnessMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/act-of-kindness",
  title: "ACT OF KINDNESS",
  description:
    "Act of Kindness Dangiuz Act of Kindness Description Dangiuz, an Italian digital artist, marries the styles of Van Gogh post impressionism and cyberpunk scenes in his resplendent and evocative pieces. Act of Kindness features a lone figure kneeling to pet a...",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Act of Kindness</strong><br>Dangiuz </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Act-of-Kindness-1200x1500.jpg",
        alt: "6529.io",
        width: 1200,
        height: 1500,
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Act of Kindness </p>"),
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
        "<p>Dangiuz, an Italian digital artist, marries the styles of Van Gogh post impressionism and cyberpunk scenes in his resplendent and evocative pieces. Act of Kindness features a lone figure kneeling to pet a stray cat: “You'll come home with me and you'll sleep next to me tonight. And tomorrow. And forever.” They stand on a damp alley street that reflects the bright, beautiful cityscape behind them, catching the sparkle of rainfall, alive with turquoise, pink, purple, yellow. The impressionistic style of the cityscape makes one feel as if they are experiencing a wondrous night blindness and witnessing the city through fog and mist, all of the lights exploding in distorted haloes. The ghostly city lights reveal a woman's face fanning herself, a neon purple fish floating, a faded tiger approaching. Wild nature is juxtaposed with power lines and a bridge featuring tiny people in the distance. The city seems populated and bustling, but strange, too as nature runs amok in the city scape, fish floating in the sky, a tiger caught in the power lines. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>While nature and civilization seem at chaotic odds in the cityscape, man and animal come together in harmony in the foreground, brought together by their loneliness and striking a powerful silhouette against the city glow. </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
