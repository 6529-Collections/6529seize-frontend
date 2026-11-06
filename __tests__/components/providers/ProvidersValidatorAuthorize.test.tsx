/** @jest-environment node */

import { renderToString } from "react-dom/server";

// The SDK's module graph creates background timers even without AppKit.
jest.useFakeTimers();

let mockPathname = "/about";

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Renders inside Auth and gets the same flag; shows what the providers pass.
jest.mock("@/components/auth/AuthLaunchTimingReporter", () => ({
  __esModule: true,
  default: ({
    enableWalletAuthentication,
  }: {
    readonly enableWalletAuthentication: boolean;
  }) => <i data-wallet-authentication={String(enableWalletAuthentication)} />,
}));

const Providers: typeof import("@/components/providers/Providers").default =
  require("@/components/providers/Providers").default;

afterAll(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

function walletAuthentication(
  pathname: string,
  enabled?: boolean
): string | undefined {
  mockPathname = pathname;
  const html = renderToString(
    <Providers
      {...(enabled === undefined
        ? {}
        : { enableWalletAuthentication: enabled })}
    >
      <p>page</p>
    </Providers>
  );
  expect(html).toContain("<p>page</p>");
  return /data-wallet-authentication="(\w+)"/.exec(html)?.[1];
}

describe("the site's wallet sign-in prompt", () => {
  it("is off on /validator/authorize only, where a phone only signs a validator's grant", () => {
    expect(walletAuthentication("/validator/authorize")).toBe("false");
  });

  it.each([
    "/",
    "/about",
    "/validator",
    "/validator/guide",
    "/validator/authorizer",
    "/validator/authorize/next",
    "/validator/authorize/",
    "/x/validator/authorize",
    "/VALIDATOR/AUTHORIZE",
  ])("stays on at %s", (pathname) => {
    expect(walletAuthentication(pathname)).toBe("true");
  });

  it("stays off wherever a caller turns it off", () => {
    expect(walletAuthentication("/about", false)).toBe("false");
  });
});
