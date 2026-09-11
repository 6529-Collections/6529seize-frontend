import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const capitalFundMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/capital/fund",
  title: "6529 NFT FUND",
  description:
    "It is targeting approximately $25M to $50M of capital deployed each quarter in a diversified set of NFTs across the PFP, generative art, 1of1 and photography categories. Secondarily, it may make early stage investments in project teams and NFT infrastructure.",
  section: "Capital",
  blocks: [
    {
      type: "heading",
      content:
        "THE 6529 NFT FUND IS A SERIES OF CLOSED-END QUARTERLY FUNDS OPEN TO ACCREDITED INVESTORS AND QUALIFIED PURCHASERS",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>It is targeting approximately $25M to $50M of capital deployed each quarter in a diversified set of NFTs across the PFP, generative art, 1of1 and photography categories. Secondarily, it may make early stage investments in project teams and NFT infrastructure.</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p>If you are an accredited investor or qualified purchaser and would like to learn more about the 6529 NFT Fund, please contact us at <a href="mailto:jeff@6529.io"><u>jeff@6529.io</u></a>.</p>'
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p>Alternatively, you can access the fund information on Angellist <a href="https://angel.co/v/back/6529-nft-fund" rel="noopener noreferrer" target="_blank"><u>here</u></a>.</p>'
      ),
    },
    {
      type: "heading",
      content: "6529 NFT FUND GALLERIES",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://deca.art/punk6529/fundszn1" rel="noopener noreferrer" target="_blank">6529 NFT FUND SEASON 1</a></p>'
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://deca.art/punk6529/fundszn2" rel="noopener noreferrer" target="_blank">6529 NFT FUND SEASON 2</a></p>'
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://videos.files.wordpress.com/oXa5lrrh/casa-batllo.mp4" rel="noopener noreferrer" target="_blank">LIVING ARCHITECTURE – CASA BATLLO</a></p>'
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
