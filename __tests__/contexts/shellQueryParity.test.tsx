import { act, render } from "@testing-library/react";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import React, {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useState,
} from "react";

// Behaviour-parity harness for the shell providers that read search params.
// It drives TitleProvider, NavigationHistoryProvider and DynamicHeadTitle the
// way the App Router does:
// - a navigation updates pathname and search params in one transition render;
// - the browser URL updates in an insertion effect, before any effect runs;
// - the route's metadata <title> commits after the page;
// - router.push from the back stack navigates again.
// Every observable step is logged in order: each change in what the title and
// history consumers see, page effects (which run before provider effects),
// writes to document.title, metadata commits, router.push calls and the back
// stack read through goBack. The log is compared with a fixture recorded from
// main with this same harness. Commits that leave the observed values
// unchanged are not logged; the harness checks separately that any such
// follow-up commit writes nothing and runs no value-keyed effect.

type Nav = { readonly pathname: string; readonly search: string };
const MockNavContext = createContext<Nav>({ pathname: "/", search: "" });
let mockNavigate: (nav: Nav) => void = () => undefined;
const log: string[] = [];

jest.mock("next/navigation", () => {
  const { useContext: useCtx, useMemo } = jest.requireActual("react");
  return {
    usePathname: () => useCtx(MockNavContext).pathname,
    useSearchParams: () => {
      const { search } = useCtx(MockNavContext);
      return useMemo(() => new URLSearchParams(search), [search]);
    },
    useRouter: () => ({
      push: (href: string) => {
        log.push(`router.push ${href}`);
        const [pathname = "/", search = ""] = href.split("?");
        mockNavigate({ pathname, search });
      },
      replace: (href: string) => log.push(`router.replace ${href}`),
    }),
  };
});
jest.mock("@capacitor/core", () => {
  const actual = jest.requireActual("@capacitor/core");
  return {
    ...actual,
    Capacitor: { ...actual.Capacitor, isNativePlatform: () => false },
  };
});
jest.mock("@/components/navigation/ViewContext", () => ({
  useViewContext: () => ({
    hardBack: (view: string) => log.push(`hardBack ${view}`),
  }),
}));
jest.mock("@/contexts/WaveInformationContext", () => ({
  useWaveInformation: () => null,
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: () => null,
}));
jest.mock("@/config/env", () => ({
  publicEnv: { BASE_ENDPOINT: "https://6529.io" },
}));

import DynamicHeadTitle from "@/components/dynamic-head/DynamicHeadTitle";
import {
  NavigationHistoryProvider,
  useNavigationHistoryContext,
} from "@/contexts/NavigationHistoryContext";
import * as TitleContextModule from "@/contexts/TitleContext";

const { TitleProvider, useSetTitle, useSetWaveData } = TitleContextModule;

type ObservedTitle = {
  readonly title: string;
  readonly isTitleOwned: boolean;
  readonly titlePathname: string | null;
};
// The title text, ownership and route that DynamicHeadTitle reads. Resolved by
// name so this harness runs unchanged against every implementation.
const titleHooks = TitleContextModule as unknown as {
  readonly useTitleText?: () => ObservedTitle;
  readonly useTitle: () => ObservedTitle;
};
const useObservedTitle = titleHooks.useTitleText ?? titleHooks.useTitle;

// Pages that claim an explicit title, and wave pages that publish wave data.
const EXPLICIT_TITLES: Record<string, string> = {
  "/the-memes/1": "Meme One",
  "/the-memes/2": "Meme Two",
};

function ExplicitTitle({ title }: { readonly title: string }) {
  useSetTitle(title);
  return null;
}

function WaveData({ id }: { readonly id: string }) {
  useSetWaveData({ id, name: `Wave ${id}`, newItemsCount: 0 });
  return null;
}

function Page() {
  const { pathname, search } = useContext(MockNavContext);
  const wave = new URLSearchParams(search).get("wave");
  useEffect(() => {
    log.push(`page effect ${pathname}${search ? `?${search}` : ""}`);
  }, [pathname, search]);
  const explicit = EXPLICIT_TITLES[pathname];
  return (
    <>
      {explicit ? <ExplicitTitle title={explicit} /> : null}
      {wave ? <WaveData id={wave} /> : null}
    </>
  );
}

let history: ReturnType<typeof useNavigationHistoryContext> | null = null;
let commitId = 0;
let lastObserved: string | null = null;
// Set by a navigation step; the next commit is that navigation's own render.
let awaitingNavigationCommit = true;
// Follow-up commits (state updates after a navigation's render) whose
// observed values did not change, with the log position they happened at.
const identicalFollowUpCommits: { commit: number; logIndex: number }[] = [];
const valueEffectCommits = new Set<number>();

function Probe() {
  const { title, isTitleOwned, titlePathname } = useObservedTitle();
  const navigation = useNavigationHistoryContext();
  const { pathname, search } = useContext(MockNavContext);
  history = navigation;
  const snapshot = `seen title="${title}" owned=${isTitleOwned} for=${titlePathname} canGoBack=${navigation.canGoBack}`;
  // Everything DynamicHeadTitle's effect depends on: the title layer's values
  // plus the URL it reads from the router.
  const observed = `${snapshot} url=${pathname}?${search}`;
  useLayoutEffect(() => {
    commitId += 1;
    const isNavigationCommit = awaitingNavigationCommit;
    awaitingNavigationCommit = false;
    if (observed === lastObserved) {
      if (!isNavigationCommit) {
        identicalFollowUpCommits.push({
          commit: commitId,
          logIndex: log.length,
        });
      }
      return;
    }
    lastObserved = observed;
    log.push(snapshot);
  });
  // Keyed on the observed values, like DynamicHeadTitle's effect.
  useEffect(() => {
    valueEffectCommits.add(commitId);
  }, [
    title,
    isTitleOwned,
    titlePathname,
    navigation.canGoBack,
    pathname,
    search,
  ]);
  return null;
}

