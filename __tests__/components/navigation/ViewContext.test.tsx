import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { QueryClient } from "@tanstack/react-query";
import {
  ViewProvider,
  useViewContext,
} from "@/components/navigation/ViewContext";
import type { NavItem } from "@/components/navigation/navTypes";
import { useRouter } from "next/navigation";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import {
  createTestQueryClient,
  renderWithQueryClient,
} from "@/__tests__/utils/reactQuery";
import { getWaveQueryKey } from "@/services/api/wave-query";

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const push = jest.fn();
const prefetch = jest.fn();
const useRouterMock = useRouter as jest.Mock;
const useMyStreamOptionalMock = useMyStreamOptional as jest.Mock;
const commonApiFetchMock = commonApiFetch as jest.Mock;
const useDeviceInfoMock = useDeviceInfo as jest.Mock;
let activeWaveId: string | null = null;
let capturedContext: ViewContextValue | null = null;
let queryClient: QueryClient;
const waveTypes = new Map<string, boolean>();

type ViewContextValue = ReturnType<typeof useViewContext>;

const TestNavComponent: React.FC<{
  readonly item: NavItem;
  readonly afterNav?:
    | ((context: ViewContextValue) => void)
    | undefined
    | undefined;
}> = ({ item, afterNav }) => {
  const context = useViewContext();

  React.useEffect(() => {
    context.handleNavClick(item);
    if (afterNav) {
      afterNav(context);
    }
  }, [context, item, afterNav]);

  return null;
};

const ContextCapture: React.FC = () => {
  capturedContext = useViewContext();
  return null;
};

const wavesItem: NavItem = {
  kind: "view",
  name: "Waves",
  viewKey: "waves",
  icon: "w",
};

const messagesItem: NavItem = {
  kind: "view",
  name: "DMs",
  viewKey: "messages",
  icon: "m",
};

const getCapturedContext = (): ViewContextValue => {
  if (!capturedContext) {
    throw new Error("View context was not captured");
  }

  return capturedContext;
};

const makeWave = (id: string, isDirectMessage: boolean): ApiWave =>
  ({
    id,
    chat: {
      scope: {
        group: {
          is_direct_message: isDirectMessage,
        },
      },
    },
  }) as ApiWave;

const setDeviceInfo = ({
  isApp = false,
  isMobileDevice = false,
  hasTouchScreen = false,
} = {}) => {
  useDeviceInfoMock.mockReturnValue({
    isApp,
    isMobileDevice,
    hasTouchScreen,
  });
};

const renderCapturedProvider = () =>
  renderWithQueryClient(
    <ViewProvider>
      <ContextCapture />
    </ViewProvider>,
    { queryClient }
  );

const setActiveWave = async (
  rerender: ReturnType<typeof renderWithQueryClient>["rerender"],
  waveId: string | null
) => {
  activeWaveId = waveId;
  rerender(
    <ViewProvider>
      <ContextCapture />
    </ViewProvider>
  );

  await act(async () => {
    await Promise.resolve();
  });

  if (waveId) {
    await waitFor(() =>
      expect(commonApiFetchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: `waves/${waveId}`,
          signal: expect.any(AbortSignal),
        })
      )
    );
    await act(async () => {
      await Promise.resolve();
    });
  }
};

beforeEach(() => {
  jest.clearAllMocks();
  activeWaveId = null;
  capturedContext = null;
  queryClient = createTestQueryClient();
  waveTypes.clear();
  setDeviceInfo();
  useRouterMock.mockReturnValue({
    push,
    prefetch,
  });
  useMyStreamOptionalMock.mockImplementation(() => ({
    activeWave: {
      id: activeWaveId,
    },
  }));
  commonApiFetchMock.mockImplementation(
    ({ endpoint }: { readonly endpoint: string }) => {
      const waveId = endpoint.replace("waves/", "");
      return Promise.resolve(makeWave(waveId, waveTypes.get(waveId) ?? false));
    }
  );
});

