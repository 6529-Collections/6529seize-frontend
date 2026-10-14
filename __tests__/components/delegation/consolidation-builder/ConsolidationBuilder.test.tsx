import ConsolidationBuilder from "@/components/delegation/consolidation-builder/ConsolidationBuilder";
import { toDirectedLinkKey } from "@/components/delegation/consolidation-builder/consolidation-plan";
import {
  CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS,
  FOURTH_SLOT_SIGNING_OPENS_MS,
} from "@/__tests__/helpers/consolidation-policy.fixture";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { getAddress } from "viem";

const mockPolicyState: {
  policy: {
    activationMs: number;
    signingOpensMs: number;
    maxWallets: number;
    ungatedMaxWallets: number;
  } | null;
  limits: { maxWallets: number; ungatedMaxWallets: number } | null;
  isLoading: boolean;
  reload: jest.Mock;
} = {
  limits: { maxWallets: 4, ungatedMaxWallets: 3 },
  policy: {
    maxWallets: 4,
    ungatedMaxWallets: 3,
    activationMs: CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS,
    signingOpensMs: FOURTH_SLOT_SIGNING_OPENS_MS,
  },
  isLoading: false,
  reload: jest.fn(),
};
jest.mock("@/hooks/useConsolidationPolicy", () => ({
  useConsolidationPolicy: () => mockPolicyState,
}));

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

