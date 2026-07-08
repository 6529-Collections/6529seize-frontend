import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumEarlyNftArtMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/early-nft-art",
  title: "EARLY NFT ART",
  description:
    "EARLY NFT ART Early NFT Art highlights, primarily, pre-2020 art within the 6529 collection – punks, pepes, autoglyphs, early cryptokitties, along with some pieces that are post 2020 but reference back to that time. VISIT THE EARLY NFT ART GALLERY",
  section: "Museum",
  blocks: [
    {
      type: "heading",
      content: "EARLY NFT ART",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Early NFT Art highlights, primarily, pre-2020 art within the 6529 collection – punks, pepes, autoglyphs, early cryptokitties, along with some pieces that are post 2020 but reference back to that time. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://oncyber.io/6529om?coords=117.37x2.8x-35.82x-1.67" rel="noopener noreferrer" target="_blank" data-migrated-wordpress-button>VISIT THE EARLY NFT ART GALLERY </a></p>'
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Early-NFT-Art-Screenshot.jpg",
        alt: "6529.io",
        width: 1920,
        height: 945,
        href: "https://oncyber.io/6529om?coords=117.37x2.8x-35.82x-1.67",
      },
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
