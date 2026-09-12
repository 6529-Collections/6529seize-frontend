import CollectPlanBasket from "@/components/collect/CollectPlanBasket";
import { resolveCollectPlanSelection } from "@/components/collect/collect-plan-selection.helpers";
import type { CollectSelectedListing } from "@/components/collect/collect-selection.helpers";
import {
  ApiCollectPlanStateEnum,
  type ApiCollectPlan,
} from "@/generated/models/ApiCollectPlan";
import {
  ApiCollectAcquisitionPlanOptimalityEnum,
  ApiCollectAcquisitionPlanStatusEnum,
} from "@/generated/models/ApiCollectAcquisitionPlan";
import { ApiCollectKind } from "@/generated/models/ApiCollectKind";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import type { ApiCollectPlanLeg } from "@/generated/models/ApiCollectPlanLeg";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: ({
    children,
    onClose,
  }: {
    children: ReactNode;
    onClose: () => void;
  }) => (
    <div role="dialog">
      <button onClick={onClose}>Close dialog</button>
      {children}
    </div>
  ),
}));
jest.mock("@/components/collect/CollectSaveRule", () => ({
  __esModule: true,
  default: () => <button>Save rule</button>,
}));
jest.mock("@/components/collect/collect-plan-selection.helpers", () => ({
  ...jest.requireActual("@/components/collect/collect-plan-selection.helpers"),
  resolveCollectPlanSelection: jest.fn(),
}));
const mockBatch = jest.fn();
jest.mock("@/components/collect/CollectBatchController", () => ({
  __esModule: true,
  default: (props: { onSettled?: () => void }) => {
    mockBatch(props);
    return (
      <section aria-label="Batch review">
        <button onClick={props.onSettled}>Confirmed purchase</button>
      </section>
    );
  },
}));
const resolve = jest.mocked(resolveCollectPlanSelection);
const assetKey = "1:0x33fd426905f149f8376e227d0c9d3340aad17af1:1";
const recipientWallet = `0x${"1".repeat(40)}`;
function makePlan(recipient: string | null = recipientWallet): ApiCollectPlan {
  return {
    id: "plan",
    state: ApiCollectPlanStateEnum.Ready,
    revision: "revision",
    profile_id: "profile",
    analysis: {
      analysis_id: "analysis",
      catalog_version: "catalog",
      account: {
        profile_id: "profile",
        consolidation_key: "account",
        wallets: [],
        membership_hash: "membership",
      },
      holdings_snapshot: { block_number: 1, nextgen_block_number: 1 },
      kind: ApiCollectKind.Exact,
      target_copies: "1",
      requirements: [],
      required_count: 1,
      satisfied_count: 0,
      complete: false,
      missing_asset_keys: [assetKey],
      recipient,
      recipient_in_profile: false,
      counts_toward_profile: false,
    },
    result: {
      plan_id: "plan",
      analysis_id: "analysis",
      status: ApiCollectAcquisitionPlanStatusEnum.Partial,
      optimality: ApiCollectAcquisitionPlanOptimalityEnum.BestFound,
      recipient,
      total_cost_wei: "1",
      remaining_requirements: [],
      projected_profile_complete: false,
      projected_profile_satisfied_count: 0,
      states_examined: 1,
      candidate_count: 1,
      evaluated_at: "2026-09-11T00:00:00Z",
      method: "fixture",
      legs: [
        {
          candidate_id: "one",
          asset_key: assetKey,
          order_id: "hash",
          quantity: "1",
        },
      ],
    },
    checked_asset_count: 1,
    total_asset_count: 1,
    unavailable_asset_count: 0,
    failed_asset_count: 0,
    candidate_universe_complete: false,
    gas_reserve_per_order_wei: "0",
    assumptions: [],
    updated_at: 1,
    asset_scan_complete: true,
  };
}
function show(
  plan = makePlan(),
  onSettled = jest.fn(),
  onClose = jest.fn(),
  reviewLegs?: readonly ApiCollectPlanLeg[],
  onDiscard?: () => void
) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return {
    ...render(
      <QueryClientProvider client={client}>
        <CollectPlanBasket
          plan={plan}
          onClose={onClose}
          onSettled={onSettled}
          {...(reviewLegs ? { reviewLegs } : {})}
          {...(onDiscard ? { onDiscard } : {})}
        />
      </QueryClientProvider>
    ),
    onSettled,
    onClose,
    client,
  };
}
const check = () =>
  screen.getByRole("button", { name: "Check selected listings" });
beforeEach(() => {
  jest.clearAllMocks();
  resolve.mockResolvedValue([]);
});
it.each([null, "", "invalid", "0x0000000000000000000000000000000000000000"])(
  "explains and blocks invalid destination %s",
  (recipient) => {
    show(makePlan(recipient));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "no valid receiving wallet"
    );
    expect(check()).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Preview selected NFTs’ TDH" })
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Save rule" })
    ).not.toBeInTheDocument();
  }
);