const mockEnsAddresses: Record<string, string | undefined> = {};
jest.mock("wagmi", () => ({
  useEnsName: () => ({ data: null, isLoading: false }),
  useEnsAddress: ({ name }: { name?: string }) => ({
    data: name ? (mockEnsAddresses[name] ?? null) : null,
    isLoading: false,
    isError: false,
  }),
}));

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
  managed: ReadonlySet<string> | undefined;
  managersError: boolean;
} = {
  groups: new Map(),
  groupsPending: false,
  groupsError: false,
  links: [],
  linksError: false,
  fresh: [],
  freshError: false,
  managed: new Set(),
  managersError: false,
};
const mockRefetchLinks = jest.fn();
const mockRefetchManagers = jest.fn();

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
    useConsolidationManagedWallets: () => ({
      managedWallets: mockData.managed,
      isError: mockData.managersError,
      refetch: mockRefetchManagers,
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
const SIGNING_OPENS_TEXT = "October 15, 2026 at 00:10 UTC";
const AFTER_ACTIVATION_MS = FOURTH_SLOT_SIGNING_OPENS_MS + 60_000;
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
const SAFE_GUIDANCE =
  "Safes sign through a manager here. Appoint a Delegation Manager for this Safe on Any Collection, then connect the manager to sign these links.";

const baseProps: ComponentProps<typeof ConsolidationBuilder> = {
  connectedAddress: A,
  isSafeWallet: false,
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
  Object.keys(mockEnsAddresses).forEach(
    (name) => delete mockEnsAddresses[name]
  );
  mockPolicyState.limits = { maxWallets: 4, ungatedMaxWallets: 3 };
  mockPolicyState.policy = {
    maxWallets: 4,
    ungatedMaxWallets: 3,
    activationMs: CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS,
    signingOpensMs: FOURTH_SLOT_SIGNING_OPENS_MS,
  };
  mockPolicyState.isLoading = false;
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
  mockData.managed = new Set();
  mockData.managersError = false;
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
    ).toHaveAttribute("href", "/safe-collecting/faq/register-consolidation");
  });

  it("suggests appointing a Delegation Manager to keep a vault cold", () => {
    renderBuilder();

    expect(
      screen.getByText(
        "Keeping a vault cold? Appoint a Delegation Manager for it on Any Collection first, so it never has to connect here."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Appoint a Delegation Manager" })
    ).toHaveAttribute("href", "/safe-collecting/register-sub-delegation");
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
    expect(screen.queryByText(SAFE_GUIDANCE)).not.toBeInTheDocument();
  });

  it("sends a connected Safe to a manager instead of signing its own step", () => {
    renderBuilder({ isSafeWallet: true });
    addFourthWallet();

    expect(
      screen.queryByRole("button", { name: /^Sign/ })
    ).not.toBeInTheDocument();
    expect(step(1).getByText(SAFE_GUIDANCE)).toBeInTheDocument();
    expect(
      step(1).getByRole("link", { name: "Appoint a Delegation Manager" })
    ).toHaveAttribute("href", "/safe-collecting/register-sub-delegation");
    expect(step(1).getByRole("link", { name: "Using a SAFE" })).toHaveAttribute(
      "href",
      "/safe-collecting/faq/using-safe"
    );
    // Once in the step and once above the wallet list.
    expect(screen.getAllByText(SAFE_GUIDANCE)).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Using a SAFE" })).toHaveLength(
      2
    );
  });

  it("keeps the next signer's step unchanged while a different Safe is connected", () => {
    const view = renderBuilder();
    addFourthWallet();
    view.rerenderWith({ connectedAddress: D, isSafeWallet: true });

    expect(
      step(1).getByText(
        `Switch your wallet to Wallet 1 (${getAddress(A)}) or a wallet that manages it to sign this step.`
      )
    ).toBeInTheDocument();
    expect(step(1).queryByText(SAFE_GUIDANCE)).not.toBeInTheDocument();
    expect(screen.getAllByText(SAFE_GUIDANCE)).toHaveLength(1);
  });

  it("keeps the list across wallet switches and asks for the next signer", () => {
    const view = renderBuilder();
    addFourthWallet();

    view.rerenderWith({ connectedAddress: D });

    expect(walletInput(4)).toHaveValue(D);
    expect(
      step(1).getByText(
        `Switch your wallet to Wallet 1 (${getAddress(A)}) or a wallet that manages it to sign this step.`
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

  it("warns that a manager sending a new wallet's links one at a time can split the group", () => {
    mockData.managed = new Set([D]);
    renderBuilder({ connectedAddress: B });
    addFourthWallet();

    expect(stepHeadings()).toEqual([
      "Wallet 1 signs",
      "Wallet 2 signs",
      "Wallet 3 signs",
      "Manager signs for Wallet 4",
    ]);
    expect(
      step(4).getByText(
        "Wallet 4 stays cold: its manager signs these links for it, one transaction per link. Until the last one confirms, your consolidation can be split, which can reduce your TDH-wave votes. Send them back to back."
      )
    ).toBeInTheDocument();
  });

  it("lets a manager sign a cold vault's step one link at a time", () => {
    mockData.groups = new Map();
    mockData.links = [];
    mockData.managed = new Set([A]);
    const view = renderBuilder({ connectedAddress: B });
    fireEvent.change(walletInput(2), { target: { value: A } });
    fireEvent.click(screen.getByRole("button", { name: "Add Wallet" }));
    fireEvent.change(walletInput(3), { target: { value: C } });

    expect(stepHeadings()).toEqual([
      "Wallet 1 signs",
      "Manager signs for Wallet 2",
      "Wallet 3 signs",
    ]);
    expect(step(1).getByRole("button", { name: "Sign Step 1" })).toBeEnabled();
    expect(
      step(2).getByText(
        "Wallet 2 stays cold: its manager signs these links for it, one transaction per link."
      )
    ).toBeInTheDocument();
    expect(
      step(2).getByText("2 registrations, one transaction each")
    ).toBeInTheDocument();
    expect(
      step(3).getByText("2 registrations in one transaction")
    ).toBeInTheDocument();

    mockData.links = [toDirectedLinkKey(B, A), toDirectedLinkKey(B, C)];
    view.rerenderWith({ connectedAddress: B });
    const signAsManager = step(2).getByRole("button", {
      name: "Sign for Wallet 2 as its manager",
    });
    expect(signAsManager).toHaveAccessibleDescription("Link 1 of 2");
    expect(
      screen.getByText(
        "Step 2 of 3 is next: sign link 1 of 2 for Wallet 2 as its manager."
      )
    ).toBeInTheDocument();
    fireEvent.click(signAsManager);
    expect(mockSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({
        signer: A,
        signAs: "manager",
        pendingTargets: [B, C],
        nextLink: 1,
      })
    );

    mockData.links = [...mockData.links, toDirectedLinkKey(A, B)];
    mockWrite.recordedLinkKeys = new Set([toDirectedLinkKey(A, B)]);
    view.rerenderWith({ connectedAddress: B });
    expect(step(2).getByText("Link 2 of 2")).toBeInTheDocument();
    fireEvent.click(
      step(2).getByRole("button", { name: "Sign for Wallet 2 as its manager" })
    );
    expect(mockSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ pendingTargets: [C], nextLink: 2 })
    );

    mockData.links = [...mockData.links, toDirectedLinkKey(A, C)];
    view.rerenderWith({ connectedAddress: B });
    expect(step(2).getByText("Confirmed")).toBeInTheDocument();
    expect(
      step(3).getByText(
        `Switch your wallet to Wallet 3 (${getAddress(C)}) or a wallet that manages it to sign this step.`
      )
    ).toBeInTheDocument();
  });

  it("checks whether the connected wallet manages the next signer", () => {
    mockData.managed = undefined;
    const view = renderBuilder();
    addFourthWallet();
    expect(step(1).getByRole("button", { name: "Sign Step 1" })).toBeEnabled();

    view.rerenderWith({ connectedAddress: D });
    expect(
      step(1).getByText(
        "Checking whether the connected wallet manages Wallet 1…"
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Sign/ })
    ).not.toBeInTheDocument();
  });

  it("reports a failed manager check with a retry", () => {
    mockData.managersError = true;
    renderBuilder();

    expect(
      screen.getByText("Couldn’t check the registered links.")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(mockRefetchManagers).toHaveBeenCalled();
  });

  it("announces the four-wallet activation date while it loads", () => {
    mockPolicyState.policy = null;
    mockPolicyState.isLoading = true;
    renderBuilder();
    addFourthWallet();

    const status = screen.getByText("Loading consolidation settings…");
    expect(status.tagName).toBe("OUTPUT");
    expect(screen.queryByRole("button", { name: "Try Again" })).toBeNull();
    expect(
      screen.queryByText(/^Four-wallet signing opens /)
    ).not.toBeInTheDocument();
  });

  it("alerts and offers a retry when the activation date is unavailable", () => {
    mockPolicyState.policy = null;
    mockPolicyState.reload.mockResolvedValue(undefined);
    renderBuilder();
    addFourthWallet();

    const alert = screen.getByText(
      "Couldn’t load consolidation settings. Signing that requires unavailable settings is paused; try again."
    );
    expect(alert).toHaveAttribute("role", "alert");
    fireEvent.click(within(alert).getByRole("button", { name: "Try Again" }));
    expect(mockPolicyState.reload).toHaveBeenCalledWith({ reset: true });
  });

  it("holds every step of a four-wallet group until the fourth slot opens", () => {
    jest.spyOn(Date, "now").mockReturnValue(BEFORE_ACTIVATION_MS);
    renderBuilder();
    addFourthWallet();

    expect(
      screen.getByText(
        `Four-wallet consolidations count only for links registered from ${ACTIVATION_TEXT}. Every step for this group opens at ${SIGNING_OPENS_TEXT}, a few minutes later, so no link can land before the start.`
      )
    ).toBeInTheDocument();
    expect(
      step(1).getByText(`Available from ${SIGNING_OPENS_TEXT}.`)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Sign Step/ })
    ).not.toBeInTheDocument();
  });

  it.each([
    [CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS - 1, true],
    [CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS, false],
    [CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS + 1, false],
    [FOURTH_SLOT_SIGNING_OPENS_MS, false],
  ] as const)(
    "shows the counter opening note only before the cutoff (now=%s)",
    (nowMs, visible) => {
      jest.spyOn(Date, "now").mockReturnValue(nowMs);
      renderBuilder();
      const note = screen.queryByText(
        "Four-wallet signing opens Oct 15, 2026, 00:10 UTC."
      );
      if (visible) expect(note).toBeInTheDocument();
      else expect(note).not.toBeInTheDocument();
    }
  );

  it("uses the selected environment's opening time in the counter note", () => {
    mockPolicyState.policy = {
      maxWallets: 4,
      ungatedMaxWallets: 3,
      activationMs: Date.parse("2026-10-14T00:00:00Z"),
      signingOpensMs: Date.parse("2026-10-14T00:10:00Z"),
    };
    jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-13T23:59:00Z"));
    renderBuilder();
    expect(
      screen.getByText("Four-wallet signing opens Oct 14, 2026, 00:10 UTC.")
    ).toBeInTheDocument();
  });

  it("removes the counter note at cutoff in an open tab while signing stays held", () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS - 1000);
      renderBuilder();
      addFourthWallet();
      expect(
        screen.getByText("Four-wallet signing opens Oct 15, 2026, 00:10 UTC.")
      ).toBeInTheDocument();
      act(() => jest.advanceTimersByTime(1000));
      expect(
        screen.queryByText("Four-wallet signing opens Oct 15, 2026, 00:10 UTC.")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /^Sign Step/ })
      ).not.toBeInTheDocument();
      act(() =>
        jest.advanceTimersByTime(
          FOURTH_SLOT_SIGNING_OPENS_MS -
            CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS
        )
      );
      expect(
        step(1).getByRole("button", { name: "Sign Step 1" })
      ).toBeEnabled();
    } finally {
      jest.useRealTimers();
    }
  });

  it("opens a held group when activation passes in an open tab", () => {
    jest.useFakeTimers();
    try {
      const startMs = FOURTH_SLOT_SIGNING_OPENS_MS - 30 * DAY_MS;
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
        jest.advanceTimersByTime(
          CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS -
            startMs -
            MAX_TIMER_DELAY_MS
        );
      });
      expect(
        screen.queryByRole("button", { name: /^Sign Step/ })
      ).not.toBeInTheDocument();
      act(() =>
        jest.advanceTimersByTime(
          FOURTH_SLOT_SIGNING_OPENS_MS -
            CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS
        )
      );
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
        `Switch your wallet to Wallet 2 (${getAddress(B)}) or a wallet that manages it to sign this step.`
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
        "Enter a valid Ethereum address or a resolvable ENS name."
      )
    ).toBeInTheDocument();

    fireEvent.change(walletInput(1), { target: { value: A } });
    fireEvent.change(walletInput(2), { target: { value: A } });
    expect(
      screen.getByText("This wallet is already listed.")
    ).toBeInTheDocument();
    expect(stepHeadings()).toEqual([]);
  });

  it("builds a four-wallet plan from resolved ENS names", () => {
    mockData.groups = new Map();
    for (const [name, address] of [
      ["vault.eth", A],
      ["trade.eth", B],
      ["social.eth", C],
      ["old.eth", D],
    ] as const) {
      mockEnsAddresses[name] = address;
    }
    renderBuilder({ connectedAddress: undefined });
    fireEvent.change(walletInput(1), { target: { value: "vault.eth" } });
    fireEvent.change(walletInput(2), { target: { value: "trade.eth" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Wallet" }));
    fireEvent.change(walletInput(3), { target: { value: "social.eth" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Wallet" }));
    fireEvent.change(walletInput(4), { target: { value: "old.eth" } });
    expect(walletInput(1)).toHaveValue(`vault.eth - ${A}`);
    expect(screen.getByText("4 of 4 wallets")).toBeInTheDocument();
    expect(stepHeadings()).toEqual([
      "Wallet 1 signs",
      "Wallet 2 signs",
      "Wallet 3 signs",
      "Wallet 4 signs",
    ]);
  });

  it("detects duplicate ENS aliases and raw addresses", () => {
    mockData.groups = new Map();
    mockEnsAddresses["vault.eth"] = A;
    mockEnsAddresses["alias.eth"] = A;
    renderBuilder({ connectedAddress: undefined });
    fireEvent.change(walletInput(1), { target: { value: "vault.eth" } });
    for (const value of [A, "alias.eth"]) {
      fireEvent.change(walletInput(2), { target: { value } });
      expect(
        screen.getByText("This wallet is already listed.")
      ).toBeInTheDocument();
      expect(stepHeadings()).toEqual([]);
    }
  });

  it.each(["unresolved.eth", `unresolved.eth - ${C}`])(
    "blocks unresolved names and unverified display suffixes (%s)",
    (value) => {
      mockData.groups = new Map();
      mockEnsAddresses["social.eth"] = C;
      renderBuilder({ connectedAddress: undefined });
      fireEvent.change(walletInput(1), { target: { value: A } });
      fireEvent.change(walletInput(2), { target: { value: B } });
      fireEvent.click(screen.getByRole("button", { name: "Add Wallet" }));
      fireEvent.change(walletInput(3), { target: { value: "social.eth" } });
      expect(screen.getByText("3 of 4 wallets")).toBeInTheDocument();
      fireEvent.change(walletInput(3), { target: { value } });
      expect(walletInput(3)).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByText("2 of 4 wallets")).toBeInTheDocument();
      expect(stepHeadings()).toEqual([]);
    }
  );

  it("offers to connect the first signer while disconnected", () => {
    mockData.groups = new Map();
    mockData.links = [];
    const onConnect = jest.fn();
    renderBuilder({ connectedAddress: undefined, onConnect });
    fireEvent.change(walletInput(1), { target: { value: A } });
    fireEvent.change(walletInput(2), { target: { value: B } });

    expect(
      step(1).getByText(
        `Connect Wallet 1 (${getAddress(A)}) or a wallet that manages it to sign this step.`
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

test.each([true, false])(
  "keeps four-wallet signing closed while policy is unavailable (loading=%s)",
  (isLoading) => {
    mockPolicyState.policy = null;
    mockPolicyState.isLoading = isLoading;
    renderBuilder();
    addFourthWallet();
    expect(
      screen.queryByRole("button", { name: /Sign Step/ })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        isLoading
          ? "Loading consolidation settings…"
          : "Couldn’t load consolidation settings. Signing that requires unavailable settings is paused; try again."
      )
    ).toBeInTheDocument();
  }
);

test("an unavailable policy does not hold a three-wallet plan", () => {
  mockPolicyState.policy = null;
  mockData.links = [];
  renderBuilder();
  expect(screen.getByRole("button", { name: "Sign Step 1" })).toBeEnabled();
});

test("changing the cutoff replans the stale links in an open session", () => {
  mockData.links = [...GROUP_LINKS, ...both([A, D], [B, D], [C, D])];
  mockData.fresh = [...both([A, D], [B, D], [C, D])];
  const view = renderBuilder();
  addFourthWallet();
  expect(
    screen.queryByRole("button", { name: /Sign Step/ })
  ).not.toBeInTheDocument();
  mockPolicyState.policy = {
    maxWallets: 4,
    ungatedMaxWallets: 3,
    activationMs: AFTER_ACTIVATION_MS + 1000,
    signingOpensMs: AFTER_ACTIVATION_MS + 601000,
  };
  mockData.fresh = [];
  view.rerenderWith({});
  expect(
    screen.getByText(/Some of these links were registered before/)
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Sign Step/ })
  ).not.toBeInTheDocument();
});

test("uses the settings maximum for wallet rows and does not invent one while unavailable", () => {
  mockPolicyState.limits = { maxWallets: 3, ungatedMaxWallets: 3 };
  const view = renderBuilder();
  expect(
    screen.queryByRole("button", { name: "Add Wallet" })
  ).not.toBeInTheDocument();
  expect(
    screen.getByText("A consolidation can hold up to 3 wallets.")
  ).toBeInTheDocument();
  mockPolicyState.limits = null;
  mockPolicyState.policy = null;
  view.rerenderWith({});
  expect(screen.getByText("Entered wallets: 3")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Sign Step/ })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText("A consolidation can hold up to 3 wallets.")
  ).not.toBeInTheDocument();
});
