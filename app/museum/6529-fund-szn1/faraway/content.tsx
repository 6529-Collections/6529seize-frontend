import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1FarawayMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/faraway",
  title: "FARAWAY",
  description:
    "Ca Chou's Faraway explores the correlation between humanity, earth, and technology through a bleakly romantic portrait of troubled lovers in a desolate world.",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Faraway</strong><br>Ca Chou </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/NKBc1gR5/faraway.mp4",
        title: "Faraway by Ca Chou",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>FARAWAY</p>"),
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
        "<p>Ca Chou states, “I try to imply the correlation between human, earth and technology through the creation of my own world view.” In Faraway, this correlation is beautifully married in a chillingly bleak and lovely romantic portrait of two troubled lovers. Ca Chou, a Taiwanese artist, uses his unique world view and emotions to create characters that present these observations in a highly storied and cinematic style. The two lovers sit in a white and barren wasteland, framed by skeletal trees, set against a frosty, desolate blue sky. The woman's clothes are supremely detailed, a white, torn jacket over black lace brassiere and bone white pearl necklace. The pattern of her clothing is like exposed muscle after flesh has been torn off, there is a viciousness about the strokes, similar to the torn black jacket of the male. It is as though their ragged and torn clothes have been ripped away to show their bleeding veins and muscles below, colored vibrantly with red, gold, and blue, suggesting that even as their world is bleak, there is brightness and rich life within them. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Their faces are haggard and melancholy as they grasp one another: “This final embrace, this moment, is carved into my heart. Forever.” The post apocalyptic sense is further accentuated by their half human half robot hands, displaying Ca Chou's passion for merging humans and technology against a despairing natural setting. The man smokes with his robot hand and the woman looks ready to collapse, but there is a serenity in this moment of two lovers ravaged and tattered by some unthinkable storm in a grim and devastated world. </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
