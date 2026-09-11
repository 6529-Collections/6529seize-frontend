import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const omOmGroupsMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/om/om-groups",
  title: "OM GROUPS",
  description:
    "Over the next few weeks, we are going to build working groups for different core areas, as shown below.",
  section: "OM",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>We are going to build OM together.</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p>If you are interested in participating in the design of OM, please join the <a href="https://discord.gg/join-om" rel="noopener noreferrer" target="_blank">OM Discord channel</a>.</p>'
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Representative groups:</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<ul><li>Experiences: Art, Fashion, Education, Entertainment, Personal, Work</li><li>Communities: Art, PFP, Off-chain</li><li>Governance &amp; Social</li><li>Decentralized Tech Stack</li><li>Inclusion</li><li>Public Policy</li></ul>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
