import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BrowserConnectorPage from "@/components/desktop/BrowserConnectorPage";
import { getSessionNonce } from "@/services/auth/session-v2.utils";

const REQUEST_ID = "abcdefghijklmnopqrstuvwxyz012345";
const ADDRESS = `0x${"a".repeat(40)}`;
let search = new URLSearchParams();
let account: { isConnected: boolean; address?: string } = {
  isConnected: false,
};
const seizeConnect = jest.fn();
const signMessageAsync = jest.fn();
const assign = jest.fn();

jest.mock("next/navigation", () => ({
  useSearchParams: () => search,
}));
jest.mock("wagmi", () => ({
  useAccount: () => account,
  useSignMessage: () => ({ signMessageAsync }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ seizeConnect }),
}));
jest.mock("@/helpers/desktop-navigation", () => ({
  loadDesktopUrlInPlace: (url: string) => assign(url),
}));
jest.mock("@/components/desktop/BrowserWalletRequestPanel", () => ({
  __esModule: true,
  default: ({ hash }: { hash: string }) => (
    <p data-testid="wallet-request-panel">{hash}</p>
  ),
}));
jest.mock("@/services/auth/session-v2.utils", () => ({
  getSessionNonce: jest.fn(),
}));

const validSearch = () =>
  new URLSearchParams({
    scheme: "localcore6529",
    request: REQUEST_ID,
    expires: String(Date.now() + 60_000),
  });

describe("BrowserConnectorPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    search = validSearch();
    account = { isConnected: false };
    jest.mocked(getSessionNonce).mockResolvedValue({
      signable_message: "Sign in to 6529 Desktop",
      server_signature: "0xserver",
    } as never);
    signMessageAsync.mockResolvedValue(`0x${"b".repeat(130)}`);
  });

  it("refuses an invalid link and offers nothing to sign", async () => {
    search = new URLSearchParams({ scheme: "evil", request: REQUEST_ID });
    render(<BrowserConnectorPage />);

    expect(
      await screen.findByText(/not a valid 6529 Desktop sign-in link/)
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("not a valid");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it.each([
    ["localcore6529", "This returns to 6529 Desktop (local build)."],
    ["stagingcore6529", "This returns to 6529 Desktop (staging build)."],
    ["core6529", null],
  ])("says which build a %s link returns to", async (scheme, label) => {
    search = new URLSearchParams({
      scheme,
      request: REQUEST_ID,
      expires: String(Date.now() + 60_000),
    });
    render(<BrowserConnectorPage />);

    await screen.findByRole("button", { name: "Connect wallet" });
    if (label) {
      expect(screen.getByText(label)).toBeInTheDocument();
    } else {
      expect(screen.queryByText(/returns to 6529 Desktop/)).toBeNull();
    }
  });

  it("refuses an expired link", async () => {
    search = new URLSearchParams({
      scheme: "localcore6529",
      request: REQUEST_ID,
      expires: String(Date.now() - 1),
    });
    render(<BrowserConnectorPage />);

    expect(await screen.findByText(/has expired/)).toBeInTheDocument();
  });

  it("asks for a wallet first", async () => {
    const user = userEvent.setup();
    render(<BrowserConnectorPage />);

    await user.click(
      await screen.findByRole("button", { name: "Connect wallet" })
    );
    expect(seizeConnect).toHaveBeenCalled();
  });

  it("signs a desktop challenge and returns to the app with it", async () => {
    const user = userEvent.setup();
    account = { isConnected: true, address: `0x${"A".repeat(40)}` };
    render(<BrowserConnectorPage />);

    await user.click(
      await screen.findByRole("button", {
        name: "Sign and return to 6529 Desktop",
      })
    );

    expect(getSessionNonce).toHaveBeenCalledWith({
      signerAddress: ADDRESS,
      forDesktopSignIn: true,
    });
    expect(signMessageAsync).toHaveBeenCalledWith({
      account: ADDRESS,
      message: "Sign in to 6529 Desktop",
    });
    await waitFor(() => expect(assign).toHaveBeenCalledTimes(1));
    const link = assign.mock.calls[0]?.[0] as string;
    expect(link.startsWith("localcore6529://connector?data=")).toBe(true);
    expect(
      JSON.parse(decodeURIComponent(link.split("data=")[1] ?? ""))
    ).toEqual({
      requestId: REQUEST_ID,
      data: {
        kind: "desktop-sign-in",
        address: ADDRESS,
        server_signature: "0xserver",
        client_signature: `0x${"b".repeat(130)}`,
      },
    });
    expect(
      screen.getByRole("link", { name: "Open 6529 Desktop" })
    ).toHaveAttribute("href", link);
  });

  it.each([
    ["while the challenge loads", "nonce"],
    ["while the wallet signs", "signature"],
  ])(
    "shows the expired state if the request runs out %s",
    async (_name, step) => {
      const user = userEvent.setup();
      account = { isConnected: true, address: ADDRESS };
      const expiresAt = Date.now() + 60_000;
      search = new URLSearchParams({
        scheme: "localcore6529",
        request: REQUEST_ID,
        expires: String(expiresAt),
      });
      const now = jest.spyOn(Date, "now");
      const expire = () => now.mockReturnValue(expiresAt + 1);
      if (step === "nonce") {
        jest.mocked(getSessionNonce).mockImplementationOnce(async () => {
          expire();
          return {
            signable_message: "Sign in to 6529 Desktop",
            server_signature: "0xserver",
          } as never;
        });
      } else {
        signMessageAsync.mockImplementationOnce(async () => {
          expire();
          return `0x${"b".repeat(130)}`;
        });
      }
      try {
        render(<BrowserConnectorPage />);
        await user.click(
          await screen.findByRole("button", {
            name: "Sign and return to 6529 Desktop",
          })
        );

        expect(await screen.findByText(/has expired/)).toBeInTheDocument();
        expect(assign).not.toHaveBeenCalled();
        if (step === "nonce") expect(signMessageAsync).not.toHaveBeenCalled();
      } finally {
        now.mockRestore();
      }
    }
  );

  it("lets the user retry after a rejected signature", async () => {
    const user = userEvent.setup();
    account = { isConnected: true, address: ADDRESS };
    signMessageAsync.mockRejectedValueOnce(new Error("rejected"));
    render(<BrowserConnectorPage />);

    await user.click(
      await screen.findByRole("button", {
        name: "Sign and return to 6529 Desktop",
      })
    );

    expect(await screen.findByText(/was not signed/)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("was not signed");
    expect(assign).not.toHaveBeenCalled();
  });

  describe("wallet requests", () => {
    afterEach(() => {
      globalThis.history.replaceState(null, "", "/");
    });

    it("hands a fragment request to the wallet request panel only", async () => {
      globalThis.history.replaceState(
        null,
        "",
        "/browser-connector#w=abc&s=0x1"
      );
      render(<BrowserConnectorPage />);

      expect(
        await screen.findByTestId("wallet-request-panel")
      ).toHaveTextContent("#w=abc&s=0x1");
      expect(
        screen.queryByRole("button", { name: "Connect wallet" })
      ).toBeNull();
      expect(getSessionNonce).not.toHaveBeenCalled();
    });

    it("keeps the sign-in flow for a fragment without a request", async () => {
      globalThis.history.replaceState(null, "", "/browser-connector#other");
      render(<BrowserConnectorPage />);

      expect(
        await screen.findByRole("button", { name: "Connect wallet" })
      ).toBeInTheDocument();
      expect(screen.queryByTestId("wallet-request-panel")).toBeNull();
    });
  });
});
