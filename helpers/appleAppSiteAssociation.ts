import { MOBILE_APP_EXCLUDED_ROUTES } from "@/helpers/mobileAppLinks";

/** `<Apple team ID>.<bundle ID>` of the 6529 Mobile iOS app. */
const IOS_APP_ID = "4962266Y3D.com.core6529.app";

/** Path families that never render a page (`/api` is a mobile app exclusion). */
const NON_PAGE_ROUTES = ["/_next", "/.well-known", "/review-data"] as const;

/**
 * Public files and downloads stay in the browser. Profile paths can contain
 * dots (ENS names such as `/punk6529.eth`), so only file extensions match.
 */
const FILE_EXTENSIONS = [
  "avif",
  "csv",
  "gif",
  "html",
  "ico",
  "jpeg",
  "jpg",
  "json",
  "md",
  "pdf",
  "png",
  "svg",
  "txt",
  "webp",
  "xml",
  "zip",
] as const;

interface AppLinkComponent {
  readonly "/": string;
  readonly exclude?: true;
  readonly caseSensitive?: false;
  readonly comment?: string;
}

function excludeRoute(route: string): AppLinkComponent[] {
  return [
    { "/": route, exclude: true },
    { "/": `${route}/*`, exclude: true },
  ];
}

function excludeExtension(extension: string): AppLinkComponent {
  return { "/": `*.${extension}`, exclude: true, caseSensitive: false };
}

/**
 * The `apple-app-site-association` document (iOS 13+ `components` format; the
 * app supports iOS 15+). iOS uses the first matching component, so exclusions
 * come before the catch-all. Routes match case-sensitively, like Next routes.
 */
export function getAppleAppSiteAssociation() {
  const components: AppLinkComponent[] = [
    ...[...MOBILE_APP_EXCLUDED_ROUTES, ...NON_PAGE_ROUTES].flatMap(
      excludeRoute
    ),
    ...FILE_EXTENSIONS.map(excludeExtension),
    {
      "/": "/*",
      comment: "Every other page, including profiles, opens in 6529 Mobile.",
    },
  ];

  return {
    applinks: {
      details: [{ appIDs: [IOS_APP_ID], components }],
    },
  };
}
