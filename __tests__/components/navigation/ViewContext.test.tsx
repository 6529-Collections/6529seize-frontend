import React from "react";
import { act, render, renderHook, waitFor } from "@testing-library/react";
import {
  ViewProvider,
  useViewContext,
} from "@/components/navigation/ViewContext";
import type { NavItem } from "@/components/navigation/navTypes";
import { useRouter } from "next/navigation";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({
    isApp: false,
    isMobileDevice: false,
    hasTouchScreen: false,
  }),
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
const useRouterMock = useRouter as jest.Mock;
const useMyStreamOptionalMock = useMyStreamOptional as jest.Mock;
const commonApiFetchMock = commonApiFetch as jest.Mock;
let activeWaveId: string | null = null;
let capturedContext: ViewContextValue | null = null;
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
  name: "Messages",
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

const renderCapturedProvider = () =>
  render(
    <ViewProvider>
      <ContextCapture />
    </ViewProvider>
  );

const setActiveWave = async (
  rerender: ReturnType<typeof render>["rerender"],
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
      expect(commonApiFetchMock).toHaveBeenCalledWith({
        endpoint: `waves/${waveId}`,
      })
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
  waveTypes.clear();
  useRouterMock.mockReturnValue({
    push,
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
    render(
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
      </ViewProvider>
    );
    expect(push).toHaveBeenCalledWith("/");
  });

  it("navigates to home (latest) when Home is clicked", () => {
    render(
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
      </ViewProvider>
    );
    expect(push).toHaveBeenCalledWith("/");
  });

  it("navigates to waves view when no last visited wave", () => {
    render(
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
      </ViewProvider>
    );
    expect(push).toHaveBeenCalledWith("/waves");
    expect(push).toHaveBeenLastCalledWith("/waves");
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

    expect(push).toHaveBeenCalledWith("/messages?wave=dm-wave");
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
});
