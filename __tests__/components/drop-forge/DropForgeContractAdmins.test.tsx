import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { mainnet, sepolia } from "viem/chains";
import DropForgeContractAdmins from "@/components/drop-forge/contract-admins/DropForgeContractAdmins";

const owner = "0x0000000000000000000000000000000000000001";
const admin = "0x0000000000000000000000000000000000000002";
const newAdmin = "0x0000000000000000000000000000000000000003";
let mockCanManage = true;
let mockReadError = false;
let mockActiveWallet = owner;
let mockChain = mainnet as typeof mainnet | typeof sepolia;
const mockEnsName = jest.fn();
const mockRefresh = jest.fn();
const mockSubmit = jest.fn();
jest.mock("wagmi", () => ({
  useEnsName: (parameters: unknown) => mockEnsName(parameters),
  useReadContract: ({ functionName }: { functionName: string }) => ({
    data: functionName === "owner" ? owner : [admin, owner, admin],
    isError: mockReadError,
    refetch: mockRefresh,
    isFetching: false,
  }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: mockActiveWallet }),
}));
jest.mock("@/hooks/useDropForgePermissions", () => ({
  useDropForgePermissions: () => ({ canManageContractAdmins: mockCanManage }),
}));
jest.mock("@/components/drop-forge/drop-forge-config", () => ({
  useDropForgeMintingConfig: () => ({ contract: owner, chain: mockChain }),
}));
jest.mock(
  "@/components/drop-forge/contract-admins/useContractAdminTransaction",
  () => ({
    useContractAdminTransaction: () => ({
      transaction: null,
      busy: false,
      submit: mockSubmit,
      closeTransaction: jest.fn(),
    }),
  })
);
jest.mock("@/components/common/OnchainTransactionModal", () => ({
  __esModule: true,
  default: ({
    title,
    subtitle,
    pendingContent,
  }: {
    title: string;
    subtitle: React.ReactNode;
    pendingContent: React.ReactNode;
  }) => (
    <div role="dialog" aria-label={title}>
      {subtitle}
      {pendingContent}
    </div>
  ),
}));
jest.mock("@/components/utils/input/ens-address/EnsAddressInput", () => ({
  __esModule: true,
  default: ({
    id,
    onAddressChange,
    onValueChange,
    disabled,
    ariaInvalid,
    ariaDescribedBy,
    value,
  }: {
    id: string;
    onAddressChange: (value: string) => void;
    onValueChange: (value: string) => void;
    disabled: boolean;
    ariaInvalid: boolean;
    ariaDescribedBy: string;
    value: string;
  }) => (
    <input
      id={id}
      value={value}
      disabled={disabled}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      onChange={(event) => {
        onValueChange(event.target.value);
        onAddressChange(
          event.target.value === "prxt0.eth" ? newAdmin : event.target.value
        );
      }}
    />
  ),
}));

beforeEach(() => {
  mockCanManage = true;
  mockReadError = false;
  mockActiveWallet = owner;
  mockChain = mainnet;
  jest.clearAllMocks();
  mockRefresh.mockReset().mockResolvedValue(undefined);
  mockEnsName.mockReset().mockReturnValue({ data: null });
});
afterEach(() => {
  jest.useRealTimers();
});
it("lists the owner first exactly once and never offers owner revocation", () => {
  render(<DropForgeContractAdmins />);
  const rows = screen.getAllByRole("listitem");
  expect(rows).toHaveLength(2);
  expect(rows[0]).toHaveTextContent(owner);
  expect(rows[0]).toHaveTextContent("Owner");
  expect(
    screen.queryByRole("button", { name: `Revoke admin ${owner}` })
  ).not.toBeInTheDocument();
});
it("keeps the list read-only for distribution or onchain-only admins", () => {
  mockCanManage = false;
  render(<DropForgeContractAdmins />);
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(
    screen.queryByRole("button", { name: "Add Admin" })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /^Revoke admin/ })
  ).not.toBeInTheDocument();
});
it("confirms the exact resolved ENS address before submission", () => {
  render(<DropForgeContractAdmins />);
  fireEvent.click(screen.getByRole("button", { name: "Add Admin" }));
  fireEvent.change(screen.getByLabelText("Admin wallet or ENS"), {
    target: { value: "prxt0.eth" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Review Admin" }));
  expect(mockSubmit).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog")).toHaveTextContent(newAdmin);
  fireEvent.click(screen.getByRole("button", { name: "Confirm Add Admin" }));
  expect(mockSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ functionName: "approveAdmin", address: newAdmin })
  );
});
it("requires confirmation to revoke an existing admin", () => {
  render(<DropForgeContractAdmins />);
  fireEvent.click(
    screen.getByRole("button", { name: `Revoke admin ${admin}` })
  );
  expect(mockSubmit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirm Revoke" }));
  expect(mockSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ functionName: "revokeAdmin", address: admin })
  );
  // A connection request has not started signing yet; keep review cancellable.
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: `Revoke admin ${admin}` })
  ).toBeDisabled();
});

