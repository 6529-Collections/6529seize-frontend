import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1InvisibleFriendsMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/invisible-friends",
  title: "INVISIBLE FRIENDS",
  description:
    "Invisible Friends Markus Magnusson INVISIBLE FRIEND #2326 Description “Nice to Unsee You.” Such is the slogan for these cheerfully animated invisible characters, 5000 of which hide in the metaverse and stroll along in an infinite loop of jovial animation. D...",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Invisible Friends</strong><br>Markus Magnusson </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Invisible-Friend-2326.gif",
        alt: "6529.io",
        width: 600,
        height: 600,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Invisible-Friend-2326.gif",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>INVISIBLE FRIEND #2326 </p>"),
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
        "<p>“Nice to Unsee You.” Such is the slogan for these cheerfully animated invisible characters, 5000 of which hide in the metaverse and stroll along in an infinite loop of jovial animation. Drawn by Swedish artist Markus Magnusson, the characters feature an eclectic batch of traits that bring life to their stroll. Invisible Friends 2326 wears a tan baseball hat, a black chest bag, gray sweatpants, long sleeve blue boodie over sparkling diamond hands. He wears VR goggles that are accomplished with some moving graph of virtual reality motion, and his steps are in tune with the silent song that emerges from headphones that are producing an endless stream of musical notes to create the sense of rhythm to which the figure walks. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>His summer day sneakers are reminiscent of 90s cartoons, white and pale green, dark green with pink tongue. He walks against a blue background, as fresh and clear as a bright summer day, his hoodie moves, his hands sparkle, his music streams, his goggles are constantly toggling red and green bars. The character is full of life, vibrant, though silent, all of the visual cues stir the imagination to hear the music and the taps of his feet as they make their endless march. It can almost be forgotten that he has no face, as the rest of his details work perfectly to create an animated and engaging character. </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
