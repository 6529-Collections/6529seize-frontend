import { fireEvent, render, screen } from "@testing-library/react";
import { mainnet } from "viem/chains";
import DropForgeContractAdmins from "@/components/drop-forge/contract-admins/DropForgeContractAdmins";

const owner = "0x0000000000000000000000000000000000000001";
const alice = "0x0000000000000000000000000000000000000003";
const bob = "0x0000000000000000000000000000000000000004";
let mockBobState: "resolved" | "pending" | "error" | "missing" = "resolved";
const mockSubmit = jest.fn();
const mockEnsAddress = jest.fn();
const mockEnsName = jest.fn();

jest.mock("wagmi", () => ({
  useReadContract: ({ functionName }: { functionName: string }) => ({
    data: functionName === "owner" ? owner : [],
    isError: false,
    isFetching: false,
    refetch: jest.fn(),
  }),
  useEnsName: () => mockEnsName(),
  useEnsAddress: (parameters: { name?: string; chainId: number }) =>
    mockEnsAddress(parameters),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: owner }),
}));
jest.mock("@/hooks/useDropForgePermissions", () => ({
  useDropForgePermissions: () => ({ canManageContractAdmins: true }),
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

beforeEach(() => {
  jest.clearAllMocks();
  mockBobState = "resolved";
  mockEnsName.mockReturnValue({ data: null, isLoading: false });
  mockEnsAddress.mockImplementation(({ name }: { name?: string }) => {
    if (name === "alice.eth")
      return { data: alice, isLoading: false, isError: false };
    if (name === "bob.eth")
      return {
        data: mockBobState === "resolved" ? bob : null,
        isLoading: mockBobState === "pending",
        isError: mockBobState === "error",
      };
    return { data: null, isLoading: false, isError: false };
  });
});

function openAddForm() {
  fireEvent.click(screen.getByRole("button", { name: "Add Admin" }));
  return screen.getByLabelText("Admin wallet or ENS");
}

it("re-resolves an edited ENS prefix through the real input before reviewing or signing", () => {
  render(<DropForgeContractAdmins />);
  const input = openAddForm();
  fireEvent.change(input, { target: { value: "alice.eth" } });
  expect(input).toHaveValue(`alice.eth - ${alice}`);
  fireEvent.change(input, { target: { value: `bob.eth - ${alice}` } });
  expect(mockEnsAddress).toHaveBeenCalledWith({ name: "bob.eth", chainId: 1 });
  expect(input).toHaveValue(`bob.eth - ${bob}`);
  fireEvent.click(screen.getByRole("button", { name: "Review Admin" }));
  expect(screen.getByRole("dialog")).toHaveTextContent(bob);
  expect(screen.getByRole("dialog")).not.toHaveTextContent(alice);
  fireEvent.click(screen.getByRole("button", { name: "Confirm Add Admin" }));
  expect(mockSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ address: bob })
  );
});

it.each(["pending", "error", "missing"] as const)(
  "does not trust a prior wallet suffix when the new name is %s",
  (state) => {
    render(<DropForgeContractAdmins />);
    const input = openAddForm();
    fireEvent.change(input, { target: { value: "alice.eth" } });
    mockBobState = state;
    fireEvent.change(input, { target: { value: `bob.eth - ${alice}` } });
    expect(screen.getByRole("button", { name: "Review Admin" })).toBeDisabled();
    fireEvent.submit(input.closest("form")!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
    if (state === "error") {
      expect(screen.getByRole("alert")).toHaveTextContent("Unable to resolve");
    }
  }
);

it("verifies pasted labels and ignores a manually edited wallet suffix", () => {
  render(<DropForgeContractAdmins />);
  const input = openAddForm();
  fireEvent.change(input, { target: { value: `bob.eth - ${alice}` } });
  expect(input).toHaveValue(`bob.eth - ${bob}`);
  fireEvent.change(input, { target: { value: `bob.eth - ${owner}` } });
  expect(input).toHaveValue(`bob.eth - ${bob}`);
  fireEvent.click(screen.getByRole("button", { name: "Review Admin" }));
  expect(screen.getByRole("dialog")).toHaveTextContent(bob);
});

it("does not accept an invalid name plus a valid address suffix", () => {
  render(<DropForgeContractAdmins />);
  const input = openAddForm();
  fireEvent.change(input, { target: { value: `not-a-name - ${alice}` } });
  expect(screen.getByRole("button", { name: "Review Admin" })).toBeDisabled();
});

it("still accepts a plain wallet address after an ENS lookup failure", () => {
  mockBobState = "error";
  render(<DropForgeContractAdmins />);
  const input = openAddForm();
  fireEvent.change(input, { target: { value: `bob.eth - ${alice}` } });
  expect(screen.getByRole("button", { name: "Review Admin" })).toBeDisabled();
  fireEvent.change(input, { target: { value: alice } });
  expect(screen.getByRole("button", { name: "Review Admin" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Review Admin" }));
  expect(screen.getByRole("dialog")).toHaveTextContent(alice);
});

it("keeps literal wallet input usable without requiring an ENS lookup", () => {
  mockEnsName.mockReturnValue({ data: "alice.eth", isLoading: false });
  mockEnsAddress.mockReturnValue({
    data: null,
    isLoading: false,
    isError: true,
  });
  render(<DropForgeContractAdmins />);
  const input = openAddForm();
  fireEvent.change(input, { target: { value: alice } });
  expect(input).toHaveValue(alice);
  expect(screen.getByRole("button", { name: "Review Admin" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Review Admin" }));
  expect(screen.getByRole("dialog")).toHaveTextContent(alice);
});

it("invalidates an unconfirmed operation when input changes", () => {
  render(<DropForgeContractAdmins />);
  const input = openAddForm();
  fireEvent.change(input, { target: { value: "alice.eth" } });
  fireEvent.click(screen.getByRole("button", { name: "Review Admin" }));
  expect(screen.getByRole("dialog")).toHaveTextContent(alice);
  // Exercise context invalidation even if an input update arrives while disabled.
  fireEvent.change(input, { target: { value: `bob.eth - ${alice}` } });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(mockSubmit).not.toHaveBeenCalled();
});
