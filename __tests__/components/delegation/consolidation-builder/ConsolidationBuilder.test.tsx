import ConsolidationBuilder from "@/components/delegation/consolidation-builder/ConsolidationBuilder";
import { toDirectedLinkKey } from "@/components/delegation/consolidation-builder/consolidation-plan";
import { CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS } from "@/constants/consolidation.constants";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { getAddress } from "viem";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: () => <svg data-testid="icon" />,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

jest.mock("wagmi", () => ({}));

const mockInvalidateQueries = jest.fn();
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

const mockData: {
  groups: Map<string, string[]>;
  groupsPending: boolean;
  groupsError: boolean;
  links: string[] | undefined;
  linksError: boolean;
} = {
  groups: new Map(),
  groupsPending: false,
  groupsError: false,
  links: [],
  linksError: false,
};
const mockRefetchLinks = jest.fn();

jest.mock(
  "@/components/delegation/consolidation-builder/useConsolidationBuilderData",
  () => ({
    useConsolidationGroups: (wallets: readonly string[]) => {
      const groups = new Map<string, readonly string[]>();
      if (!mockData.groupsPending && !mockData.groupsError) {
        wallets.forEach((wallet) =>
          groups.set(wallet, mockData.groups.get(wallet) ?? [])
        );
      }
      return {
        groups,
        isPending: mockData.groupsPending,
        isError: mockData.groupsError,
      };
    },
    useConsolidationLinkStatus: (wallets: readonly string[]) => ({
      registeredLinkKeys: wallets.length > 0 ? mockData.links : undefined,
      isError: mockData.linksError,
      refetch: mockRefetchLinks,
    }),
  })
);

const mockSubmit = jest.fn();
const mockDismissToast = jest.fn();
const mockWrite: {
  toast:
    | { status: "success"; title: string; transactionHash: string }
    | undefined;
  gasError: string | undefined;
} = { toast: undefined, gasError: undefined };
jest.mock(
  "@/components/delegation/consolidation-builder/useConsolidationStepWrite",
  () => ({
    useConsolidationStepWrite: () => ({
      submit: mockSubmit,
      isBusy: false,
      busySigner: undefined,
      gasError: mockWrite.gasError,
      gasErrorSigner: mockWrite.gasError ? `0x${"a".repeat(40)}` : undefined,
      toast: mockWrite.toast,
      showToast: mockWrite.toast !== undefined,
      dismissToast: mockDismissToast,
    }),
  })
);

const A = `0x${"a".repeat(40)}`;
const B = `0x${"b".repeat(40)}`;
const C = `0x${"c".repeat(40)}`;
const D = `0x${"d".repeat(40)}`;
const ACTIVATION_TEXT = "October 15, 2026 at 00:00 UTC";

function both(...pairs: readonly (readonly [string, string])[]): string[] {
  return pairs.flatMap(([x, y]) => [
    toDirectedLinkKey(x, y),
    toDirectedLinkKey(y, x),
  ]);
}

const GROUP_LINKS = both([A, B], [A, C], [B, C]);

const baseProps: ComponentProps<typeof ConsolidationBuilder> = {
  connectedAddress: A,
  walletResolving: false,
  onConnect: jest.fn(),
  onHide: jest.fn(),
};

function renderBuilder(
  props: Partial<ComponentProps<typeof ConsolidationBuilder>> = {}
) {
  const view = render(<ConsolidationBuilder {...baseProps} {...props} />);
  return {
    ...view,
    rerenderWith: (
      next: Partial<ComponentProps<typeof ConsolidationBuilder>>
    ) => view.rerender(<ConsolidationBuilder {...baseProps} {...next} />),
  };
}

function walletInput(position: number) {
  return screen.getByRole("textbox", { name: `Wallet ${position} address` });
}

function stepHeadings() {
  return screen
    .queryAllByRole("heading", { level: 4 })
    .map((heading) => heading.textContent);
}

function step(position: number) {
  const item = screen
    .getAllByRole("listitem")
    .find((candidate) =>
      within(candidate).queryByText(`Step ${position}`, { exact: true })
    );
  if (!item) {
    throw new Error(`Step ${position} not rendered`);
  }
  return within(item);
}

