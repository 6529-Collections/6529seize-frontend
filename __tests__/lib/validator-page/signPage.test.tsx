import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { recoverTypedDataAddress, type Hex } from "viem";
import { getAccount } from "wagmi/actions";
import ValidatorSignPage from "@/components/validator-page/ValidatorSignPage";
import { grantFixture } from "./grantFixture";

const mockSign = jest.fn();
const mockConnect = jest.fn();
const mockChangeWallet = jest.fn();
const mockWallet = {
  address: grantFixture().message.account,
  isConnected: true,
  connector: { uid: "test-wallet" },
};
let mockSafe = false;

jest.mock("wagmi", () => ({
  useAccount: () => mockWallet,
  useConfig: () => ({}),
  useSignTypedData: () => ({ signTypedDataAsync: mockSign }),
}));
jest.mock("wagmi/actions", () => ({ getAccount: jest.fn(() => mockWallet) }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    seizeConnect: mockConnect,
    seizeConnectFresh: mockChangeWallet,
    isSafeWallet: mockSafe,
  }),
}));
jest.mock("viem", () => ({
  ...jest.requireActual("viem"),
  recoverTypedDataAddress: jest.fn(),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

const signature: Hex = `0x${"12".repeat(64)}1b`;
async function loadGrant(data = grantFixture()) {
  fireEvent.click(screen.getByText("Or paste the file contents"));
  fireEvent.change(screen.getByLabelText("Contents of grant.json"), {
    target: { value: JSON.stringify(data) },
  });
  fireEvent.click(screen.getByRole("button", { name: "Review authorization" }));
  await screen.findByRole("heading", {
    name: "2. Check the wallet and validator keys",
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockWallet.address = grantFixture().message.account;
  mockWallet.isConnected = true;
  mockSafe = false;
  jest
    .mocked(getAccount)
    .mockImplementation(() => mockWallet as ReturnType<typeof getAccount>);
  jest
    .mocked(recoverTypedDataAddress)
    .mockResolvedValue(mockWallet.address as Hex);
  mockSign.mockResolvedValue(signature);
});

it("requires review, connects the expected address, and returns a verified signature", async () => {
  render(<ValidatorSignPage />);
  await loadGrant();
  const button = screen.getByRole("button", { name: "Sign authorization" });
  expect(button).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox"));
  expect(button).toBeEnabled();
  fireEvent.click(button);
  await screen.findByLabelText("Signature");
  expect(mockSign).toHaveBeenCalledTimes(1);
  expect(mockSign).toHaveBeenCalledWith(
    expect.objectContaining({ account: mockWallet.address })
  );
  expect(recoverTypedDataAddress).toHaveBeenCalledWith(
    expect.objectContaining({ signature })
  );
  expect(screen.getByLabelText("Signature")).toHaveValue(signature);
  expect(
    screen.getByText(/not authorized until you submit/)
  ).toBeInTheDocument();
});

it("blocks the wrong connected wallet and offers a switch", async () => {
  mockWallet.address = "0x0000000000000000000000000000000000000002";
  render(<ValidatorSignPage />);
  await loadGrant();
  fireEvent.click(screen.getByRole("checkbox"));
  expect(
    screen.getByRole("button", { name: "Sign authorization" })
  ).toBeDisabled();
  expect(screen.getByRole("alert")).toHaveTextContent("does not match");
  fireEvent.click(screen.getByRole("button", { name: "Change wallet" }));
  await waitFor(() => expect(mockChangeWallet).toHaveBeenCalled());
  expect(mockSign).not.toHaveBeenCalled();
});

it("rechecks the live wallet immediately before requesting a signature", async () => {
  render(<ValidatorSignPage />);
  await loadGrant();
  fireEvent.click(screen.getByRole("checkbox"));
  jest.mocked(getAccount).mockReturnValue({
    ...mockWallet,
    address: "0x0000000000000000000000000000000000000002",
  } as ReturnType<typeof getAccount>);
  fireEvent.click(screen.getByRole("button", { name: "Sign authorization" }));
  await screen.findByRole("alert");
  expect(mockSign).not.toHaveBeenCalled();
});

it.each([
  ["disconnection", { isConnected: false }],
  ["address change", { address: "0x0000000000000000000000000000000000000002" }],
  ["connector change", { connector: { uid: "another-wallet" } }],
] as const)(
  "discards a response after %s while the request is pending",
  async (_name, change) => {
    let finish: ((value: Hex) => void) | undefined;
    mockSign.mockImplementation(
      () =>
        new Promise<Hex>((resolve) => {
          finish = resolve;
        })
    );
    render(<ValidatorSignPage />);
    await loadGrant();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Sign authorization" }));
    await screen.findByRole("button", { name: "Confirm in your wallet…" });
    expect(
      screen.getByRole("button", { name: "Use a different message" })
    ).toBeDisabled();
    jest
      .mocked(getAccount)
      .mockReturnValue({ ...mockWallet, ...change } as ReturnType<
        typeof getAccount
      >);
    await act(async () => finish?.(signature));
    expect(screen.getByRole("alert")).toHaveTextContent("connection changed");
    expect(screen.queryByLabelText("Signature")).not.toBeInTheDocument();
  }
);

it.each(["wrong signer", "malformed signature", "rejected"])(
  "does not expose a signature after %s",
  async (failure) => {
    if (failure === "wrong signer")
      jest
        .mocked(recoverTypedDataAddress)
        .mockResolvedValue("0x0000000000000000000000000000000000000002");
    if (failure === "malformed signature") mockSign.mockResolvedValue("0x12");
    if (failure === "rejected") mockSign.mockRejectedValue({ code: 4001 });
    render(<ValidatorSignPage />);
    await loadGrant();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Sign authorization" }));
    await screen.findByRole("alert");
    expect(screen.queryByLabelText("Signature")).not.toBeInTheDocument();
  }
);

it("requires explicit revocation confirmation for an empty key list", async () => {
  render(<ValidatorSignPage />);
  const data = grantFixture();
  data.message.keys = [];
  await loadGrant(data);
  expect(screen.getByRole("alert")).toHaveTextContent("revokes");
  expect(screen.getByRole("checkbox")).toHaveAccessibleName(/intend to revoke/);
  expect(
    screen.getByRole("button", { name: "Sign revocation" })
  ).toBeDisabled();
});

it("clears the previous grant and signature when loading another message", async () => {
  render(<ValidatorSignPage />);
  await loadGrant();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Sign authorization" }));
  await screen.findByLabelText("Signature");
  fireEvent.click(
    screen.getByRole("button", { name: "Use a different message" })
  );
  expect(screen.queryByLabelText("Signature")).not.toBeInTheDocument();
  await loadGrant();
  expect(screen.getByRole("checkbox")).not.toBeChecked();
});

it("blocks unsupported contract wallets", async () => {
  mockSafe = true;
  render(<ValidatorSignPage />);
  await loadGrant();
  fireEvent.click(screen.getByRole("checkbox"));
  expect(
    screen.getByRole("button", { name: "Sign authorization" })
  ).toBeDisabled();
  expect(mockSign).not.toHaveBeenCalled();
});

it("shows protocol-relative shares instead of treating 10000 as a denominator", async () => {
  render(<ValidatorSignPage />);
  const data = grantFixture();
  data.message.keys = [
    { pubkey: `0x${"ab".repeat(48)}`, share: "1" },
    { pubkey: `0x${"cd".repeat(48)}`, share: "1" },
  ];
  await loadGrant(data);
  expect(
    screen.getAllByText("50% of the account’s signing weight")
  ).toHaveLength(2);
});

it("can retry the same file after a read failure", async () => {
  const user = userEvent.setup();
  const file = new File([JSON.stringify(grantFixture())], "grant.json", {
    type: "application/json",
  });
  const read = jest
    .fn()
    .mockRejectedValueOnce(new Error("Temporary read failure"))
    .mockResolvedValueOnce(JSON.stringify(grantFixture()));
  Object.defineProperty(file, "text", { value: read });
  render(<ValidatorSignPage />);
  const input = screen.getByLabelText<HTMLInputElement>("Choose grant.json");
  await user.upload(input, file);
  await screen.findByRole("alert");
  expect(input.value).toBe("");
  await user.upload(input, file);
  await screen.findByRole("heading", {
    name: "2. Check the wallet and validator keys",
  });
  expect(read).toHaveBeenCalledTimes(2);
});
