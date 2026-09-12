import CollectGoalsController from "@/components/collect/CollectGoalsController";
import type { ApiCollectCatalog } from "@/generated/models/ApiCollectCatalog";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";

const mockCreate = jest.fn();
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/collect-api", () => ({
  createCollectPlan: (...args: unknown[]) => mockCreate(...args),
  advanceCollectPlan: jest.fn(),
}));
jest.mock("@/components/collect/CollectDeliveryControl", () => ({
  __esModule: true,
  default: () => null,
}));

const catalog: ApiCollectCatalog = {
  version: "v1",
  chain_id: 1,
  seasons: [{ id: 1, name: "Season 1", asset_keys: ["one"], current: false }],
  artists: [],
  pebbles_traits: [],
  tdh_snapshot: null,
};
const props: ComponentProps<typeof CollectGoalsController> = {
  draft: {
    intent: "season",
    definitionId: "1",
    targetCount: "2",
    budgetEth: "1.25",
    horizonDays: "30",
    includeCollaborations: true,
  },
  catalog: undefined,
  profile: {
    id: "profile",
    handle: "collector",
    primary_wallet: "0x1111111111111111111111111111111111111111",
  } as ApiIdentity,
  onChange: jest.fn(),
  onPlan: jest.fn(),
  onConnect: jest.fn(),
};

function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<CollectGoalsController {...props} />, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

beforeEach(() => jest.clearAllMocks());

it("keeps catalog loading distinct from an empty goal and blocks premature submission", () => {
  const { rerender } = mount();
  expect(screen.getByText("Loading collecting options…")).toHaveAttribute(
    "role",
    "status"
  );
  expect(
    screen.queryByText("No targets are available for this goal yet.")
  ).not.toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Season" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Build my plan" })).toBeDisabled();
  fireEvent.submit(screen.getByRole("form"));
  expect(mockCreate).not.toHaveBeenCalled();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();

  rerender(<CollectGoalsController {...props} catalog={catalog} />);
  expect(
    screen.queryByText("Loading collecting options…")
  ).not.toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Season" })).toHaveValue(
    "Season 1"
  );
  expect(screen.getByRole("button", { name: "Build my plan" })).toBeEnabled();
  expect(screen.getByLabelText("Copies per NFT")).toHaveValue("2");
  expect(screen.getByLabelText("Budget cap (ETH, optional)")).toHaveValue(
    "1.25"
  );
});

it("offers a retry after catalog failure without reporting an empty collection", () => {
  const { rerender } = mount();
  const retry = jest.fn();
  rerender(
    <CollectGoalsController {...props} catalogFailed onRetryCatalog={retry} />
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "The catalog could not be loaded"
  );
  expect(
    screen.queryByText("No targets are available for this goal yet.")
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Build my plan" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(retry).toHaveBeenCalledTimes(1);
  expect(mockCreate).not.toHaveBeenCalled();
  rerender(
    <CollectGoalsController
      {...props}
      catalogFailed={false}
      onRetryCatalog={retry}
    />
  );
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByText("Loading collecting options…")).toBeVisible();
});

it("reports a genuinely empty loaded goal and keeps its submission disabled", () => {
  const { rerender } = mount();
  rerender(
    <CollectGoalsController {...props} catalog={{ ...catalog, seasons: [] }} />
  );
  expect(
    screen.getByText("No targets are available for this goal yet.")
  ).toBeVisible();
  expect(
    screen.queryByText("Loading collecting options…")
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Build my plan" })).toBeDisabled();
  fireEvent.submit(screen.getByRole("form"));
  expect(mockCreate).not.toHaveBeenCalled();
});

it("keeps usable cached targets available after a background refetch fails", () => {
  const { rerender } = mount();
  rerender(
    <CollectGoalsController {...props} catalog={catalog} catalogFailed />
  );
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Season" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Build my plan" })).toBeEnabled();
});
