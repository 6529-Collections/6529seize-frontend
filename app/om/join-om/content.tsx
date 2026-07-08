import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const omJoinOmMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/om/join-om",
  title: "JOIN OM GENERATION 1",
  description:
    "OM is currently in alpha and we want to grow with all types of usage cases before beta. We are calling this Generation 1.",
  section: "OM",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>OM is currently in alpha and we want to grow with all types of usage cases before beta. We are calling this Generation 1.</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>It is free to join. We will try to add as many folks as possible, but we can't guarantee we can add everyone. Please fill out the form below if you are interested.</p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
