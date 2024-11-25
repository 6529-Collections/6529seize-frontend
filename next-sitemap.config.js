/** @type {import("next-sitemap").IConfig} */

const fetchPaginatedData = async (url) => {
  let results = [];
  let nextPage = url;

  while (nextPage) {
    const response = await fetch(nextPage);
    try {
      const result = await response.json();
      results = [...results, ...result.data];
      nextPage = result.next;
    } catch (error) {
      console.error(`error for ${nextPage}`);
      throw error;
    }
  }

  return results;
};

const getVariationsPaths = async (sitePath, apiPath) => {
  const nftPaths = (
    await fetchPaginatedData(`https://api.6529.io/sitemap/${apiPath}`)
  ).flatMap((id) => {
    const basePath = `${sitePath}/${id}`;
    return getNftVariations(basePath);
  });
  return nftPaths;
};

const getPlainPaths = async (sitePath, apiPath) => {
  const plainPaths = (
    await fetchPaginatedData(`https://api.6529.io/sitemap/${apiPath}`)
  ).map((id) => ({
    loc: `/${sitePath}/${id}`,
    changefreq: "daily",
    priority: 0.7,
  }));
  return plainPaths;
};

const getNftVariations = (basePath) => {
  const queryVariations = [
    "live",
    "your-cards",
    "the-art",
    "collectors",
    "activity",
    "timeline",
  ];

  return [
    { loc: basePath, changefreq: "daily", priority: 0.7 },
    ...queryVariations.map((focus) => ({
      loc: `${basePath}?focus=${focus}`,
      changefreq: "daily",
      priority: 0.7,
    })),
  ];
};

module.exports = {
  siteUrl: "https://6529.io",
  generateRobotsTxt: true,
  changefreq: "daily",
  exclude: ["/access", "/restricted", "/nextgen/manager"],
  additionalPaths: async (config) => {
    const aboutPaths = AboutSections.map((section) => ({
      loc: `/about/${section}`,
      changefreq: "daily",
      priority: 0.7,
    }));

    const memesPaths = await getVariationsPaths("/the-memes", "memes");
    const gradientPaths = await getPlainPaths("/6529-gradient", "gradient");
    const memeLabPaths = await getVariationsPaths("/meme-lab", "meme-lab");

    const nextgenTokensPaths = await getPlainPaths(
      "/nextgen/token",
      "nextgen/tokens"
    );

    return [
      ...aboutPaths,
      ...memesPaths,
      ...gradientPaths,
      ...memeLabPaths,
      ...nextgenTokensPaths,
    ];
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
