"use strict";
require("../../scripts/require-6529-command.cjs");
const http = require("node:http");
const path = require("node:path");
const esbuild = require("esbuild");
const postcss = require("postcss");
const tailwind = require("tailwindcss");
const loadConfig = require("tailwindcss/loadConfig");
const root = path.resolve(__dirname, "../..");
const fixture = path.join(__dirname, "waveFeatureFixture.tsx");
const port = Number(process.env.PORT || 3302);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("Synthetic Wave fixture PORT must be an integer from 1 to 65535");
const fixtureExport = (names) =>
  `export { ${names} } from ${JSON.stringify(fixture)};`;
const stubs = new Map([
  [
    "@sentry/nextjs",
    "export const logger={info:()=>{},warn:()=>{}}; export const captureException=()=>{}; export const captureMessage=()=>{}; export const addBreadcrumb=()=>{}; export const startInactiveSpan=()=>null; export const startSpan=(_,fn)=>fn(); export const withScope=(fn)=>fn({setTag:()=>{}}); export const SPAN_STATUS_ERROR=2;",
  ],
  [
    "@/config/env",
    'export const publicEnv = { NODE_ENV: "production", NEXT_PUBLIC_MIXPANEL_TOKEN: "synthetic-wave-feature-pilot" };',
  ],
  ["@/components/auth/Auth", fixtureExport("AuthContext, useAuth")],
  ["@/components/auth/authContext", fixtureExport("AuthContext, useAuth")],
  [
    "@/components/cookies/CookieConsentContext",
    fixtureExport("useCookieConsent, useOptionalCookieConsent"),
  ],
  ["@/hooks/useActiveWaveVotes", fixtureExport("useActiveWaveVotes")],
  ["@/hooks/useWaveDiscoveryViewer", fixtureExport("useWaveDiscoveryViewer")],
  ["@/contexts/wave/MyStreamContext", fixtureExport("useMyStream")],
  ["@/components/brain/ContentTabContext", fixtureExport("useContentTab")],
  [
    "@/hooks/useDeviceInfo",
    "export default function useDeviceInfo() { return { isApp: false, hasTouchScreen: false }; }",
  ],
  [
    "@/hooks/useWaveDropsLeaderboard",
    'export const WaveDropsLeaderboardSort = { RANK:"RANK", RATING_PREDICTION:"RATING_PREDICTION", REALTIME_VOTE:"REALTIME_VOTE", TREND:"TREND", CREATED_AT:"CREATED_AT", PRICE:"PRICE" };',
  ],
  [
    "next/navigation",
    'export const usePathname = () => location.pathname; export const useSearchParams = () => new URLSearchParams(location.search); export const useRouter = () => ({ push: (url) => history.pushState({}, "", url) });',
  ],
  [
    "next/link",
    'import React from "react"; export default function Link({prefetch, children, ...props}) { return React.createElement("a", props, children); }',
  ],
  [
    "@/contexts/CompetitionNavigationContext",
    "export const useCompetitionNavigation = () => ({flat:false, nativeCompetition:null});",
  ],
  [
    "@/hooks/useWave",
    "export const useWave = () => ({ isChatWave:new URLSearchParams(location.search).has('late-tabs'), isApproveWave:false, isMemesWave:false, isCurationWave:false, isRankWave:!new URLSearchParams(location.search).has('late-tabs'), pauses:{filterDecisionsDuringPauses:(items)=>items} });",
  ],
  [
    "@/hooks/waves/useWaveCurationTabs",
    "export const useWaveCurationTabs = () => ({data:[]});",
  ],
  [
    "@/hooks/waves/useWaveCurationReorderMutation",
    "export const useWaveCurationReorderMutation = () => ({isPending:false, reorderCuration:()=>{}});",
  ],
  [
    "@/hooks/waves/useWaveMetadata",
    'export const useApproveWaveCustomTabLabels = () => ({approvals:"Approvals", approved:"Approved"}); export const useWaveOutcomeVisibility = () => true;',
  ],
  [
    "@/hooks/useProfileWave",
    'export const getProfileWaveIdentity = () => ""; export const useProfileWave = () => ({data:null});',
  ],
  [
    "@/hooks/useWaveHasPolls",
    "export const useWavePollSummary = () => ({unansweredPolls:0});",
  ],
  [
    "@/hooks/competitions/useWaveCompetitionsTab",
    "export const useWaveCompetitionsTab = () => ({activeCount:0});",
  ],
  [
    "@/hooks/waves/useDecisionPoints",
    "export const useDecisionPoints = () => ({allDecisions:[], hasMoreFuture:false, loadMoreFuture:()=>{}});",
  ],
  [
    "@/components/waves/WavePicture",
    "export default function WavePicture() { return null; }",
  ],
  [
    "@/components/waves/WaveTrustSignals",
    "export const WaveTrustSignals = () => null; export const hasWaveTrustSummaryScore = () => false; export const WaveScoreSummaryHoverCard = ({children}) => children;",
  ],
]);
const events = [];
const people = [];
const groups = [];

