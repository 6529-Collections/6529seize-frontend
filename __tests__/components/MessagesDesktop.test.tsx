import { createMockApiWave } from "@/__tests__/utils/mockFactories";
import { createMockAuthContext } from "@/__tests__/utils/testContexts";
import { AuthContext } from "@/components/auth/Auth";
import MessagesDesktopWithProvider from "@/components/messages/MessagesDesktop";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ReactQueryWrapperContextType } from "@/components/react-query-wrapper/ReactQueryWrapperContext";
import WaveHeaderOptions from "@/components/waves/header/options/WaveHeaderOptions";
import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiDelete } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

jest.mock("@/services/api/common-api", () => ({
  commonApiDelete: jest.fn(),
}));

const mockRouter = {
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
  push: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
};

jest.mock("@/components/brain/ContentTabContext", () => ({
  ContentTabProvider: ({ children }: { readonly children: ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock("@/components/shared/WavesMessagesWrapper", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: ReactNode }) => (
    <div data-testid="messages-wrapper">{children}</div>
  ),
}));

jest.mock("@/hooks/useIsMobileLayoutViewport", () => ({
  __esModule: true,
  default: () => false,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

const commonApiDeleteMock = jest.mocked(commonApiDelete);
const wave = createMockApiWave({
  id: "dm-wave",
  chat: {
    scope: { group: { is_direct_message: true } },
  } as ApiWave["chat"],
});

describe("MessagesDesktop", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    commonApiDeleteMock.mockResolvedValue(undefined);
  });

  it("provides a reusable deletion flow to message sidebar actions", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const authContext = createMockAuthContext({
      requestAuth: jest.fn().mockResolvedValue({ success: true }),
    });
    const reactQueryContext = {
      invalidateDrops: jest.fn(),
      onWaveCreated: jest.fn(),
    } as unknown as ReactQueryWrapperContextType;

    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authContext}>
          <ReactQueryWrapperContext.Provider value={reactQueryContext}>
            <MessagesDesktopWithProvider>
              <WaveHeaderOptions wave={wave} showOwnerActions />
            </MessagesDesktopWithProvider>
          </ReactQueryWrapperContext.Provider>
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    expect(screen.getByTestId("messages-wrapper")).toBeInTheDocument();

    const openOptions = screen.getByRole("button", { name: "Open options" });
    await user.click(openOptions);
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));

    expect(
      screen.getByRole("dialog", { name: "Delete wave" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("dialog", { name: "Delete wave" })
    ).not.toBeInTheDocument();

    await user.click(openOptions);
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));

    expect(
      screen.getByRole("dialog", { name: "Delete wave" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(commonApiDeleteMock).toHaveBeenCalledWith({
        endpoint: "waves/dm-wave",
        errorMode: "structured",
      });
      expect(commonApiDeleteMock).toHaveBeenCalledTimes(1);
      expect(reactQueryContext.invalidateDrops).toHaveBeenCalled();
      expect(reactQueryContext.onWaveCreated).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith("/messages");
    });

    expect(
      (reactQueryContext.invalidateDrops as jest.Mock).mock
        .invocationCallOrder[0]
    ).toBeLessThan(mockRouter.push.mock.invocationCallOrder[0]!);
    expect(
      (reactQueryContext.onWaveCreated as jest.Mock).mock.invocationCallOrder[0]
    ).toBeLessThan(mockRouter.push.mock.invocationCallOrder[0]!);
  });
});
