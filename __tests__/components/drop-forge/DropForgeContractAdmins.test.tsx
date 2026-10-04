import { fireEvent, render, screen } from "@testing-library/react";
import { mainnet } from "viem/chains";
import DropForgeContractAdmins from "@/components/drop-forge/contract-admins/DropForgeContractAdmins";

const owner = "0x0000000000000000000000000000000000000001";
const admin = "0x0000000000000000000000000000000000000002";
const newAdmin = "0x0000000000000000000000000000000000000003";
let mockCanManage = true;
let mockReadError = false;
let mockActiveWallet = owner;
const mockRefresh = jest.fn();
const mockSubmit = jest.fn();
jest.mock("wagmi", () => ({
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
  useDropForgeMintingConfig: () => ({ contract: owner, chain: mainnet }),
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
  }: {
    id: string;
    onAddressChange: (value: string) => void;
    onValueChange: (value: string) => void;
    disabled: boolean;
    ariaInvalid: boolean;
    ariaDescribedBy: string;
  }) => (
    <input
      id={id}
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
  jest.clearAllMocks();
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
  fireEvent.change(screen.getByLabelText("Admin wallet or ENS"), {
    target: { value: "prxt0.eth" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add Admin" }));
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
  fireEvent.change(screen.getByLabelText("Admin wallet or ENS"), {
    target: { value },
  });
  expect(screen.getByRole("button", { name: "Add Admin" })).toBeDisabled();
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
it("fails closed on read errors and offers a retry", () => {
  mockReadError = true;
  render(<DropForgeContractAdmins />);
  expect(screen.getByRole("alert")).toHaveTextContent("Unable to load");
  expect(screen.getByRole("button", { name: "Add Admin" })).toBeDisabled();
  fireEvent.click(
    screen.getByRole("button", { name: "Refresh contract admins" })
  );
  expect(mockRefresh).toHaveBeenCalledTimes(2);
});
