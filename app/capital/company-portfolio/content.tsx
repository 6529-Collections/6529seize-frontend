import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const capitalCompanyPortfolioMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/capital/company-portfolio",
  title: "COMPANY PORTFOLIO",
  description:
    "6529 HAS MADE SEED INVESTMENTS FROM ITS OWN CAPITAL (ON BALANCE SHEET) IN THE FOLLOWING FIRMS Arbitrum Blur Deca Doppel farcaster OnCyber Ready Player Me tokenproof Transient Labs",
  section: "Capital",
  blocks: [
    {
      type: "heading",
      content:
        "6529 HAS MADE SEED INVESTMENTS FROM ITS OWN CAPITAL (ON BALANCE SHEET) IN THE FOLLOWING FIRMS",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Arbitrum<br></strong></p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p><strong>Blur<br></strong></p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p><strong>Deca<br></strong></p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p><strong>Doppel<br></strong></p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>farcaster<br></strong></p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p><strong>OnCyber<br></strong></p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Ready Player Me<br></strong></p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>tokenproof<br></strong></p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Transient Labs<br></strong></p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p><strong>UNXD<br></strong></p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p><strong>Safe<br></strong></p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p><strong>Monad<br></strong></p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p><strong>mmERCH<br></strong></p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p><strong>Sound<br></strong></p>"),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
