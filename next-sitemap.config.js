/** @type {import("next-sitemap").IConfig} */
module.exports = {
  siteUrl: "https://seize.io",
  generateRobotsTxt: true,
  changefreq: "daily",
  exclude: ["/access", "/restricted", "/nextgen/manager"],
  additionalPaths: async (config) => {
    const additionalPaths = AboutSections.map((section) => ({
      loc: `/about/${section}`, // Required
      changefreq: "daily",
      priority: 0.7,
    }));
    return additionalPaths;
  },
  transform: async (config, path) => {
    return {
      loc: path,
      changefreq: "daily",
      priority: path === "/" ? 1.0 : 0.7,
      lastmod: new Date().toISOString(),
    };
  },
};

const AboutSections = [
  "the-memes",
  "memes-calendar",
  "meme-lab",
  "6529-gradient",
  "faq",
  "mission",
  "release-notes",
  "contact-us",
  "terms-of-service",
  "privacy-policy",
  "cookie-policy",
  "license",
  "minting",
  "apply",
  "data-decentralization",
  "gdrc1",
  "nft-delegation",
  "primary-address",
  "ens",
  "subscriptions",
  "nakamoto-threshold",
  "copyright",
];
