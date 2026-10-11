import ConsolidationBuilder from "@/components/delegation/consolidation-builder/ConsolidationBuilder";
import { toDirectedLinkKey } from "@/components/delegation/consolidation-builder/consolidation-plan";
import { CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS } from "@/constants/consolidation.constants";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
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
  fresh: string[];
  freshError: boolean;
} = {
  groups: new Map(),
  groupsPending: false,
  groupsError: false,
  links: [],
  linksError: false,
  fresh: [],
  freshError: false,
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
    useConsolidationFreshLinks: (wallets: readonly string[]) => ({
      freshLinkKeys:
        wallets.length > 0 && mockData.freshError ? undefined : mockData.fresh,
      isError: wallets.length > 0 && mockData.freshError,
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
  recordedLinkKeys: ReadonlySet<string>;
} = { toast: undefined, gasError: undefined, recordedLinkKeys: new Set() };
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
      recordedLinkKeys: mockWrite.recordedLinkKeys,
    }),
  })
);

const A = `0x${"a".repeat(40)}`;
const B = `0x${"b".repeat(40)}`;
const C = `0x${"c".repeat(40)}`;
const D = `0x${"d".repeat(40)}`;
const ACTIVATION_TEXT = "October 15, 2026 at 00:00 UTC";
const AFTER_ACTIVATION_MS = CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS + 60_000;
const BEFORE_ACTIVATION_MS = CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS - 60_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_TIMER_DELAY_MS = 2_147_483_647;

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
  jest.spyOn(Date, "now").mockReturnValue(AFTER_ACTIVATION_MS);
  mockData.groups = new Map([
    [A, [A, B, C]],
    [B, [A, B, C]],
    [C, [A, B, C]],
  ]);
  mockData.groupsPending = false;
  mockData.groupsError = false;
  mockData.links = [...GROUP_LINKS];
  mockData.linksError = false;
  mockData.fresh = [];
  mockData.freshError = false;
  mockWrite.toast = undefined;
  mockWrite.gasError = undefined;
  mockWrite.recordedLinkKeys = new Set();
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
    mockData.fresh = [toDirectedLinkKey(A, D)];
    view.rerenderWith({ connectedAddress: B });

    expect(step(1).getByText("Confirmed")).toBeInTheDocument();
    expect(step(2).getByText("Next")).toBeInTheDocument();
    expect(step(2).getByRole("button", { name: "Sign Step 2" })).toBeEnabled();
    expect(
      screen.getByText("Step 2 of 4 is next: Wallet 2 signs.").tagName
    ).toBe("OUTPUT");
  });

  it("holds every step of a four-wallet group until the fourth slot opens", () => {
    jest.spyOn(Date, "now").mockReturnValue(BEFORE_ACTIVATION_MS);
    renderBuilder();
    addFourthWallet();

    expect(
      screen.getByText(
        `Four-wallet consolidations count only for links registered from ${ACTIVATION_TEXT}. Every step for this group opens then.`
      )
    ).toBeInTheDocument();
    expect(
      step(1).getByText(`Available from ${ACTIVATION_TEXT}.`)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Sign Step/ })
    ).not.toBeInTheDocument();
  });

  it("opens a held group when activation passes in an open tab", () => {
    jest.useFakeTimers();
    try {
      const startMs = CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS - 30 * DAY_MS;
      jest.setSystemTime(startMs);
      renderBuilder();
      addFourthWallet();
      expect(
        screen.queryByRole("button", { name: /^Sign Step/ })
      ).not.toBeInTheDocument();

      // Longer than one browser timer allows, so the wait is chained.
      act(() => {
        jest.advanceTimersByTime(MAX_TIMER_DELAY_MS);
      });
      expect(
        screen.queryByRole("button", { name: /^Sign Step/ })
      ).not.toBeInTheDocument();
      act(() => {
        jest.advanceTimersByTime(30 * DAY_MS - MAX_TIMER_DELAY_MS);
      });
      expect(
        step(1).getByRole("button", { name: "Sign Step 1" })
      ).toBeEnabled();
    } finally {
      jest.useRealTimers();
    }
  });

  it("does not hold groups of three before activation", () => {
    jest.spyOn(Date, "now").mockReturnValue(BEFORE_ACTIVATION_MS);
    renderBuilder();
    fireEvent.change(walletInput(3), { target: { value: D } });

    expect(screen.queryByText(/Four-wallet consolidations/)).toBeNull();
    expect(step(1).getByRole("button", { name: "Sign Step 1" })).toBeEnabled();
  });

  it("registers older links to the joining wallet again and explains why", () => {
    mockData.links = [...GROUP_LINKS, toDirectedLinkKey(A, D)];
    renderBuilder();
    addFourthWallet();

    expect(
      screen.getByText(
        `Some of these links were registered before ${ACTIVATION_TEXT}. They are registered again so they count for the fourth wallet.`
      )
    ).toBeInTheDocument();
    fireEvent.click(step(1).getByRole("button", { name: "Sign Step 1" }));
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ signer: A, pendingTargets: [D] })
    );
  });

  it("waits for 6529 to record a link confirmed in this session", () => {
    const view = renderBuilder();
    addFourthWallet();

    mockData.links = [...GROUP_LINKS, toDirectedLinkKey(A, D)];
    mockWrite.recordedLinkKeys = new Set([toDirectedLinkKey(A, D)]);
    view.rerenderWith({ connectedAddress: A });

    expect(step(1).getByText("Recording")).toBeInTheDocument();
    expect(
      step(1).getByText(
        "Waiting for 6529 to record this link (usually about a minute)."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign Step 1" })
    ).not.toBeInTheDocument();
    expect(step(2).getByText("Next")).toBeInTheDocument();
    expect(
      screen.getByText("Step 2 of 4 is next: Wallet 2 signs.")
    ).toBeInTheDocument();
    expect(
      step(2).getByText(
        `Switch your wallet to Wallet 2 (${getAddress(B)}) to sign this step.`
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/They are registered again/)
    ).not.toBeInTheDocument();
  });

  it("plans again when a link it relied on is revoked or no longer fresh", () => {
    const fresh = [toDirectedLinkKey(A, D), toDirectedLinkKey(D, A)];
    mockData.links = [...GROUP_LINKS, ...fresh];
    mockData.fresh = fresh;
    const view = renderBuilder();
    addFourthWallet();
    expect(stepHeadings()).toEqual([
      "Wallet 2 signs",
      "Wallet 3 signs",
      "Wallet 4 signs",
    ]);

    mockData.fresh = [toDirectedLinkKey(D, A)];
    view.rerenderWith({ connectedAddress: A });
    expect(stepHeadings()).toEqual([
      "Wallet 1 signs",
      "Wallet 2 signs",
      "Wallet 3 signs",
      "Wallet 4 signs",
    ]);

    mockData.links = [...GROUP_LINKS];
    mockData.fresh = [];
    view.rerenderWith({ connectedAddress: A });
    expect(
      step(4).getByText("Links to Wallet 1, Wallet 2, and Wallet 3")
    ).toBeInTheDocument();
  });

  it("reports when registration times cannot be read", () => {
    mockData.freshError = true;
    renderBuilder();
    addFourthWallet();

    expect(
      screen.getByText("Couldn’t check the registered links.")
    ).toBeInTheDocument();
  });

  it("opens the final step after activation", () => {
    const fresh = [
      toDirectedLinkKey(A, D),
      toDirectedLinkKey(B, D),
      toDirectedLinkKey(C, D),
    ];
    mockData.links = [...GROUP_LINKS, ...fresh];
    mockData.fresh = fresh;
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
      screen.getByText("Couldn’t check the registered links.")
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
    expect(screen.getByText("Checking registered links…")).toBeInTheDocument();
  });
});
