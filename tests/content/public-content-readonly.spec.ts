import type { Page } from "@playwright/test";

import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";

type RouteExpectation = {
  path: string;
  text: string | RegExp;
  links?: Array<string | RegExp>;
  images?: boolean;
};

const CONTENT_ROUTES: RouteExpectation[] = [
  {
    path: "/education",
    text: "EDUCATION",
    links: [
      "/education/tweetstorms/",
      "/education/podcasts/",
      "/education/education-collaboration-form/",
    ],
  },
  {
    path: "/education/tweetstorms/",
    text: "TWEETSTORMS",
    links: [/^https:\/\/twitter\.com\/punk6529/],
  },
  {
    path: "/education/podcasts/",
    text: "PODCASTS",
    links: [/^https:\/\/www\.realvision\.com\//],
    images: true,
  },
  {
    path: "/museum",
    text: "6529 MUSEUM OF ART",
    links: ["/museum/genesis/", "/museum/6529-public-domain/"],
    images: true,
  },
  {
    path: "/museum/genesis/",
    text: "GENESIS",
    links: ["/museum/genesis/autoglyphs/", "/museum/genesis/fidenza"],
    images: true,
  },
  {
    path: "/museum/genesis/fidenza/",
    text: "FIDENZA",
    images: true,
  },
  {
    path: "/museum/6529-public-domain/",
    text: "6529 PUBLIC DOMAIN",
    links: [/^https:\/\/oncyber\.io\//],
    images: true,
  },
  {
    path: "/om",
    text: "OM",
    links: ["/om/partnership-request/"],
  },
  {
    path: "/news/introducing-om/",
    text: "INTRODUCING OM",
    links: [/^https:\/\/oncyber\.io\//],
  },
  {
    path: "/capital",
    text: "6529 CAPITAL",
    links: ["/capital/company-portfolio/", "/capital/fund/"],
  },
  {
    path: "/capital/fund/",
    text: "6529 NFT FUND",
    links: ["mailto:jeff@6529.io"],
  },
  {
    path: "/blog/from-fibonacci-to-fidenza/",
    text: "FROM FIBONACCI TO FIDENZA",
    links: ["/author/ladysabrina/"],
    images: true,
  },
  {
    path: "/author/ladysabrina/",
    text: /ladysabrina/i,
    links: ["/blog/from-fibonacci-to-fidenza/"],
  },
];

async function gotoContentRoute(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForRouteReady(page, { readySelector: "body" });
  await expect(page).not.toHaveTitle(/404|PAGE NOT FOUND/i);
  await expectNoHorizontalOverflow(page);
}

function pageBody(page: Page) {
  return page.locator("body");
}

async function expectHrefPresent(page: Page, href: string | RegExp) {
  const links = page.locator("a[href]");
  const hrefs = await links.evaluateAll((anchors) =>
    anchors.map((anchor) => anchor.getAttribute("href") || "")
  );
  const found = hrefs.some((candidate) =>
    typeof href === "string"
      ? normalizeHref(candidate) === normalizeHref(href)
      : href.test(candidate)
  );

  expect(
    found,
    `Expected ${page.url()} to contain link href ${String(href)}`
  ).toBe(true);
}

function normalizeHref(href: string) {
  if (!href.startsWith("/") || href === "/") {
    return href;
  }

  return href.endsWith("/") ? href.slice(0, -1) : href;
}

async function expectRepresentativeImages(page: Page) {
  const imagesWithSources = page.locator("img[src]").filter({
    hasNot: page.locator("xpath=./self::img[@src='']"),
  });
  await expect(imagesWithSources.first()).toBeAttached();
}

async function expectTargetBlankLinksAreSafe(page: Page) {
  const unsafeLinks = await page
    .locator("a[target='_blank']")
    .evaluateAll((anchors) =>
      anchors
        .map((anchor) => ({
          href: anchor.getAttribute("href") || "",
          rel: anchor.getAttribute("rel") || "",
        }))
        .filter((anchor) => {
          const tokens = anchor.rel.toLowerCase().split(/\s+/);
          return !tokens.includes("noopener") && !tokens.includes("noreferrer");
        })
    );

  expect(
    unsafeLinks,
    `Expected target=_blank links to include noopener or noreferrer. Unsafe: ${JSON.stringify(
      unsafeLinks.slice(0, 5)
    )}`
  ).toEqual([]);
}

test.describe("Public legacy content read-only coverage @surface @medium @large @readonly", () => {
  for (const route of CONTENT_ROUTES) {
    test(`renders ${route.path} content without mutation`, async ({ page }) => {
      await gotoContentRoute(page, route.path);

      await expect(page).toHaveURL(
        (url) => normalizeHref(url.pathname) === normalizeHref(route.path)
      );
      await expect(pageBody(page)).toContainText(route.text);
      for (const href of route.links ?? []) {
        await expectHrefPresent(page, href);
      }
      if (route.images) {
        await expectRepresentativeImages(page);
      }
      await expectTargetBlankLinksAreSafe(page);
    });
  }
});