async function start() {
  const result = await esbuild.build({
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
        name: "synthetic-wave-feature-boundaries",
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            if (args.path.endsWith("/ContentTabContext"))
              return {
                path: "@/components/brain/ContentTabContext",
                namespace: "fixture",
              };
            if (args.path === "./useDeviceInfo")
              return { path: "@/hooks/useDeviceInfo", namespace: "fixture" };
            if (stubs.has(args.path))
              return { path: args.path, namespace: "fixture" };
            if (
              /MyStreamActionTooltip|MyStreamWaveCreateActionsMenu|MyStreamWaveCurationTabMenu|BrainLeftSidebarWaveDropTime/.test(
                args.path
              )
            ) {
              return { path: "null-component", namespace: "fixture" };
            }
            if (args.path === "mixpanel-browser")
              return { path: "sdk", namespace: "fixture" };
            return undefined;
          });
          build.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => {
            let contents = stubs.get(args.path);
            if (args.path === "null-component")
              contents = "export default function Component() { return null; }";
            if (args.path === "sdk") {
              const sdkPath = require.resolve("mixpanel-browser");
              contents = `import sdk from ${JSON.stringify(sdkPath)};
            const init = sdk.init.bind(sdk);
            sdk.init = (token, options) => init(token, {...options,
              api_host: location.origin + '/capture', batch_flush_interval_ms: 300,
              batch_requests: new URLSearchParams(location.search).get('transport') !== 'direct'});
            export default sdk;`;
            }
            return { contents, loader: "js", resolveDir: root };
          });
        },
      },
    ],
  });
  const config = loadConfig(path.join(root, "tailwind.config.ts"));
  const css = await postcss([
    tailwind({
      ...config,
      content: [
        "components/brain/left-sidebar/waves/**/*.tsx",
        "components/brain/my-stream/MyStreamWave*Tabs.tsx",
        "components/brain/my-stream/MyStreamWaveTabOption.tsx",
        "components/common/TabToggle.tsx",
        "components/common/TabCountBadge.tsx",
        "components/utils/select/**/*.tsx",
        "components/waves/leaderboard/header/WaveleaderboardSort.tsx",
      ],
    }),
  ]).process("@tailwind base; @tailwind utilities;", { from: undefined });
  const captureDestination = (pathname) => {
    if (pathname === "/people" || pathname.startsWith("/capture/engage"))
      return people;
    if (pathname === "/groups" || pathname.startsWith("/capture/groups"))
      return groups;
    return events;
  };
  const captureRequest = async (req, pathname) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    const params = new URLSearchParams(
      body || new URL(req.url, "http://localhost").search
    );
    const data = params.get("data");
    if (!data) return;
    const json =
      data.startsWith("{") || data.startsWith("[")
        ? data
        : Buffer.from(data, "base64").toString();
    const decoded = JSON.parse(json);
    captureDestination(pathname).push(
      ...(Array.isArray(decoded) ? decoded : [decoded])
    );
  };
  const server = http.createServer(async (req, res) => {
    const pathname = new URL(req.url, `http://127.0.0.1:${port}`).pathname;
    if (pathname === "/fixture.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.end(result.outputFiles[0].text);
      return;
    }
    if (pathname === "/fixture.css") {
      res.setHeader("Content-Type", "text/css");
      res.end(css.css);
      return;
    }
    if (["/events", "/people", "/groups"].includes(pathname)) {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(captureDestination(pathname)));
      return;
    }
    if (pathname === "/clear") {
      events.length = 0;
      people.length = 0;
      groups.length = 0;
      res.end("1");
      return;
    }
    if (pathname.startsWith("/capture/")) {
      await captureRequest(req, pathname);
      res.setHeader("Content-Type", "application/json");
      res.end("1");
      return;
    }
    res.setHeader("Content-Type", "text/html");
    res.end(
      '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic Wave feature fixture</title><link rel="stylesheet" href="/fixture.css"><style>body{background:#111;color:white;font-family:system-ui;margin:20px}main{max-width:800px}#sort-controls{margin:20px 0}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>'
    );
  });
  server.listen(port, "127.0.0.1", () =>
    process.stdout.write(`Synthetic Wave fixture listening on ${port}\n`)
  );
  const stop = () => server.close(() => process.exit(0));
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}
void start().catch((error) => {
  process.stderr.write(String(error));
  process.exitCode = 1;
});
