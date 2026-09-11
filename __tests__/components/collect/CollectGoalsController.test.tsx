import CollectGoalsController from "@/components/collect/CollectGoalsController";
import type CollectGoalForm from "@/components/collect/CollectGoalForm";
import type { ComponentProps } from "react";
import type { ApiCollectCatalog } from "@/generated/models/ApiCollectCatalog";
import type { ApiCollectPlan } from "@/generated/models/ApiCollectPlan";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

const mockCreate = jest.fn();
const mockAdvance = jest.fn();
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/collect-api", () => ({
  createCollectPlan: (...args: unknown[]) => mockCreate(...args),
  advanceCollectPlan: (...args: unknown[]) => mockAdvance(...args),
}));
jest.mock("@/components/collect/CollectGoalForm", () => ({
  __esModule: true,
  default: (props: ComponentProps<typeof CollectGoalForm>) => (
    <button
      disabled={props.loading}
      onClick={() => props.onSubmit(props.draft)}
    >
      Preview plan
    </button>
  ),
}));
jest.mock("@/components/collect/CollectRecipientPicker", () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <label>
      Delivery address
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  ),
}));
const address = "0x1111111111111111111111111111111111111111";
const scanning = {
  id: "plan",
  state: "SCANNING",
  profile_id: "profile",
  checked_asset_count: 0,
  total_asset_count: 2,
} as ApiCollectPlan;
const ready = {
  ...scanning,
  state: "READY",
  checked_asset_count: 2,
} as ApiCollectPlan;
const catalog: ApiCollectCatalog = {
  version: "v1",
  chain_id: 1,
  seasons: [
    { id: 1, name: "Season1", asset_keys: ["one", "two"], current: false },
  ],
  artists: [],
  pebbles_traits: [],
  tdh_snapshot: null,
};
function mount(onPlan: jest.Mock, budgetEth = "1.25") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <CollectGoalsController
        draft={{
          intent: "season",
          definitionId: "1",
          targetCount: "2",
          budgetEth,
          horizonDays: "30",
          includeCollaborations: true,
        }}
        catalog={catalog}
        profile={{ id: "profile", primary_wallet: address } as ApiIdentity}
        onChange={jest.fn()}
        onPlan={onPlan}
        onConnect={jest.fn()}
      />
    </QueryClientProvider>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  mockCreate.mockResolvedValue(scanning);
  mockAdvance.mockResolvedValue(ready);
});
it.each(["", "not-a-number", "1e3", "0", "-1", "1.0000000000000000001"])(
  "rejects invalid controller budget %s before parsing or requesting a plan",
  (budgetEth) => {
    const onPlan = jest.fn();
    mount(onPlan, budgetEth);
    fireEvent.click(screen.getByRole("button", { name: "Preview plan" }));
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockAdvance).not.toHaveBeenCalled();
    expect(onPlan).not.toHaveBeenCalled();
  }
);
it("sends a profile goal and separate recipient, then advances the catalog scan to a ready plan", async () => {
  const onPlan = jest.fn();
  mount(onPlan);
  fireEvent.click(screen.getByRole("button", { name: "Preview plan" }));
  await waitFor(() =>
    expect(mockCreate).toHaveBeenCalledWith(
      {
        goal: {
          profile_id: "profile",
          kind: "memes_season",
          catalog_version: "v1",
          target_copies: "2",
          season_id: 1,
        },
        options: { budget_wei: "1250000000000000000", recipient: address },
      },
      expect.anything()
    )
  );
  await waitFor(() => expect(onPlan).toHaveBeenLastCalledWith(ready));
  expect(mockAdvance).toHaveBeenCalledTimes(1);
});
it("cannot replace a changed destination with an earlier in-flight plan response", async () => {
  let finish: ((value: ApiCollectPlan) => void) | undefined;
  mockAdvance.mockImplementation(
    () =>
      new Promise<ApiCollectPlan>((resolve) => {
        finish = resolve;
      })
  );
  const onPlan = jest.fn();
  mount(onPlan);
  fireEvent.click(screen.getByRole("button", { name: "Preview plan" }));
  await waitFor(() => expect(mockAdvance).toHaveBeenCalled());
  fireEvent.change(screen.getByLabelText("Delivery address"), {
    target: { value: "0x2222222222222222222222222222222222222222" },
  });
  await act(async () => {
    finish?.(ready);
  });
  expect(onPlan).toHaveBeenLastCalledWith(null);
});

it("backs off a stalled scan, stops after a bounded batch, and resumes only on retry", async () => {
  jest.useFakeTimers();
  try {
    mockAdvance.mockImplementation(async () => ({ ...scanning }));
    const onPlan = jest.fn();
    mount(onPlan);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Preview plan" }));
    });
    await act(async () => jest.advanceTimersByTimeAsync(349));
    expect(mockAdvance).not.toHaveBeenCalled();
    await act(async () => jest.advanceTimersByTimeAsync(1));
    expect(mockAdvance).toHaveBeenCalledTimes(1);
    await act(async () => jest.advanceTimersByTimeAsync(699));
    expect(mockAdvance).toHaveBeenCalledTimes(1);
    await act(async () => jest.advanceTimersByTimeAsync(1));
    expect(mockAdvance).toHaveBeenCalledTimes(2);
    for (let attempt = 2; attempt < 8; attempt += 1) {
      await act(async () => jest.advanceTimersByTimeAsync(5000));
    }
    expect(mockAdvance).toHaveBeenCalledTimes(8);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await act(async () => jest.advanceTimersByTimeAsync(60000));
    expect(mockAdvance).toHaveBeenCalledTimes(8);
    mockAdvance.mockResolvedValue(ready);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await act(async () => jest.advanceTimersByTimeAsync(350));
    expect(onPlan).toHaveBeenLastCalledWith(ready);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }
});

it("keeps large scans moving promptly while checked assets advance", async () => {
  jest.useFakeTimers();
  try {
    let checked = 0;
    mockAdvance.mockImplementation(async () => {
      checked += 1;
      return {
        ...scanning,
        state: checked === 12 ? "READY" : "SCANNING",
        checked_asset_count: checked,
        total_asset_count: 12,
      };
    });
    const onPlan = jest.fn();
    mount(onPlan);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Preview plan" }));
    });
    for (let attempt = 0; attempt < 12; attempt += 1) {
      await act(async () => jest.advanceTimersByTimeAsync(350));
    }
    expect(mockAdvance).toHaveBeenCalledTimes(12);
    expect(onPlan).toHaveBeenLastCalledWith(
      expect.objectContaining({ state: "READY", checked_asset_count: 12 })
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }
});
