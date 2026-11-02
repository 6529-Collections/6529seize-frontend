/**
 * @jest-environment jsdom
 * @jest-environment-options {"url":"https://staging.6529.io"}
 */

import { act, renderHook } from "@testing-library/react";
import { App, type URLOpenListener } from "@capacitor/app";
import { useDeepLinkNavigation } from "@/hooks/useDeepLinkNavigation";

type AppUrlOpenSubscription = (
  event: "appUrlOpen",
  listener: URLOpenListener
) => ReturnType<typeof App.addListener>;

const push = jest.fn();
const router = { push };
jest.mock("next/navigation", () => ({ useRouter: () => router }));
jest.mock("@capacitor/app", () => ({
  App: { addListener: jest.fn(), getLaunchUrl: jest.fn() },
}));
jest.mock("@/hooks/useCapacitor", () => () => ({ isCapacitor: true }));
jest.mock("@/config/env", () => ({
  publicEnv: { MOBILE_APP_SCHEME: "mobileStaging6529" },
}));

const remove = jest.fn();
let receiveLink: URLOpenListener;
const url = "https://staging.6529.io/waves/1?tag=a&tag=b#drop-2";

beforeEach(() => {
  jest.clearAllMocks();
  window.history.replaceState(null, "", "/");
  jest
    .mocked<AppUrlOpenSubscription>(App.addListener)
    .mockImplementation((_event, listener) => {
      receiveLink = listener;
      return Promise.resolve({ remove });
    });
  jest.mocked(App.getLaunchUrl).mockResolvedValue(undefined);
});

it.each(["launch", "foreground"] as const)(
  "navigates to the requested page for a staging %s universal link",
  async (source) => {
    if (source === "launch") {
      jest.mocked(App.getLaunchUrl).mockResolvedValue({ url });
    }

    const { unmount } = renderHook(() => useDeepLinkNavigation());
    await act(async () => {});
    if (source === "foreground") {
      act(() => {
        receiveLink({ url });
      });
    }

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(
      expect.stringMatching(/^\/waves\/1\?tag=a&tag=b&_t=\d+#drop-2$/)
    );
    unmount();
    await Promise.resolve();
    expect(remove).toHaveBeenCalledTimes(1);
  }
);
