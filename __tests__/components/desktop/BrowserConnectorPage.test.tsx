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

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "not a valid 6529 Desktop sign-in link"
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("refuses an expired link", async () => {
    search = new URLSearchParams({
      scheme: "localcore6529",
      request: REQUEST_ID,
      expires: String(Date.now() - 1),
    });
    render(<BrowserConnectorPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("expired");
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

    expect(await screen.findByRole("alert")).toHaveTextContent("not signed");
    expect(assign).not.toHaveBeenCalled();
  });
});