const STEP_BOUNDARY = /^(seen |--- |router\.push |metadata )/;

// A commit with unchanged values must stay inert: no document.title write
// before the next observed change or step, and no value-keyed effect run.
function expectIdenticalCommitsInert(result: readonly string[]) {
  for (const { commit, logIndex } of identicalFollowUpCommits) {
    expect(valueEffectCommits.has(commit)).toBe(false);
    const rest = result.slice(logIndex);
    const end = rest.findIndex((entry) => STEP_BOUNDARY.test(entry));
    const window = end === -1 ? rest : rest.slice(0, end);
    expect(
      window.filter((entry) => entry.startsWith("document.title"))
    ).toEqual([]);
  }
}

function UrlSync() {
  const { pathname, search } = useContext(MockNavContext);
  useInsertionEffect(() => {
    globalThis.history.replaceState(
      null,
      "",
      `${pathname}${search ? `?${search}` : ""}`
    );
  }, [pathname, search]);
  return null;
}

function Harness({ initial }: { readonly initial: Nav }) {
  const [nav, setNav] = useState(initial);
  mockNavigate = (next) => startTransition(() => setNav(next));
  return (
    <MockNavContext.Provider value={nav}>
      <UrlSync />
      <TitleProvider>
        <NavigationHistoryProvider>
          <DynamicHeadTitle />
          <Page />
          <Probe />
        </NavigationHistoryProvider>
      </TitleProvider>
    </MockNavContext.Provider>
  );
}

const titleDescriptor = Object.getOwnPropertyDescriptor(
  Document.prototype,
  "title"
)!;

function parse(url: string): Nav {
  const [pathname = "/", search = ""] = url.split("?");
  return { pathname, search };
}

// The App Router commits each route's metadata <title> after the page renders,
// replacing the text node directly rather than through document.title.
async function commitMetadata() {
  const metadataTitle = `Metadata ${globalThis.location.pathname}`;
  log.push(`metadata <title> = "${metadataTitle}"`);
  document.head.querySelector("title")!.textContent = metadataTitle;
  await act(async () => {});
}

async function run(steps: readonly string[]): Promise<string[]> {
  log.length = 0;
  history = null;
  commitId = 0;
  lastObserved = null;
  awaitingNavigationCommit = true;
  identicalFollowUpCommits.length = 0;
  valueEffectCommits.clear();
  document.head.innerHTML = "<title>Server metadata title</title>";
  globalThis.history.replaceState(null, "", steps[0]);
  const [first, ...rest] = steps;
  const view = render(<Harness initial={parse(first!)} />);
  await act(async () => {});
  for (const step of rest) {
    log.push(`--- ${step}`);
    awaitingNavigationCommit = true;
    await act(async () => {
      if (step === "BACK") history?.goBack();
      else mockNavigate(parse(step));
    });
    await act(async () => {});
    await commitMetadata();
  }
  log.push("--- back stack");
  for (let i = 0; i < 10 && history?.canGoBack; i++) {
    awaitingNavigationCommit = true;
    await act(async () => {
      history?.goBack();
    });
    await act(async () => {});
  }
  view.unmount();
  return [...log];
}

beforeAll(() => {
  Object.defineProperty(document, "title", {
    configurable: true,
    get() {
      return titleDescriptor.get!.call(document);
    },
    set(value: string) {
      log.push(`document.title = "${value}"`);
      titleDescriptor.set!.call(document, value);
    },
  });
});

const SEQUENCES: Record<string, readonly string[]> = {
  "pathname-only changes": ["/", "/network", "/open-data", "/network"],
  "query-only changes": ["/network?tab=a", "/network?tab=b", "/network"],
  "pathname and query together": [
    "/network?tab=a",
    "/open-data?tab=b",
    "/network",
  ],
  "back and forward": [
    "/network",
    "/open-data",
    "/tools",
    "BACK",
    "/tools",
    "BACK",
    "BACK",
  ],
  "explicit title pages": [
    "/network",
    "/the-memes/1",
    "/the-memes/1?focus=live",
    "/the-memes/2",
    "BACK",
  ],
  "wave and view queries": [
    "/waves",
    "/waves?wave=a",
    "/waves?wave=b",
    "/waves",
    "/?view=waves",
    "/",
    "/?wave=c",
  ],
};

// Recorded from main, before the query readers moved into Suspense leaves.
// Re-record only on purpose: SHELL_QUERY_PARITY_RECORD=1.
const FIXTURE = path.join(
  __dirname,
  "__fixtures__",
  "shellQueryParity.main.json"
);
const isRecording = process.env["SHELL_QUERY_PARITY_RECORD"] === "1";
const recorded: Record<string, string[]> = {};

afterAll(() => {
  delete (document as { title?: string }).title;
  if (isRecording) {
    writeFileSync(FIXTURE, `${JSON.stringify(recorded, null, 2)}\n`);
  }
});

it.each(Object.entries(SEQUENCES))(
  "keeps main's title and back-stack sequence for %s",
  async (name, steps) => {
    const result = await run(steps);
    expectIdenticalCommitsInert(result);
    if (isRecording) {
      recorded[name] = result;
      return;
    }
    const expected = JSON.parse(readFileSync(FIXTURE, "utf8")) as Record<
      string,
      string[]
    >;
    expect(result).toEqual(expected[name]);
  }
);