it("cancels the pre-sign review without submitting a transaction", () => {
  render(<DropForgeContractAdmins />);
  fireEvent.click(
    screen.getByRole("button", { name: `Revoke admin ${admin}` })
  );
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(mockSubmit).not.toHaveBeenCalled();
});
it.each([
  owner,
  admin,
  "invalid.eth",
  "0x0000000000000000000000000000000000000000",
])("disables adding %s", (value) => {
  render(<DropForgeContractAdmins />);
  fireEvent.click(screen.getByRole("button", { name: "Add Admin" }));
  fireEvent.change(screen.getByLabelText("Admin wallet or ENS"), {
    target: { value },
  });
  expect(screen.getByRole("button", { name: "Review Admin" })).toBeDisabled();
  const field = screen.getByLabelText("Admin wallet or ENS");
  expect(field).toHaveAttribute("aria-invalid", "true");
  expect(field).toHaveAccessibleDescription(
    screen.getByRole("alert").textContent ?? ""
  );
});

it("warns a configured non-owner before signing without hiding testing controls", () => {
  mockActiveWallet = admin;
  render(<DropForgeContractAdmins />);
  fireEvent.click(
    screen.getByRole("button", { name: `Revoke admin ${admin}` })
  );
  expect(screen.getByRole("dialog")).toHaveTextContent(
    "This wallet is not the owner. This transaction is expected to fail."
  );
  fireEvent.click(screen.getByRole("button", { name: "Confirm Revoke" }));
  expect(mockSubmit).toHaveBeenCalled();
});
it("fails closed on read errors and offers a retry", async () => {
  jest.useFakeTimers();
  mockReadError = true;
  render(<DropForgeContractAdmins />);
  expect(screen.getByRole("alert")).toHaveTextContent("Unable to load");
  expect(screen.getByRole("button", { name: "Add Admin" })).toBeDisabled();
  fireEvent.click(
    screen.getByRole("button", { name: "Refresh contract admins" })
  );
  expect(mockRefresh).toHaveBeenCalledTimes(2);
  await act(() => jest.advanceTimersByTimeAsync(1500));
});