function addFourthWallet() {
  fireEvent.click(screen.getByRole("button", { name: "Add Wallet" }));
  fireEvent.change(walletInput(4), { target: { value: D } });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest
    .spyOn(Date, "now")
    .mockReturnValue(CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS - 60_000);
  mockData.groups = new Map([
    [A, [A, B, C]],
    [B, [A, B, C]],
    [C, [A, B, C]],
  ]);
  mockData.groupsPending = false;
  mockData.groupsError = false;
  mockData.links = [...GROUP_LINKS];
  mockData.linksError = false;
  mockWrite.toast = undefined;
  mockWrite.gasError = undefined;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("ConsolidationBuilder", () => {
  it("states the consequences and links to the TDH explainer and docs", () => {
    renderBuilder();

    expect(
      screen.getByRole("heading", { level: 2, name: "Build a Consolidation" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Every wallet in a consolidation can sign in as your profile and act for it. Only consolidate wallets you control."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The wallets’ profiles merge permanently. The profile with the highest CIC keeps its handle."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Signing out of order temporarily splits/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "A wallet that is already in another consolidation will leave it."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "How consolidation affects TDH" })
    ).toHaveAttribute("href", "/network/tdh/consolidation");
    expect(
      screen.getByRole("link", { name: "Consolidation guide" })
    ).toHaveAttribute(
      "href",
      "/delegation/delegation-faq/register-consolidation"
    );
  });

  it("prefills the connected wallet and its current consolidation", () => {
    renderBuilder();

    expect(walletInput(1)).toHaveValue(A);
    expect(walletInput(2)).toHaveValue(B);
    expect(walletInput(3)).toHaveValue(C);
    expect(screen.getByText("3 of 4 wallets")).toBeInTheDocument();
    expect(screen.getAllByText("In current consolidation")).toHaveLength(3);
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Every link between these wallets is already registered. There is nothing to sign."
      )
    ).toBeInTheDocument();
  });

  it("orders existing members first and lets only the connected signer act", () => {
    renderBuilder();
    addFourthWallet();

    expect(stepHeadings()).toEqual([
      "Wallet 1 signs",
      "Wallet 2 signs",
      "Wallet 3 signs",
      "Wallet 4 signs",
    ]);
    expect(step(1).getByText("Links to Wallet 4")).toBeInTheDocument();
    expect(step(1).getByText("1 registration")).toBeInTheDocument();
    expect(
      step(4).getByText("Links to Wallet 1, Wallet 2, and Wallet 3")
    ).toBeInTheDocument();
    expect(
      step(4).getByText("3 registrations in one transaction")
    ).toBeInTheDocument();
    expect(
      step(2).getByText("Available once the earlier steps are confirmed.")
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Sign Step/ })).toHaveLength(
      1
    );

    fireEvent.click(step(1).getByRole("button", { name: "Sign Step 1" }));
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ index: 0, signer: A, pendingTargets: [D] })
    );
  });

  it("keeps the list across wallet switches and asks for the next signer", () => {
    const view = renderBuilder();
    addFourthWallet();

    view.rerenderWith({ connectedAddress: D });

    expect(walletInput(4)).toHaveValue(D);
    expect(
      step(1).getByText(
        `Switch your wallet to Wallet 1 (${getAddress(A)}) to sign this step.`
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Sign Step/ })
    ).not.toBeInTheDocument();
  });

  it("advances to the next step once the previous link confirms", () => {
    const view = renderBuilder();
    addFourthWallet();

    mockData.links = [...GROUP_LINKS, toDirectedLinkKey(A, D)];
    view.rerenderWith({ connectedAddress: B });

    expect(step(1).getByText("Confirmed")).toBeInTheDocument();
    expect(step(2).getByText("Next")).toBeInTheDocument();
    expect(step(2).getByRole("button", { name: "Sign Step 2" })).toBeEnabled();
  });

  it("holds the new wallet's final step until the fourth slot opens", () => {
    const view = renderBuilder();
    addFourthWallet();

    expect(
      screen.getByText(
        `Four-wallet consolidations count from ${ACTIVATION_TEXT}. You can sign the other steps now; the last step opens then.`
      )
    ).toBeInTheDocument();

    mockData.links = [
      ...GROUP_LINKS,
      toDirectedLinkKey(A, D),
      toDirectedLinkKey(B, D),
      toDirectedLinkKey(C, D),
    ];
    view.rerenderWith({ connectedAddress: D });

    expect(
      step(4).getByText(`Available from ${ACTIVATION_TEXT}.`)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign Step 4" })
    ).not.toBeInTheDocument();
  });

  it("opens the final step after activation", () => {
    jest
      .spyOn(Date, "now")
      .mockReturnValue(CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS + 60_000);
    mockData.links = [
      ...GROUP_LINKS,
      toDirectedLinkKey(A, D),
      toDirectedLinkKey(B, D),
      toDirectedLinkKey(C, D),
    ];
    renderBuilder({ connectedAddress: D });
    fireEvent.change(walletInput(2), { target: { value: A } });
    fireEvent.click(screen.getByRole("button", { name: "Add Wallet" }));
    fireEvent.change(walletInput(3), { target: { value: B } });
    fireEvent.click(screen.getByRole("button", { name: "Add Wallet" }));
    fireEvent.change(walletInput(4), { target: { value: C } });

    expect(stepHeadings()).toEqual(["Wallet 1 signs"]);
    expect(screen.queryByText(/Four-wallet consolidations/)).toBeNull();
    expect(step(1).getByRole("button", { name: "Sign Step 1" })).toBeEnabled();
  });

  it("validates addresses, duplicates, and the minimum wallet count", () => {
    mockData.groups = new Map();
    renderBuilder({ connectedAddress: undefined });

    expect(walletInput(1)).toHaveValue("");
    expect(walletInput(2)).toHaveValue("");
    expect(
      screen.getByText("Enter at least two valid wallets to see the steps.")
    ).toBeInTheDocument();

    fireEvent.change(walletInput(1), { target: { value: "nope" } });
    expect(walletInput(1)).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText(
        "Enter a wallet address: 0x followed by 40 hexadecimal characters."
      )
    ).toBeInTheDocument();

    fireEvent.change(walletInput(1), { target: { value: A } });
    fireEvent.change(walletInput(2), { target: { value: A } });
    expect(
      screen.getByText("This wallet is already listed.")
    ).toBeInTheDocument();
    expect(stepHeadings()).toEqual([]);
  });

  it("offers to connect the first signer while disconnected", () => {
    mockData.groups = new Map();
    mockData.links = [];
    const onConnect = jest.fn();
    renderBuilder({ connectedAddress: undefined, onConnect });
    fireEvent.change(walletInput(1), { target: { value: A } });
    fireEvent.change(walletInput(2), { target: { value: B } });

    expect(
      step(1).getByText(
        `Connect Wallet 1 (${getAddress(A)}) to sign this step.`
      )
    ).toBeInTheDocument();
    fireEvent.click(step(1).getByRole("button", { name: "Connect Wallet" }));
    expect(onConnect).toHaveBeenCalled();
  });

  it("names wallets that leave their current consolidation", () => {
    renderBuilder();
    fireEvent.click(screen.getByRole("button", { name: "Remove wallet 3" }));

    expect(
      screen.getByText(
        `Wallet 1 and Wallet 2 will leave the current consolidation with ${getAddress(C).slice(0, 6)}...${getAddress(C).slice(-4)}.`
      )
    ).toBeInTheDocument();
  });

  it("caps the list at four wallets", () => {
    renderBuilder();
    addFourthWallet();

    expect(
      screen.queryByRole("button", { name: "Add Wallet" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("A consolidation can hold up to 4 wallets.")
    ).toBeInTheDocument();
  });

  it("reports on-chain read errors with a retry", () => {
    mockData.linksError = true;
    renderBuilder();

    expect(
      screen.getByText("Couldn’t read the registered links on-chain.")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(mockRefetchLinks).toHaveBeenCalled();
    expect(mockInvalidateQueries).toHaveBeenCalled();
  });

  it("shows transaction progress and gas errors for the signing step", () => {
    mockWrite.toast = {
      status: "success",
      title: "Consolidation Step 1",
      transactionHash: `0x${"1".repeat(64)}`,
    };
    mockWrite.gasError = "Switch to Ethereum Mainnet";
    renderBuilder();
    addFourthWallet();

    expect(
      screen.getByRole("dialog", { name: "Consolidation Step 1" })
    ).toBeInTheDocument();
    expect(step(1).getByRole("alert")).toHaveTextContent(
      "Switch to Ethereum Mainnet"
    );
    fireEvent.click(screen.getByRole("button", { name: "Close modal" }));
    expect(mockDismissToast).toHaveBeenCalled();
  });

  it("waits for the current consolidations before planning", () => {
    mockData.groups = new Map();
    mockData.groupsError = true;
    renderBuilder({ connectedAddress: undefined });
    fireEvent.change(walletInput(1), { target: { value: A } });
    fireEvent.change(walletInput(2), { target: { value: B } });

    expect(
      screen.getByText(
        "Couldn’t load the current consolidations of these wallets."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The steps appear once the current consolidations of these wallets load."
      )
    ).toBeInTheDocument();
    expect(stepHeadings()).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(mockInvalidateQueries).toHaveBeenCalled();
  });

  it("shows the current consolidation while it loads", () => {
    mockData.groupsPending = true;
    renderBuilder();

    expect(
      screen.getByText("Loading your current consolidation…")
    ).toBeInTheDocument();
    expect(walletInput(1)).toHaveValue(A);
    expect(
      screen.getByText("Checking registered links on-chain…")
    ).toBeInTheDocument();
  });
});