describe("ViewContext", () => {
  it("throws when used outside provider", () => {
    expect(() => renderHook(() => useViewContext())).toThrow(
      "useViewContext must be used within a ViewProvider"
    );
  });

  it("handles route navigation", () => {
    renderWithQueryClient(
      <ViewProvider>
        <TestNavComponent
          item={
            {
              kind: "route",
              name: "Home",
              href: "/home",
              icon: "h",
            } as NavItem
          }
        />
      </ViewProvider>,
      { queryClient }
    );
    expect(push).toHaveBeenCalledWith("/");
  });

  it("navigates to home (latest) when Home is clicked", () => {
    renderWithQueryClient(
      <ViewProvider>
        <TestNavComponent
          item={
            {
              kind: "route",
              name: "Home",
              href: "/",
              icon: "home",
            } as NavItem
          }
        />
      </ViewProvider>,
      { queryClient }
    );
    expect(push).toHaveBeenCalledWith("/");
  });

  it("navigates to waves view when no last visited wave", () => {
    renderWithQueryClient(
      <ViewProvider>
        <TestNavComponent
          item={
            {
              kind: "view",
              name: "Waves",
              viewKey: "waves",
              icon: "w",
            } as NavItem
          }
          afterNav={({ hardBack }) => hardBack("waves")}
        />
      </ViewProvider>,
      { queryClient }
    );
    expect(push).toHaveBeenCalledWith("/waves");
    expect(push).toHaveBeenLastCalledWith("/waves");
  });

  it("in app mode, prefetches real Waves and Messages routes", async () => {
    setDeviceInfo({ isApp: true, isMobileDevice: true, hasTouchScreen: true });

    renderCapturedProvider();

    await waitFor(() => expect(prefetch).toHaveBeenCalledTimes(2));
    expect(prefetch).toHaveBeenCalledWith("/waves");
    expect(prefetch).toHaveBeenCalledWith("/messages");
    expect(prefetch).not.toHaveBeenCalledWith("/?view=waves");
    expect(prefetch).not.toHaveBeenCalledWith("/?view=messages");
  });

  it("shares an in-flight Wave metadata query with navigation classification", async () => {
    const waveId = "shared-dm";
    const wave = makeWave(waveId, true);
    let resolveWave: (value: ApiWave) => void = () => {};
    const pendingWave = new Promise<ApiWave>((resolve) => {
      resolveWave = resolve;
    });
    activeWaveId = waveId;
    commonApiFetchMock.mockReturnValueOnce(pendingWave);

    const prefetchPromise = queryClient.prefetchQuery({
      queryKey: getWaveQueryKey(waveId),
      queryFn: async ({ signal }) =>
        await commonApiFetch<ApiWave>({
          endpoint: `waves/${waveId}`,
          signal,
        }),
      staleTime: 60000,
    });

    await waitFor(() => expect(commonApiFetchMock).toHaveBeenCalledTimes(1));
    const { rerender } = renderCapturedProvider();

    await act(async () => {
      await Promise.resolve();
    });
    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveWave(wave);
      await prefetchPromise;
    });

    await setActiveWave(rerender, null);
    await waitFor(() =>
      expect(getCapturedContext().getNavHref(messagesItem)).toBe(
        `/messages/${waveId}`
      )
    );
    expect(queryClient.getQueryData(getWaveQueryKey(waveId))).toBe(wave);
    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
  });

  it("from a DM, clicking Waves restores the last normal wave", async () => {
    const { rerender } = renderCapturedProvider();

    waveTypes.set("normal-wave", false);
    await setActiveWave(rerender, "normal-wave");
    waveTypes.set("dm-wave", true);
    await setActiveWave(rerender, "dm-wave");

    push.mockClear();
    act(() => {
      getCapturedContext().handleNavClick(wavesItem);
    });

    expect(push).toHaveBeenCalledWith("/waves/normal-wave");
  });

  it("in app mode, Waves restores the last normal wave", async () => {
    setDeviceInfo({ isApp: true, isMobileDevice: true, hasTouchScreen: true });
    const { rerender } = renderCapturedProvider();

    waveTypes.set("normal-wave", false);
    await setActiveWave(rerender, "normal-wave");
    waveTypes.set("dm-wave", true);
    await setActiveWave(rerender, "dm-wave");

    push.mockClear();
    act(() => {
      getCapturedContext().handleNavClick(wavesItem);
    });

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/waves/normal-wave");
    expect(push).not.toHaveBeenCalledWith("/?view=waves", { scroll: false });
  });

  it("in app mode, exposes the real Waves link target for the last normal wave", async () => {
    setDeviceInfo({ isApp: true, isMobileDevice: true, hasTouchScreen: true });
    const { rerender } = renderCapturedProvider();

    waveTypes.set("normal-wave", false);
    await setActiveWave(rerender, "normal-wave");
    waveTypes.set("dm-wave", true);
    await setActiveWave(rerender, "dm-wave");

    expect(getCapturedContext().getNavHref(wavesItem)).toBe(
      "/waves/normal-wave"
    );
  });

  it("from a normal wave, clicking Messages restores the last DM", async () => {
    const { rerender } = renderCapturedProvider();

    waveTypes.set("dm-wave", true);
    await setActiveWave(rerender, "dm-wave");
    waveTypes.set("normal-wave", false);
    await setActiveWave(rerender, "normal-wave");

    push.mockClear();
    act(() => {
      getCapturedContext().handleNavClick(messagesItem);
    });

    expect(push).toHaveBeenCalledWith("/messages/dm-wave");
  });

  it("in app mode, Messages restores the last DM", async () => {
    setDeviceInfo({ isApp: true, isMobileDevice: true, hasTouchScreen: true });
    const { rerender } = renderCapturedProvider();

    waveTypes.set("dm-wave", true);
    await setActiveWave(rerender, "dm-wave");
    waveTypes.set("normal-wave", false);
    await setActiveWave(rerender, "normal-wave");

    push.mockClear();
    act(() => {
      getCapturedContext().handleNavClick(messagesItem);
    });

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/messages/dm-wave");
    expect(push).not.toHaveBeenCalledWith("/?view=messages", {
      scroll: false,
    });
  });

  it("in app mode, exposes the real Messages link target for the last DM", async () => {
    setDeviceInfo({ isApp: true, isMobileDevice: true, hasTouchScreen: true });
    const { rerender } = renderCapturedProvider();

    waveTypes.set("dm-wave", true);
    await setActiveWave(rerender, "dm-wave");
    waveTypes.set("normal-wave", false);
    await setActiveWave(rerender, "normal-wave");

    expect(getCapturedContext().getNavHref(messagesItem)).toBe(
      "/messages/dm-wave"
    );
  });

  it("from a normal wave, clicking Waves clears the normal wave", async () => {
    const { rerender } = renderCapturedProvider();

    waveTypes.set("normal-wave", false);
    await setActiveWave(rerender, "normal-wave");

    push.mockClear();
    act(() => {
      getCapturedContext().handleNavClick(wavesItem);
    });
    expect(push).toHaveBeenCalledWith("/waves");

    push.mockClear();
    await setActiveWave(rerender, null);
    act(() => {
      getCapturedContext().handleNavClick(wavesItem);
    });

    expect(push).toHaveBeenCalledWith("/waves");
  });

  it("in app mode, from a normal wave, clicking Waves clears to the real Waves route", async () => {
    setDeviceInfo({ isApp: true, isMobileDevice: true, hasTouchScreen: true });
    const { rerender } = renderCapturedProvider();

    waveTypes.set("normal-wave", false);
    await setActiveWave(rerender, "normal-wave");

    push.mockClear();
    act(() => {
      getCapturedContext().handleNavClick(wavesItem);
    });

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/waves");
    expect(push).not.toHaveBeenCalledWith("/?view=waves", { scroll: false });
  });

  it("from a DM, clicking Messages clears the DM", async () => {
    const { rerender } = renderCapturedProvider();

    waveTypes.set("dm-wave", true);
    await setActiveWave(rerender, "dm-wave");

    push.mockClear();
    act(() => {
      getCapturedContext().handleNavClick(messagesItem);
    });
    expect(push).toHaveBeenCalledWith("/messages");

    push.mockClear();
    await setActiveWave(rerender, null);
    act(() => {
      getCapturedContext().handleNavClick(messagesItem);
    });

    expect(push).toHaveBeenCalledWith("/messages");
  });

  it("in app mode, from a DM, clicking Messages clears to the real Messages route", async () => {
    setDeviceInfo({ isApp: true, isMobileDevice: true, hasTouchScreen: true });
    const { rerender } = renderCapturedProvider();

    waveTypes.set("dm-wave", true);
    await setActiveWave(rerender, "dm-wave");

    push.mockClear();
    act(() => {
      getCapturedContext().handleNavClick(messagesItem);
    });

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/messages");
    expect(push).not.toHaveBeenCalledWith("/?view=messages", {
      scroll: false,
    });
  });
});
