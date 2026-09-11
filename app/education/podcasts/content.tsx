import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const educationPodcastsMigratedWordPressPage: MigratedWordPressStaticPageContent =
  {
    source: "migrated-wordpress",
    path: "/education/podcasts",
    title: "PODCASTS",
    description: "Punk6529 joins Consensus 2022 in Austin, Texas.",
    section: "Education",
    blocks: [
      {
        type: "heading",
        content:
          "THE PSEUDONYMOUS PHILOSOPHER: PUNK 6529'S VISION FOR OUR DECENTRALIZED FUTURE",
      },
      {
        type: "html",
        html: migratedWordPressTrustedHtml(
          "<p>Punk6529 joins Consensus 2022 in Austin, Texas.</p>"
        ),
      },
      {
        type: "html",
        html: migratedWordPressTrustedHtml(
          "<p>Moderator:<br>Michael Casey<br>CoinDesk Chief Content Officer</p>"
        ),
      },
      {
        type: "html",
        html: migratedWordPressTrustedHtml(
          '<p>12 Jun 2022 | <a href="https://www.coindesk.com/tv/special-coverage/pseudonymous-philosopher-livestream/" rel="noopener noreferrer" target="_blank">Coindesk</a></p>'
        ),
      },
      {
        type: "heading",
        content: "THE WORLD ACCORDING TO PUNK 6529",
      },
      {
        type: "html",
        html: migratedWordPressTrustedHtml(
          "<p>This is without question the Real Vision interview of the year, and it'll go down in history as an all-time RV classic. I kid you not! My conversation with Punk 6529, a leading thinker and investor in the NFT space, is enjoyable, immersive, informative, fascinating, and extremely important. It will blow your hair off and make your brain melt. I'm going to have to rewatch it a few times to take it all in. I suggest you settle in with a big glass of Rioja or a nice cup of tea and tune into the mind of this very unique punk. Recorded on March 31, 2022.</p>"
        ),
      },
      {
        type: "html",
        html: migratedWordPressTrustedHtml(
          "<p>Requires free email registration (not payment)</p>"
        ),
      },
      {
        type: "html",
        html: migratedWordPressTrustedHtml(
          '<p>8 Apr 2022 | <a href="https://www.realvision.com/shows/raoul-pal-adventures-in-crypto/videos/the-world-according-to-punk-6529-mXg5?utm_campaign=Standard&amp;utm_medium=email&amp;_hsmi=209440565&amp;_hsenc=p2ANqtz--g9VR4uR4r_gYXUHzs_nQ_HtjcBwauwvn9JpB0mcMcjnP7pTKcphSHpClkDikSztXMi6N7_1n11iVTODrpvFNuVz26qg&amp;utm_source=202248_alert_weekly_members_crypto_1_Standard" rel="noopener noreferrer" target="_blank">RealVision.com</a></p>'
        ),
      },
      {
        type: "heading",
        content:
          "PUNK6529 ON THE SIGNIFICANCE OF BORED APE YACHT CLUB AND CRYPTOPUNKS",
      },
      {
        type: "html",
        html: migratedWordPressTrustedHtml(
          "<p>In his first podcast appearance ever, Punk6529, known for writing massive threads on Crypto Twitter, discusses the cultural and historical significance of Bored Ape Yacht Club creator Yuga Labs purchasing the intellectual property rights to CryptoPunks and Meebits from Larva Labs.</p>"
        ),
      },
      {
        type: "html",
        html: migratedWordPressTrustedHtml(
          '<p>18 Mar 2022 | <a href="https://unchainedpodcast.com/punk6529-on-the-significance-of-bored-ape-yacht-club-and-cryptopunks/" rel="noopener noreferrer" target="_blank">UnchainedPodcast.com</a> | <a href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Unchained_-_Ep.331_-_Punk6529_on_the_Significance_of_Bored_Ape_Yacht_Club_and_CryptoPunks.mp3" rel="noopener noreferrer" target="_blank">Download mp3</a></p>'
        ),
      },
    ],
  };
