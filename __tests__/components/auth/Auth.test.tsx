import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Auth, { useAuth } from "../../../components/auth/Auth";
import { ReactQueryWrapperContext } from "../../../components/react-query-wrapper/ReactQueryWrapper";


// Mock TitleContext
jest.mock('../../../contexts/TitleContext', () => ({
  useTitle: () => ({
    title: 'Test Title',
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

let walletAddress: string | null = "0x1";

jest.mock('../../../components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: () => ({
    address: walletAddress,
    isConnected: !!walletAddress,
    seizeDisconnectAndLogout: jest.fn(),
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({ data: [] })),
}));

jest.mock('../../../services/api/common-api', () => ({
  commonApiFetch: jest.fn(() => Promise.resolve({ id: "1", handle: "user", query: "user" })),
  commonApiPost: jest.fn(() => Promise.resolve({})),
}));

jest.mock('wagmi', () => ({
  useSignMessage: () => ({ signMessageAsync: jest.fn(), isPending: false }),
}));

jest.mock('react-bootstrap', () => ({
  Modal: Object.assign(
    ({ children }: any) => <div>{children}</div>,
    {
      Header: ({ children }: any) => <div>{children}</div>,
      Title: ({ children }: any) => <h4>{children}</h4>,
      Body: ({ children }: any) => <div>{children}</div>,
      Footer: ({ children }: any) => <div>{children}</div>,
    }
  ),
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

jest.mock('react-toastify', () => ({
  ToastContainer: () => null,
  toast: jest.fn(),
  Slide: {},
}));

function ShowWaves() {
  const { showWaves } = useAuth();
  return <span data-testid="waves">{String(showWaves)}</span>;
}

function RequestAuthButton() {
  const { requestAuth } = useAuth();
  return <button onClick={() => requestAuth()} data-testid="req">req</button>;
}

describe("Auth", () => {
  beforeEach(() => {
    walletAddress = "0x1";
  });
  // Title functionality has been moved to TitleContext
  // This test is no longer applicable

  it("returns showWaves true when wallet and profile", async () => {
    render(
      <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
        <Auth>
          <ShowWaves />
        </Auth>
      </ReactQueryWrapperContext.Provider>
    );
    await waitFor(() => expect(screen.getByTestId('waves')).toHaveTextContent('true'));
  });

  it("requestAuth shows error without wallet", async () => {
    walletAddress = null;
    const toast = require("react-toastify").toast;
    const user = userEvent.setup();
    render(
      <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
        <Auth>
          <RequestAuthButton />
        </Auth>
      </ReactQueryWrapperContext.Provider>
    );
    await user.click(screen.getByTestId('req'));
    expect(toast).toHaveBeenCalled();
  });
});
