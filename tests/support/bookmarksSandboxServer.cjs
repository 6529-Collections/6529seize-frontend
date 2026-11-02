"use strict";
require("../../scripts/require-6529-command.cjs");
const http = require("node:http");
const path = require("node:path");
const esbuild = require("esbuild");
const postcss = require("postcss");
const tailwind = require("tailwindcss");
const loadConfig = require("tailwindcss/loadConfig");
const root = path.resolve(__dirname, "../..");
const fixture = path.join(__dirname, "bookmarksFixture.tsx");
const fixtureExports = (names) =>
  `export { ${names} } from ${JSON.stringify(fixture)};`;
const stubs = new Map([
  [
    "@/components/header/user/HeaderUserConnect",
    "export default function Connect() { return null; }",
  ],
  ["@/components/auth/Auth", fixtureExports("useAuth")],
  ["@/services/auth/auth.utils", fixtureExports("getWalletAddress")],
  [
    "@/services/api/drop-bookmarks-api",
    fixtureExports("fetchBookmarkStatus, fetchBookmarks, updateDropBookmark"),
  ],
  [
    "@/hooks/useBrowserLocale",
    'export const useBrowserLocale = () => "en-US";',
  ],
  [
    "@/helpers/waves/drop.helpers",
    "export const convertApiDropToExtendedDrop = (drop) => drop;",
  ],
  [
    "@/helpers/navigation.helpers",
    "export const getWaveRoute = ({waveId, serialNo}) => `/waves/${waveId}?serialNo=${serialNo}`;",
  ],
  [
    "@/components/waves/drops/Drop",
    'import React from "react"; export const DropLocation={MY_STREAM:"MY_STREAM"}; export default function Drop(){return <div className="tw-p-5 tw-text-iron-100"><strong>Alice · Wave One</strong><p>A saved message for the browser fixture.</p></div>;}',
  ],
  [
    "next/navigation",
    'export const useRouter = () => ({push:(url)=>history.pushState({},"",url)});',
  ],
  [
    "next/link",
    'import React from "react"; export default function Link({prefetch, children, ...props}) {return <a {...props}>{children}</a>;}',
  ],
]);
async function start() {
  const bundle = await esbuild.build({
    absWorkingDir: root,
    entryPoints: [fixture],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [
      {
        name: "bookmarks-fixture-boundaries",
        setup(build) {
          build.onResolve({ filter: /.*/ }, ({ path: source }) =>
            stubs.has(source)
              ? { path: source, namespace: "fixture" }
              : undefined
          );
          build.onLoad(
            { filter: /.*/, namespace: "fixture" },
            ({ path: source }) => ({
              contents: stubs.get(source),
              loader: "tsx",
              resolveDir: root,
            })
          );
        },
      },
    ],
  });
  const config = loadConfig(path.join(root, "tailwind.config.ts"));
  const css = await postcss([
    tailwind({
      ...config,
      content: [
        "components/bookmarks/**/*.tsx",
        "components/header/user/HeaderBookmarksLink.tsx",
        "components/waves/drops/WaveDropBookmarkAction.tsx",
        "tests/support/bookmarksFixture.tsx",
      ],
    }),
  ]).process("@tailwind base; @tailwind utilities;", { from: undefined });
  const server = http.createServer((req, res) => {
    if (req.url === "/fixture.js") {
      res.setHeader("Content-Type", "application/javascript");
      res.end(bundle.outputFiles[0].text);
      return;
    }
    if (req.url === "/fixture.css") {
      res.setHeader("Content-Type", "text/css");
      res.end(css.css);
      return;
    }
    res.setHeader("Content-Type", "text/html");
    res.end(
      '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Bookmarks browser fixture</title><link rel="stylesheet" href="/fixture.css"><body style="margin:0;background:#09090b;font-family:Arial,sans-serif"><div id="root"></div><script src="/fixture.js"></script></body></html>'
    );
  });
  server.listen(Number(process.env.PORT || 3307), "127.0.0.1");
}
start().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
