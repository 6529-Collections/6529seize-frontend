import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const casabatlloMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/casabatllo",
  title: "LIVING ARCHITECTURE – CASA BATLLO",
  description: "LIVING ARCHITECTURE – CASA BATLLO",
  section: "Projects",
  blocks: [
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/oXa5lrrh/casa-batllo.mp4",
        title: "LIVING ARCHITECTURE – CASA BATLLO",
      },
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