it("allows discarding the unprepared purchase draft before resolving any listing", () => {
  const onDiscard = jest.fn();
  show(makePlan(), jest.fn(), jest.fn(), undefined, onDiscard);
  fireEvent.click(screen.getByRole("button", { name: /^Discard purchase/ }));
  expect(onDiscard).toHaveBeenCalledTimes(1);
  expect(resolve).not.toHaveBeenCalled();
  expect(mockBatch).not.toHaveBeenCalled();
});

it("aborts a read-only listing lookup on discard and ignores its late completion", async () => {
  let complete!: (items: CollectSelectedListing[]) => void;
  resolve.mockReturnValueOnce(
    new Promise((done) => {
      complete = done;
    })
  );
  const onDiscard = jest.fn();
  show(makePlan(), jest.fn(), jest.fn(), undefined, onDiscard);
  fireEvent.click(check());
  await waitFor(() => expect(resolve).toHaveBeenCalledTimes(1));
  const signal = resolve.mock.calls[0]![2];
  fireEvent.click(screen.getByRole("button", { name: /^Discard purchase/ }));
  expect(signal.aborted).toBe(true);
  expect(onDiscard).toHaveBeenCalledTimes(1);
  await act(async () => complete([]));
  expect(mockBatch).not.toHaveBeenCalled();
});

it("does not expose discard once the batch controller has mounted", async () => {
  const onDiscard = jest.fn();
  show(makePlan(), jest.fn(), jest.fn(), undefined, onDiscard);
  fireEvent.click(check());
  await screen.findByRole("region", { name: "Batch review" });
  expect(mockBatch).toHaveBeenCalled();
  expect(
    screen.queryByRole("button", { name: /^Discard purchase/ })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  expect(onDiscard).not.toHaveBeenCalled();
});
it("resolves only chosen exact legs and retains one dialog through review and settlement", async () => {
  const plan = makePlan();
  const first = plan.result.legs[0]!;
  plan.result.legs.push({
    ...first,
    candidate_id: "two",
    order_id: "hash-two",
    asset_key: `${assetKey.slice(0, -1)}2`,
    quantity: "3",
  });
  const items = [{ quantity: "3" }] as CollectSelectedListing[];
  resolve.mockResolvedValue(items);
  const { onSettled } = show(plan);
  const dialog = screen.getByRole("dialog");
  fireEvent.click(screen.getAllByRole("checkbox")[1]!);
  expect(screen.getAllByRole("checkbox")[0]).toBePartiallyChecked();
  fireEvent.click(check());
  await screen.findByRole("region", { name: "Batch review" });
  expect(resolve).toHaveBeenCalledWith(
    [plan.result.legs[1]],
    plan.analysis.account.wallets,
    expect.any(AbortSignal)
  );
  expect(screen.getByRole("dialog")).toBe(dialog);
  expect(mockBatch.mock.calls.at(-1)![0]).toMatchObject({
    items,
    initialRecipient: recipientWallet,
    presentation: "contents",
  });
  expect(onSettled).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirmed purchase" }));
  expect(onSettled).toHaveBeenCalledTimes(1);
});
it("lets the collector select all or none without per-leg purchase actions", () => {
  show();
  fireEvent.click(screen.getAllByRole("checkbox")[0]!);
  expect(check()).toBeDisabled();
  fireEvent.click(screen.getAllByRole("checkbox")[0]!);
  expect(check()).toBeEnabled();
  expect(
    screen.queryByRole("button", { name: "Review purchase" })
  ).not.toBeInTheDocument();
});

it("shows only the requested exact subset and omits full-plan progress and save-rule claims", async () => {
  const plan = makePlan();
  const first = {
    ...plan.result.legs[0]!,
    unit_price_wei: "100000000000000000",
  };
  const second = {
    ...first,
    candidate_id: "two",
    order_id: "hash-two",
    asset_key: `${assetKey.slice(0, -1)}2`,
    quantity: "3",
    unit_price_wei: "200000000000000000",
  };
  plan.result.legs = [first, second];
  plan.result.remaining_requirements = [
    { requirement_id: "missing", missing_quantity: "1" },
  ];
  show(plan, jest.fn(), jest.fn(), [{ ...second }]);
  expect(
    screen.getByRole("heading", { name: "1 of 1 selected" })
  ).toBeInTheDocument();
  expect(
    screen.getByText("Selected listings: 0.6 ETH · gas quoted at review")
  ).toBeInTheDocument();
  expect(
    screen.queryByText("1 requirements remain outside this basket.")
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Save rule" })
  ).not.toBeInTheDocument();
  fireEvent.click(check());
  await waitFor(() =>
    expect(resolve).toHaveBeenCalledWith(
      [second],
      plan.analysis.account.wallets,
      expect.any(AbortSignal)
    )
  );
  expect(resolve.mock.calls[0]?.[0][0]).toBe(second);
});

it("hides full-plan progress and rules when ordinary checkboxes select only some legs", () => {
  const plan = makePlan();
  plan.result.legs.push({
    ...plan.result.legs[0]!,
    candidate_id: "two",
    order_id: "hash-two",
  });
  plan.result.remaining_requirements = [
    { requirement_id: "missing", missing_quantity: "1" },
  ];
  show(plan);
  expect(screen.getByRole("button", { name: "Save rule" })).toBeInTheDocument();
  expect(
    screen.getByText("1 requirements remain outside this basket.")
  ).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("checkbox")[1]!);
  expect(
    screen.queryByRole("button", { name: "Save rule" })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText("1 requirements remain outside this basket.")
  ).not.toBeInTheDocument();
});

