import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const capitalMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/capital",
  title: "6529 CAPITAL",
  description:
    "Our goal is to help investors make wise investments, while also supporting NFT native and decentralization oriented values. While the current funds are currently traditional fund structure, we hope, in time, to reach a decentralized, tokenized end-state.",
  section: "Capital",
  blocks: [
    {
      type: "heading",
      content:
        "6529 CAPITAL HELPS LARGER, MORE TRADITIONAL INVESTORS INVEST IN NFTS, IN AN NFT-NATIVE MANNER",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>NFT investing is difficult specifically due to its non-fungibility, with the market value fragmented across and within collections.&nbsp; We believe there is no substitute for individual expertise in order to succeed in this field.</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>The 6529 Capital collecting team includes who we believe are some of the best regarded NFT collectors in the world.</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p>A full list of companies in our portfolio can be found <a href="/capital/company-portfolio">here</a>.</p>'
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://twitter.com/punk6529" rel="noopener noreferrer" target="_blank"><strong>@punk6529</strong></a></p>'
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://twitter.com/krybharat" rel="noopener noreferrer" target="_blank"><strong>@krybharat</strong></a></p>'
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://twitter.com/batsoupyum" rel="noopener noreferrer" target="_blank"><strong>@batsoupyum</strong></a></p>'
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://twitter.com/ACthecollector" rel="noopener noreferrer" target="_blank"><strong>@ACthecollector</strong></a></p>'
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://twitter.com/phon_ro" rel="noopener noreferrer" target="_blank"><strong>@phon_ro</strong></a></p>'
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://twitter.com/bonafidehan" rel="noopener noreferrer" target="_blank"><strong>@bonafidehan</strong></a></p>'
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>The collecting team is complemented by a top tier administrative team handling financial, operational, investor relations, legal and regulatory matters.</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://twitter.com/6529Guardian" rel="noopener noreferrer" target="_blank"><strong>@6529Guardian</strong></a></p>'
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://twitter.com/itsjpower" rel="noopener noreferrer" target="_blank"><strong>@itsjpower</strong></a></p>'
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p>6529 Capital is currently investing through the <a href="/capital/fund"><u>6529 NFT Fund</u></a>.</p>'
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
