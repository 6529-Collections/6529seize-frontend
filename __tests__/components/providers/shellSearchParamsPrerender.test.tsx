/** @jest-environment node */

import { renderToString } from "react-dom/server";

// During a static prerender Next's useSearchParams() throws to bail the
// nearest Suspense boundary out to client rendering. Shell leaves that read
// search params must own that boundary, or every prerendered route fails.
class MockBailoutToClientRendering extends Error {}

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => {
    throw new MockBailoutToClientRendering("useSearchParams()");
  },
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: null,
    fetchingProfile: false,
    showWaves: false,
  }),
}));
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({ performanceConsent: false }),
}));
jest.mock("@/components/nft-transfer/TransferState", () => ({
  useIsTransferModeActive: () => false,
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false, isMobileDevice: false }),
}));

const MixpanelSetup: typeof import("@/components/providers/MixpanelSetup").default =
  require("@/components/providers/MixpanelSetup").default;
const QuickDirectMessagesGate: typeof import("@/components/messages/quick-dms/QuickDirectMessagesGate").default =
  require("@/components/messages/quick-dms/QuickDirectMessagesGate").default;

it.each([
  ["MixpanelSetup", MixpanelSetup],
  ["QuickDirectMessagesGate", QuickDirectMessagesGate],
])("%s keeps the search-params bailout inside its own boundary", (_name, Leaf) => {
  const onError = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    const html = renderToString(
      <main>
        <Leaf />
        <p>Page content</p>
      </main>
    );
    expect(html).toContain("<p>Page content</p>");
  } finally {
    onError.mockRestore();
  }
});