it("does not fall back to the full plan when a requested subset has changed terms", () => {
  const plan = makePlan();
  show(plan, jest.fn(), jest.fn(), [
    { ...plan.result.legs[0]!, quantity: "2" },
  ]);
  expect(check()).toBeDisabled();
  expect(
    screen.queryByRole("button", { name: "Save rule" })
  ).not.toBeInTheDocument();
  expect(resolve).not.toHaveBeenCalled();
});

it("aborts old lookup and discards the old review when the same plan’s destination changes", async () => {
  const plan = makePlan();
  let finish!: (items: CollectSelectedListing[]) => void;
  resolve.mockReturnValue(
    new Promise((done) => {
      finish = done;
    })
  );
  const view = show(plan);
  fireEvent.click(check());
  await waitFor(() => expect(resolve).toHaveBeenCalledTimes(1));
  const signal = resolve.mock.calls[0]![2];
  const changed = {
    ...plan,
    result: { ...plan.result, recipient: `0x${"2".repeat(40)}` },
  };
  view.rerender(
    <QueryClientProvider client={view.client}>
      <CollectPlanBasket plan={changed} onClose={view.onClose} />
    </QueryClientProvider>
  );
  expect(signal.aborted).toBe(true);
  await act(async () => finish([]));
  expect(mockBatch).not.toHaveBeenCalled();
  expect(check()).toBeEnabled();
});
it("keeps every over-limit leg selected until the collector reduces it", () => {
  const plan = makePlan();
  plan.result.legs = Array.from({ length: 129 }, (_, index) => ({
    ...plan.result.legs[0]!,
    candidate_id: String(index),
    order_id: String(index),
  }));
  show(plan);
  expect(
    screen.getByRole("heading", { name: "129 of 129 selected" })
  ).toBeInTheDocument();
  expect(check()).toBeDisabled();
  expect(resolve).not.toHaveBeenCalled();
  fireEvent.click(screen.getAllByRole("checkbox")[1]!);
  expect(
    screen.getByRole("heading", { name: "128 of 129 selected" })
  ).toBeInTheDocument();
  expect(check()).toBeEnabled();
});
it("shows a changed-price error and retains selection without entering review", async () => {
  resolve.mockRejectedValue(new Error("PLAN_PRICE_CHANGED"));
  show();
  fireEvent.click(check());
  expect(await screen.findByRole("alert")).toHaveTextContent("price changed");
  expect(mockBatch).not.toHaveBeenCalled();
  expect(screen.getAllByRole("checkbox")[1]).toBeChecked();
});
it.each(["close", "unmount"])(
  "aborts pending lookup on %s and ignores late resolution",
  async (action) => {
    let complete!: (items: CollectSelectedListing[]) => void;
    resolve.mockImplementation(
      () =>
        new Promise((done) => {
          complete = done;
        })
    );
    const view = show();
    fireEvent.click(check());
    await waitFor(() => expect(resolve).toHaveBeenCalledTimes(1));
    const signal = resolve.mock.calls[0]![2];
    if (action === "close") {
      fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
      expect(view.onClose).toHaveBeenCalledTimes(1);
    } else view.unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => complete([]));
    expect(mockBatch).not.toHaveBeenCalled();
  }
);

it("can retry a lookup after closing and resuming while the old request is still unresolved", async () => {
  let finish!: (items: CollectSelectedListing[]) => void;
  resolve.mockReturnValueOnce(
    new Promise((done) => {
      finish = done;
    })
  );
  const view = show();
  fireEvent.click(check());
  await waitFor(() => expect(resolve).toHaveBeenCalledTimes(1));
  const signal = resolve.mock.calls[0]![2];
  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  expect(signal.aborted).toBe(true);
  expect(check()).toBeEnabled();
  fireEvent.click(check());
  await waitFor(() => expect(resolve).toHaveBeenCalledTimes(2));
  await screen.findByRole("region", { name: "Batch review" });
  const reviewed = mockBatch.mock.calls.at(-1);
  await act(async () =>
    finish([{ quantity: "99" }] as CollectSelectedListing[])
  );
  expect(mockBatch.mock.calls.at(-1)).toBe(reviewed);
  expect(view.onClose).toHaveBeenCalledTimes(1);
});
