import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1MadhouseMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/madhouse",
  title: "MADHOUSE",
  description:
    "MADHOUSE k-art MAD 037 MAD 040 Description K-art creates diseased criminals in his Madhouse collection. Featuring a broad array of diseases: anxiety, bipolar disorder, hysteria, schizophrenia, depression, insomnia, multiple personality, and psycho. The char...",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>MADHOUSE</strong><br>k-art </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Mad-037.gif",
        alt: "6529.io",
        width: 600,
        height: 600,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Mad-037.gif",
      },
    },
    {
      type: "heading",
      content: "MAD 037",
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Mad-040.gif",
        alt: "6529.io",
        width: 600,
        height: 600,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Mad-040.gif",
      },
    },
    {
      type: "heading",
      content: "MAD 040",
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
        "<p>K-art creates diseased criminals in his Madhouse collection. Featuring a broad array of diseases: anxiety, bipolar disorder, hysteria, schizophrenia, depression, insomnia, multiple personality, and psycho. The characters are either fugitives or inside prison, and some have a guilty verdict. Reminiscent of the figures from The Trial, Mad 037 boasts a giant, fanged tooth grin, a single red eye in the center of his face, and wears a dancing crown. He has obsessive-compulsive disorder, which is expressed through the neat lines of his lashes that fan out horizontally from the central red eye. He is still inside prison, but he does not have a guilty verdict, like Mad 040, who is a fugitive psycho. He has an entirely different look and style, with razor sharp blood tinged fangs, a bandage covering his eyes, chains around his neck, an unusual design along his purple glowing body. His background is slashed with rain, perhaps as he runs through a storm in his fugitive state, to a blood smeared backdrop. Where Mad 037 has clean brushstrokes of red, magenta, and yellow, Mad 040 conjures a state of mental frenzy with the spastic movement of the storm behind him and his general state of dishevelment. </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