it("unfolds the add form above the list and resets it on cancel", () => {
  render(<DropForgeContractAdmins />);
  const add = screen.getByRole("button", { name: "Add Admin" });
  expect(add).toHaveAttribute("aria-expanded", "false");
  expect(
    screen.queryByLabelText("Admin wallet or ENS")
  ).not.toBeInTheDocument();
  fireEvent.click(add);
  expect(add).toHaveAttribute("aria-expanded", "true");
  const input = screen.getByLabelText("Admin wallet or ENS");
  expect(
    input.compareDocumentPosition(screen.getByRole("list")) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  fireEvent.change(input, { target: { value: "prxt0.eth" } });
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(add).toHaveFocus();
  expect(add).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(add);
  expect(screen.getByLabelText("Admin wallet or ENS")).toHaveValue("");
  expect(screen.getByRole("button", { name: "Review Admin" })).toBeDisabled();
});

it("puts role pills above the ENS/address line without replacing wallet addresses", () => {
  mockChain = sepolia;
  mockEnsName.mockImplementation(({ address }: { address: string }) => ({
    data: address === owner ? "deployer2.6529.eth" : "prxt0.eth",
  }));
  render(<DropForgeContractAdmins />);
  const rows = screen.getAllByRole("listitem");
  expect(rows[0]).toHaveTextContent("deployer2.6529.eth");
  expect(rows[0]).toHaveTextContent(owner);
  expect(within(rows[0]!).getByText("Owner")).toHaveClass("tw-rounded-full");
  expect(rows[1]).toHaveTextContent("prxt0.eth");
  expect(rows[1]).toHaveTextContent(admin);
  expect(within(rows[1]!).getByText("Admin")).toHaveClass("tw-rounded-full");
  expect(mockEnsName).toHaveBeenCalledWith({ address: owner, chainId: 1 });
  expect(mockEnsName).toHaveBeenCalledWith({ address: admin, chainId: 1 });
  for (const row of rows) {
    const pill = within(row).getByText(/^(Owner|Admin)$/);
    const identity = row.querySelector("p")!;
    expect(pill.parentElement?.nextElementSibling).toBe(identity);
    expect(identity.querySelector("strong")).toHaveTextContent(/\.eth -$/);
    expect(identity.querySelector("span")).toHaveTextContent(/^0x/);
    expect(identity).toHaveClass("[overflow-wrap:anywhere]");
  }
});

it.each([
  [mainnet, "https://etherscan.io"],
  [sepolia, "https://sepolia.etherscan.io"],
] as const)(
  "links the creator contract to its %s explorer",
  (chain, explorer) => {
    mockChain = chain;
    render(<DropForgeContractAdmins />);
    const contractLink = screen.getByRole("link", { name: owner });
    expect(contractLink).toHaveAttribute(
      "href",
      `${explorer}/address/${owner}`
    );
    expect(contractLink).toHaveAttribute("target", "_blank");
    expect(contractLink).toHaveAttribute("rel", "noopener noreferrer");
  }
);

it("keeps admin controls scoped and consistently sized, including the refresh icon", () => {
  render(<DropForgeContractAdmins />);
  const add = screen.getByRole("button", { name: "Add Admin" });
  expect(add.closest("section")).toHaveClass("tailwind-scope");
  const refresh = screen.getByRole("button", {
    name: "Refresh contract admins",
  });
  const revoke = screen.getByRole("button", { name: `Revoke admin ${admin}` });
  fireEvent.click(add);
  const review = screen.getByRole("button", { name: "Review Admin" });
  const cancel = screen.getByRole("button", { name: "Cancel" });
  for (const control of [add, refresh, revoke, review, cancel]) {
    expect(control).toHaveClass("tw-h-10", "tw-text-sm");
  }
  expect(refresh).toHaveClass("tw-w-10", "!tw-px-0");
  expect(revoke).toHaveClass("tw-w-10", "!tw-px-0");
  expect(refresh.querySelector("svg")).toHaveClass("tw-size-5");
});

it.each([
  { data: null, isLoading: true },
  { data: null, isError: true },
  { data: null },
])("keeps full addresses and roles when ENS is unavailable: %s", (result) => {
  mockEnsName.mockReturnValue(result);
  render(<DropForgeContractAdmins />);
  const rows = screen.getAllByRole("listitem");
  expect(rows[0]).toHaveTextContent(owner);
  expect(rows[0]).toHaveTextContent("Owner");
  expect(rows[1]).toHaveTextContent(admin);
  expect(
    screen.getByRole("button", { name: `Revoke admin ${admin}` })
  ).toBeEnabled();
});

it("keeps refresh busy for at least 1.5 seconds, including very fast reads", async () => {
  jest.useFakeTimers();
  render(<DropForgeContractAdmins />);
  const refresh = screen.getByRole("button", {
    name: "Refresh contract admins",
  });
  fireEvent.click(refresh);
  expect(refresh).toHaveAttribute("aria-busy", "true");
  expect(refresh).toBeDisabled();
  expect(
    within(refresh).getByRole("status", { hidden: true })
  ).toBeInTheDocument();
  fireEvent.click(refresh);
  expect(mockRefresh).toHaveBeenCalledTimes(2);
  await act(() => jest.advanceTimersByTimeAsync(1499));
  expect(refresh).toBeDisabled();
  await act(() => jest.advanceTimersByTimeAsync(1));
  expect(refresh).toBeEnabled();
  expect(refresh).not.toHaveAttribute("aria-busy", "true");
});

it("keeps refresh busy until both slow reads settle, including a failed read", async () => {
  jest.useFakeTimers();
  let finishOwner!: () => void;
  let failAdmins!: (error: Error) => void;
  mockRefresh
    .mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishOwner = resolve;
        })
    )
    .mockImplementationOnce(
      () =>
        new Promise<void>((_, reject) => {
          failAdmins = reject;
        })
    );
  render(<DropForgeContractAdmins />);
  const refresh = screen.getByRole("button", {
    name: "Refresh contract admins",
  });
  fireEvent.click(refresh);
  await act(() => jest.advanceTimersByTimeAsync(1500));
  expect(refresh).toBeDisabled();
  await act(async () => {
    finishOwner();
  });
  expect(refresh).toBeDisabled();
  await act(async () => {
    failAdmins(new Error("RPC unavailable"));
  });
  expect(refresh).toBeEnabled();
});

it("uses app tooltips instead of native titles for refresh and revoke", async () => {
  jest.useFakeTimers();
  render(<DropForgeContractAdmins />);
  const refresh = screen.getByRole("button", {
    name: "Refresh contract admins",
  });
  const revoke = screen.getByRole("button", { name: `Revoke admin ${admin}` });
  expect(refresh).not.toHaveAttribute("title");
  expect(revoke).not.toHaveAttribute("title");
  fireEvent.focus(revoke);
  await act(() => jest.advanceTimersByTimeAsync(750));
  expect(screen.getByRole("tooltip")).toHaveTextContent("Revoke admin");
  expect(revoke).toHaveAccessibleDescription("Revoke admin");
  fireEvent.blur(revoke);
  fireEvent.mouseEnter(refresh);
  await act(() => jest.advanceTimersByTimeAsync(750));
  expect(screen.getByRole("tooltip")).toHaveTextContent(
    "Refresh contract admins"
  );
});
