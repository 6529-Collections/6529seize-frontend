import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const educationMigratedWordPressPage: MigratedWordPressStaticPageContent =
  {
    source: "migrated-wordpress",
    path: "/education",
    title: "EDUCATION",
    description: "We will have an open metaverse, if we choose to have one.",
    section: "Education",
    blocks: [
      {
        type: "heading",
        content:
          "EDUCATION IS THE MOST IMPORTANT INITIATIVE AT 6529 AND THE ONE THAT HAS TAKEN MOST OF MY TIME",
      },
      {
        type: "heading",
        content: "WHY EDUCATION",
      },
      {
        type: "html",
        html: migratedWordPressTrustedHtml(
          "<p>We will have an open metaverse, if we choose to have one.</p>"
        ),
      },
      {
        type: "html",
        html: migratedWordPressTrustedHtml(
          "<p>Societies are made up of people – citizens, business leaders, public servants. We all choose how we spend our time and resources, how we live our lives, who we vote for.</p>"
        ),
      },
      {
        type: "html",
        html: migratedWordPressTrustedHtml(
          "<p>I believe that most people, once they are aware of their choices, will prefer an open metaverse based on interoperable standards to a closed corporate metaverse.</p>"
        ),
      },
      {
        type: "html",
        html: migratedWordPressTrustedHtml(
          "<p>So the goal of 6529 Education is to share knowledge so that everyone can make an informed decision on how to live their lives and on what type of society they would like to live in.</p>"
        ),
      },
      {
        type: "heading",
        content: "WHAT IS THE PLAN IN EDUCATION?",
      },
      {
        type: "html",
        html: migratedWordPressTrustedHtml(
          '<p>The 6529 <a href="/education/tweetstorms">Tweetstorms</a> and <a href="/education/podcasts">Podcasts</a> form a historical archive. Each entry keeps a link to its original source, and the podcast entries also retain their publication dates.</p>'
        ),
      },
      {
        type: "html",
        html: migratedWordPressTrustedHtml(
          '<p>For a concise statement of the original thesis, read the <a href="/about/open-metaverse">Open Metaverse overview</a>. For a current institution built around public access and open records, read about the <a href="/museum/network/about">6529 Network Museum</a>, browse its <a href="/museum/network/collection">permanent collection</a>, or visit the <a href="/museum/network/research">Museum research hub</a>.</p>'
        ),
      },
      {
        type: "heading",
        content: "PARTNER WITH 6529 IN EDUCATION",
      },
      {
        type: "html",
        html: migratedWordPressTrustedHtml(
          '<p>If you work in education, research, advocacy, or policy related to cryptocurrency, digital rights, NFTs, Web3, the metaverse, or a related field, <a href="/education/education-collaboration-form">send a collaboration inquiry</a>.</p>'
        ),
      },
      {
        type: "html",
        html: migratedWordPressTrustedHtml(
          "<p>We want to help education spread across communities and geographies, and we are open to ideas about how to do so.</p>"
        ),
      },
    ],
  };
