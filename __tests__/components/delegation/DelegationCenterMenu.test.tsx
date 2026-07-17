import { DelegationCenterSection } from "@/types/enums";
import { fireEvent, render, screen } from "@testing-library/react";
import { type ComponentProps } from "react";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: ComponentProps<"img">) => <img {...props} />,
}));

jest.mock("@/components/delegation/DelegationCenter", () => () => (
  <div data-testid="center" />
));
jest.mock("@/components/delegation/walletChecker/WalletChecker", () => () => (
  <div />
));
jest.mock("@/components/delegation/NewDelegation", () => () => <div />);
jest.mock("@/components/delegation/NewSubDelegation", () => () => <div />);
jest.mock("@/components/delegation/NewConsolidation", () => () => <div />);
jest.mock("@/components/delegation/NewAssignPrimaryAddress", () => () => (
  <div />
));
jest.mock("@/components/delegation/CollectionDelegation", () => () => <div />);
jest.mock("@/components/delegation/html/DelegationHTML", () => () => <div />);

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: "0xabc" }),
}));

jest.mock("wagmi", () => ({ useEnsName: () => ({ data: "ens" }) }));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ asPath: "/delegation" }),
  usePathname: () => "/delegation",
}));

const props = {
  section: DelegationCenterSection.CENTER,
  path: [],
  setActiveSection: jest.fn(),
  address_query: "",
  setAddressQuery: jest.fn(),
  collection_query: "",
  setCollectionQuery: jest.fn(),
  use_case_query: 0,
  setUseCaseQuery: jest.fn(),
};

describe("DelegationCenterMenu links", () => {
  it("renders resource links", async () => {
    const mod = await import("@/components/delegation/DelegationCenterMenu");
    const DelegationCenterMenu = mod.default;
    render(<DelegationCenterMenu {...props} />);
    const etherscan = screen
      .getAllByText("Etherscan")[0]
      ?.closest("a") as HTMLAnchorElement;
    expect(etherscan?.href).toContain("etherscan.io/address");
    const github = screen.getAllByText("GitHub")[0]?.closest("a");
    expect(github).toHaveAttribute(
      "href",
      "https://github.com/6529-Collections/nftdelegation"
    );
  });

  it("changes section on wallet checker click", async () => {
    const mod = await import("@/components/delegation/DelegationCenterMenu");
    const DelegationCenterMenu = mod.default;
    render(<DelegationCenterMenu {...props} />);
    fireEvent.click(screen.getAllByText("Wallet Checker")[0]);
    expect(props.setActiveSection).toHaveBeenCalledWith(
      DelegationCenterSection.CHECKER
    );
  });

  it.each([
    DelegationCenterSection.REGISTER_DELEGATION,
    DelegationCenterSection.REGISTER_SUB_DELEGATION,
    DelegationCenterSection.REGISTER_CONSOLIDATION,
    DelegationCenterSection.ASSIGN_PRIMARY_ADDRESS,
  ])("hides navigation on focused action route %s", async (section) => {
    const mod = await import("@/components/delegation/DelegationCenterMenu");
    const DelegationCenterMenu = mod.default;

    render(<DelegationCenterMenu {...props} section={section} />);

    expect(
      screen.queryByRole("navigation", { name: "Delegation center" })
    ).not.toBeInTheDocument();
  });

  it("renders toast text without interpreting it as html", async () => {
    const mod = await import("@/components/delegation/DelegationToast");
    const { DelegationToast } = mod;

    render(
      <DelegationToast
        toast={{
          status: "error",
          title: "Wallet Error",
          message: '<img src="x" onerror="alert(1)" />',
        }}
        showToast={true}
        setShowToast={jest.fn()}
      />
    );

    expect(
      screen.getByDisplayValue('<img src="x" onerror="alert(1)" />')
    ).toBeInTheDocument();
    expect(document.querySelector('img[src="x"]')).toBeNull();
  });

  it("portals delegation notifications into a viewport-fixed dialog", async () => {
    const mod = await import("@/components/delegation/DelegationToast");
    const { DelegationToast } = mod;

    render(
      <div style={{ transform: "translateZ(0)" }}>
        <DelegationToast
          toast={{
            status: "success",
            title: "Viewport Notice",
            message: "Visible without scrolling",
            transactionHash: "0xabc",
          }}
          showToast={true}
          setShowToast={jest.fn()}
        />
      </div>
    );

    const dialog = screen.getByRole("dialog", { name: "Viewport Notice" });
    expect(dialog.parentElement?.parentElement).toBe(document.body);
    expect(dialog.parentElement).toHaveClass("tw-fixed", "tw-inset-0");
    expect(screen.getByRole("link", { name: "View Tx" })).toHaveAttribute(
      "href",
      expect.stringContaining("etherscan.io/tx/0xabc")
    );
  });

  it("reopens shared delegation toasts after a dismiss", async () => {
    const mod = await import("@/components/delegation/DelegationToast");
    const { DelegationToast, useDelegationToast } = mod;

    function ToastHarness() {
      const toastState = useDelegationToast();

      return (
        <div>
          <button
            type="button"
            onClick={() =>
              toastState.showDelegationToast({
                status: "success",
                title: "First Toast",
                message: "First body",
              })
            }
          >
            Show first
          </button>
          <button
            type="button"
            onClick={() => toastState.setToastVisibility(false)}
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() =>
              toastState.showDelegationToast({
                status: "success",
                title: "Second Toast",
                message: "Second body",
              })
            }
          >
            Show second
          </button>
          {toastState.toast && (
            <DelegationToast
              toast={toastState.toast}
              showToast={toastState.showToast}
              setShowToast={toastState.setToastVisibility}
            />
          )}
        </div>
      );
    }

    render(<ToastHarness />);

    fireEvent.click(screen.getByText("Show first"));
    expect(screen.getByText("First Toast")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Dismiss"));
    expect(screen.queryByText("First Toast")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Show second"));
    expect(screen.getByText("Second Toast")).toBeInTheDocument();
  });
});
