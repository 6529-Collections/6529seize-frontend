/** @jest-environment node */

import { renderToString } from "react-dom/server";

// Exercise the real SDK and the complete provider tree. SDK hooks must remain
// outside server rendering, without mock implementations hiding their failures.
jest.unmock("@reown/appkit/react");

// The real SDK's module graph creates background timers even without AppKit.
// Own their lifetime in this synchronous SSR test without replacing any hooks.
jest.useFakeTimers();
const Providers: typeof import("@/components/providers/Providers").default =
  require("@/components/providers/Providers").default;
const {
  useSeizeConnectContext,
}: typeof import("@/components/auth/SeizeConnectContext") = require("@/components/auth/SeizeConnectContext");
const {
  useSecureSign,
}: typeof import("@/hooks/useSecureSign") = require("@/hooks/useSecureSign");

afterAll(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

// Supply only the router context normally provided by Next's renderer.
jest.mock("next/navigation", () => ({
  usePathname: () => "/about",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}));

function PublicReader() {
  const { isConnected, connectedAccounts } = useSeizeConnectContext();
  const { isSigningPending } = useSecureSign();
  return (
    <main>
      <h1>Public reading</h1>
      <p>Learn about the open metaverse.</p>
      <a href="/education">Explore education</a>
      <output>{`${isConnected}:${connectedAccounts.length}:${isSigningPending}`}</output>
      <script type="application/ld+json">{'{"@type":"WebPage"}'}</script>
    </main>
  );
}

it("renders the complete provider boundary while AppKit is uninitialized", () => {
  const html = renderToString(
    <Providers>
      <PublicReader />
    </Providers>
  );
  expect(html).toContain("<h1>Public reading</h1>");
  expect(html).toContain("Learn about the open metaverse.");
  expect(html).toContain('href="/education"');
  expect(html).toContain('type="application/ld+json"');
  expect(html).toContain("false:0:false");
});
