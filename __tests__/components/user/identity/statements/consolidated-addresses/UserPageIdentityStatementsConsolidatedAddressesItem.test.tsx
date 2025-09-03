import { DELEGATION_ABI } from "@/abis";
import { AuthContext } from "@/components/auth/Auth";
import { PRIMARY_ADDRESS_USE_CASE } from "@/components/delegation/delegation-constants";
import UserPageIdentityStatementsConsolidatedAddressesItem from "@/components/user/identity/statements/consolidated-addresses/UserPageIdentityStatementsConsolidatedAddressesItem";
import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
  NEVER_DATE,
} from "@/constants";
import { act, fireEvent, render, screen } from "@testing-library/react";

jest.useFakeTimers();

const mockCopy = jest.fn();
const mockWrite = jest.fn();

jest.mock("react-use", () => ({
  useCopyToClipboard: () => [null, mockCopy],
}));

jest.mock(
  "@/components/user/identity/statements/consolidated-addresses/UserPageIdentityStatementsConsolidatedAddressesItemPrimary",
  () => ({
    __esModule: true,
    default: ({ assignPrimary }: any) => (
      <button onClick={assignPrimary}>Set Primary</button>
    ),
  })
);

jest.mock("wagmi", () => ({
  useWriteContract: () => ({
    writeContract: mockWrite,
    data: undefined,
    isPending: false,
  }),
  useWaitForTransactionReceipt: () => ({
    isLoading: false,
    data: undefined,
    error: undefined,
  }),
}));

function renderComponent(props: any = {}) {
  const wallet = { wallet: "0x1234567890abcdef", display: "Disp", tdh: 0 };
  return render(
    <AuthContext.Provider value={{ setToast: jest.fn() } as any}>
      <UserPageIdentityStatementsConsolidatedAddressesItem
        address={wallet}
        primaryAddress={null}
        canEdit={false}
        {...props}
      />
    </AuthContext.Provider>
  );
}

describe("UserPageIdentityStatementsConsolidatedAddressesItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).open = jest.fn();
    (window as any).matchMedia = jest.fn().mockReturnValue({
      matches: true,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    });
  });

  it("opens external links", () => {
    renderComponent();
    fireEvent.click(screen.getByRole("button", { name: "Go to Opensea" }));
    expect(window.open).toHaveBeenCalledWith(
      "https://opensea.io/0x1234567890abcdef",
      "_blank"
    );
    fireEvent.click(screen.getByRole("button", { name: "Go to Etherscan" }));
    expect(window.open).toHaveBeenCalledWith(
      "https://etherscan.io/address/0x1234567890abcdef",
      "_blank"
    );
  });

  it("copies address and resets title", () => {
    renderComponent();
    fireEvent.click(screen.getByRole("button", { name: "Copy address" }));
    expect(mockCopy).toHaveBeenCalledWith("0x1234567890abcdef");
    expect(screen.getByText("Copied!")).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.queryByText("Copied!")).not.toBeInTheDocument();
    expect(screen.getByText("0x1234")).toBeInTheDocument();
  });

  it("assigns primary address when clicked", () => {
    renderComponent({ canEdit: true });
    fireEvent.click(screen.getByText("Set Primary"));
    expect(mockWrite).toHaveBeenCalledWith({
      address: DELEGATION_CONTRACT.contract,
      abi: DELEGATION_ABI,
      chainId: DELEGATION_CONTRACT.chain_id,
      functionName: "registerDelegationAddress",
      args: [
        DELEGATION_ALL_ADDRESS,
        "0x1234567890abcdef",
        NEVER_DATE,
        PRIMARY_ADDRESS_USE_CASE.use_case,
        true,
        0,
      ],
    });
  });
});
