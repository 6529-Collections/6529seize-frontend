import type { MigratedWordPressArticleContent } from "@/components/migrated-wordpress/types";

export const newsIntroducingOmMigratedWordPressArticle = {
  source: "migrated-wordpress",
  path: "/news/introducing-om",
  title: "INTRODUCING OM",
  description:
    "This is the launch date of the alpha version of the first district of OM. The goal of OM is to build a fully decentralized metaverse that bridges the virtual and physical world.",
  section: "News",
  author: {
    href: "/author/6529er6529-io",
    label: "6529er",
  },
  publishedAt: "2022-04-14T17:26:36+00:00",
  modifiedAt: "2022-04-14T21:42:14+00:00",
  heroImage: {
    src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Artboard-1-80.jpg",
    alt: "INTRODUCING OM",
    width: 1920,
    height: 1080,
  },
  blocks: [
    {
      type: "html",
      html: "<p>This is the launch date of the alpha version of the first district of OM.&nbsp; The goal of OM is to build a fully decentralized metaverse that bridges the virtual and physical world.</p>",
    },
    {
      type: "html",
      html: "<p>For more information about the OM Alpha Version:</p>",
    },
    {
      type: "html",
      html: '<ul><li><a href="/om">/om/</a></li><li><a href="https://twitter.com/punk6529/status/1514718020849000461?s=20&amp;t=FcY1DpnPXyPPRE36USkjmQ" rel="noopener noreferrer" target="_blank">OM tweetstorm</a></li></ul>',
    },
    {
      type: "html",
      html: '<p>To visit the first district in OM, go here:<br><a href="https://oncyber.io/6529om" rel="noopener noreferrer" target="_blank">https://oncyber.io/6529om</a></p>',
    },
  ],
} satisfies MigratedWordPressArticleContent;
