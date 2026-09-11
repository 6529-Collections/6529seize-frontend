import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisLostRobbiesMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/lost-robbies",
  title: "THE LOST ROBBIES",
  description:
    "The Lost Robbies Robbie Barrat Mint Date: 07/17/2018 6529 Museum Notes Robbie Barrat is the first artist to ever mint on SuperRare. Barrat explores a variety of domains through machine learning and GANs (generative adversarial networks), and uses neural net...",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>The Lost Robbies</strong><br>Robbie Barrat <br>Mint Date: 07/17/2018 </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>6529 Museum Notes <br></strong></p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Robbie Barrat is the first artist to ever mint on SuperRare. Barrat explores a variety of domains through machine learning and GANs (generative adversarial networks), and uses neural networks to “correct” existing paintings and adjust them to more align with the machine's understanding of what the work looks like. (This is a different, though not completely unrelated, use of the word “generative”). </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Robbie's last mint was in August 2020 and he has sworn off NFTs due to environment concerns. In 2018 Christie's held their annual Art and Tech Summit and invited SuperRare to add a gift to the gift bags of the 300+ attendees. SuperRare enlisted Robbie Barrat to create “AI Generated Nude Portrait #7” with 300 individual frames that could each be tokenized and given away to the attendees via gift cards placed in their gift bags. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Not understanding their historical significance, most attendees threw out their cards and did not claim their NFTs – hence the new name that emerged for these NFTs – “The Lost Robbies” (or TLRs for short). 38 TLRs have been claimed so far and it is believe that there are another 5-10 unscratched (and not lost) TLRs. The TLRs have been imbued with huge emotional value by the NFT collecting community due to the symbolism of “TradArt” rejecting NFTs initially. </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/the-lost-robbies-193-300x300.png",
        alt: "6529.io",
        width: 300,
        height: 300,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/the-lost-robbies-193-300x300.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Frame 96 of 300.</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 193</p>"),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/the-lost-robbies-96-298x300.png",
        alt: "6529.io",
        width: 298,
        height: 300,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/the-lost-robbies-96-298x300.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Frame 193 of 300.</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 96</p>"),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
