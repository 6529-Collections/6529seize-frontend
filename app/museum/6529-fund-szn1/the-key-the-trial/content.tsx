import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1TheKeyTheTrialMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/the-key-the-trial",
  title: "THE KEY - THE TRIAL",
  description:
    "The Key - The Trail k-art THE TRIAL Description An uncanny piece, The Trial by k-art, seeks to present art about life, taking a critical stance and presenting an essential moment of human experience in a visceral and unsettling way. In The Trial, two human...",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>The Key – The Trail</strong><br>k-art </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/The-Trial.gif",
        alt: "6529.io",
        width: 600,
        height: 600,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/The-Trial.gif",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>THE TRIAL</p>"),
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
        "<p>An uncanny piece, The Trial by k-art, seeks to present art about life, taking a critical stance and presenting an essential moment of human experience in a visceral and unsettling way. In The Trial, two human shaped silhouettes, one black, one white, are connected by a thick hot pink pipe. From the brain of the black figure, it connects to the wide open mouth of the white figure and constantly, some kind of swollen object is transferred from the skull of one to the mouth of the other. Meanwhile, a large grey eye with black pupil rattles eerily looking back and forth between the two figures. They are both striking against a blood red and magenta and black background, the brush strokes are violent, the images are ragged with red and black, torn about the neck. The caption reads: “From a certain point onwards there is no longer any turning back. Decision will be made!” This ominous sense of waiting and the characters in a continuous state of petrified limbo creates a foreboding sense of impending doom, enhanced by the moody color scheme and aggressive brush strokes. </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
