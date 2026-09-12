import CollectDetailActions from "@/components/collect/CollectDetailActions";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { CollectTradeAction } from "@/components/collect/collect.types";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";

const mockFetchAssets = jest.fn();
const mockControllerRender = jest.fn();
let mockSuspendedController: Promise<void> | null = null;
let mockHidePurchasing = false;
const mockAuth = {
  connectedProfile: {
    id: "profile-one",
    wallets: [{ wallet: "0x1111111111111111111111111111111111111111" }],
  },
};
jest.mock("@/components/auth/Auth", () => ({ useAuth: () => mockAuth }));
jest.mock("@/hooks/useNftPurchasingVisibility", () => ({
  useNftPurchasingVisibility: () => ({
    hideNftPurchasing: mockHidePurchasing,
    shouldRedirect: false,
  }),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/hooks/useIsMobileLayoutViewport", () => ({
  __esModule: true,
  default: () => false,
}));
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: () => false,
}));
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: { COLLECT_ASSETS: "collect-assets" },
}));
jest.mock("@/services/api/collect-api", () => ({
  fetchCollectAssets: (...args: unknown[]) => mockFetchAssets(...args),
}));
jest.mock("@/components/collect/CollectOwnerAction", () => ({
  __esModule: true,
  default: ({ onList }: { onList: (trigger: HTMLButtonElement) => void }) => (
    <button onClick={(event) => onList(event.currentTarget)}>List</button>
  ),
}));
jest.mock("@/components/collect/CollectTradeController", () => ({
  __esModule: true,
  default: function MockController({
    asset,
    action,
    onClose,
    onMarketChange,
    presentation,
    layout,
    secondaryActions,
  }: {
    asset: ApiCollectAsset;
    action: CollectTradeAction;
    onClose: () => void;
    onMarketChange?: () => void;
    presentation?: string;
    layout?: string;
    secondaryActions?: ReactNode;
  }) {
    const [reviewed, setReviewed] = useState(false);
    mockControllerRender();
    if (mockSuspendedController) throw mockSuspendedController;
    return (
      <div
        data-testid={layout === "inline-buy" ? "inline-trade" : "trade"}
        data-asset={asset.asset_key}
        data-action={action}
        data-presentation={presentation}
        data-reviewed={reviewed}
      >
        {layout === "inline-buy" && <button>Collect</button>}
        {layout === "inline-buy" && secondaryActions}
        <button onClick={onClose}>Close trade</button>
        <button onClick={onMarketChange}>Market changed</button>
        <button onClick={() => setReviewed(true)}>Prepare review</button>
      </div>
    );
  },
}));
const asset: ApiCollectAsset = {
  asset_key: `1:${MEMES_CONTRACT.toLowerCase()}:5`,
  chain_id: 1,
  contract: MEMES_CONTRACT,
  token_id: "5",
  family: ApiCollectFamily.Memes,
  name: "Meme Five",
  image_url: null,
  artist_ids: [],
  season: 1,
  traits: [],
  hodl_rate: 1,
  tdh_eligible: true,
};
function renderActions(tokenId = "5", onMarketChange?: () => void) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const content = (token: string) => (
    <QueryClientProvider client={client}>
      <CollectDetailActions
        collection="memes"
        tokenId={token}
        title="Meme Five"
        locale="en-US"
        {...(onMarketChange ? { onMarketChange } : {})}
      />
    </QueryClientProvider>
  );
  return { ...render(content(tokenId)), content };
}
async function openOffer() {
  const user = userEvent.setup();
  const trigger = await screen.findByRole("button", {
    name: "Make an offer: Meme Five",
  });
  await user.click(trigger);
  return {
    user,
    trigger,
    dialog: await screen.findByRole("dialog", { name: "Meme Five" }),
  };
}
beforeEach(() => {
  jest.clearAllMocks();
  mockHidePurchasing = false;
  mockSuspendedController = null;
  mockAuth.connectedProfile.id = "profile-one";
  mockAuth.connectedProfile.wallets = [
    { wallet: "0x1111111111111111111111111111111111111111" },
  ];
  mockFetchAssets.mockResolvedValue({ data: [asset] });
});
it("loads canonical inline Collect without a modal or initial Collect click", async () => {
  renderActions();
  const trade = await screen.findByTestId("inline-trade");
  expect(trade).toHaveAttribute("data-asset", asset.asset_key);
  expect(trade).toHaveAttribute("data-action", "buy");
  expect(trade).toHaveAttribute("data-presentation", "contents");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Collect Meme Five" })
  ).not.toBeInTheDocument();
  expect(mockFetchAssets).toHaveBeenCalledWith({
    family: ApiCollectFamily.Memes,
    query: "5",
    page: 1,
    signal: expect.any(AbortSignal),
  });
});
it("keeps one modal and inert background while an offer waits for shared canonical lookup", async () => {
  let finish: ((value: { data: ApiCollectAsset[] }) => void) | undefined;
  mockFetchAssets.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  const view = renderActions();
  const { dialog } = await openOffer();
  expect(within(dialog).getByRole("status")).toBeVisible();
  await waitFor(() => {
    expect(view.container.inert).toBe(true);
    expect(dialog.contains(document.activeElement)).toBe(true);
  });
  await act(async () => {
    finish?.({ data: [asset] });
  });
  expect(await within(dialog).findByTestId("trade")).toHaveAttribute(
    "data-action",
    "offer"
  );
  expect(screen.getAllByRole("dialog")).toHaveLength(1);
  expect(screen.getByRole("dialog")).toBe(dialog);
  expect(view.container.inert).toBe(true);
});
it("keeps lazy offer loading inside its existing modal", async () => {
  let finish: (() => void) | undefined;
  mockSuspendedController = new Promise<void>((resolve) => {
    finish = resolve;
  });
  renderActions();
  const { dialog } = await openOffer();
  await waitFor(() => expect(mockControllerRender).toHaveBeenCalled());
  expect(within(dialog).getByRole("status")).toBeVisible();
  await act(async () => {
    mockSuspendedController = null;
    finish?.();
  });
  expect(await within(dialog).findByTestId("trade")).toBeInTheDocument();
  expect(screen.getAllByRole("dialog")).toHaveLength(1);
  expect(screen.getByRole("dialog")).toBe(dialog);
});
it("does not reopen an escaped offer when suspended content resolves", async () => {
  let finish: (() => void) | undefined;
  mockSuspendedController = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const view = renderActions();
  const { user, trigger } = await openOffer();
  await user.keyboard("{Escape}");
  await waitFor(() => {
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(Boolean(view.container.inert)).toBe(false);
  });
  await act(async () => {
    mockSuspendedController = null;
    finish?.();
  });
  expect(await screen.findByTestId("inline-trade")).toBeInTheDocument();
  expect(screen.queryByTestId("trade")).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});
it("preserves iOS purchasing gate before any query or action", () => {
  mockHidePurchasing = true;
  renderActions();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(mockFetchAssets).not.toHaveBeenCalled();
});
it("refreshes the enclosing market from inline Collect and owner listing", async () => {
  const changed = jest.fn();
  renderActions("5", changed);
  fireEvent.click(
    within(await screen.findByTestId("inline-trade")).getByRole("button", {
      name: "Market changed",
    })
  );
  const trigger = screen.getByRole("button", { name: "List" });
  fireEvent.click(trigger);
  const trade = await screen.findByTestId("trade");
  expect(trade).toHaveAttribute("data-action", "list");
  fireEvent.click(
    within(trade).getByRole("button", { name: "Market changed" })
  );
  expect(changed).toHaveBeenCalledTimes(2);
  fireEvent.click(within(trade).getByRole("button", { name: "Close trade" }));
  await waitFor(() => expect(trigger).toHaveFocus());
});
it("selects exact token after a page of numeric-name search matches", async () => {
  mockFetchAssets.mockResolvedValueOnce({
    data: [
      {
        ...asset,
        token_id: "50",
        asset_key: `1:${MEMES_CONTRACT.toLowerCase()}:50`,
      },
    ],
    next: true,
    count: 2,
  });
  renderActions();
  expect(await screen.findByTestId("inline-trade")).toHaveAttribute(
    "data-asset",
    asset.asset_key
  );
  expect(mockFetchAssets.mock.calls.map(([options]) => options.page)).toEqual([
    1, 2,
  ]);
  expect(mockFetchAssets.mock.calls[1][0].signal).toBe(
    mockFetchAssets.mock.calls[0][0].signal
  );
});
it("orders the native actions Collect, Make an offer, then List", async () => {
  renderActions();
  const trade = await screen.findByTestId("inline-trade");
  const collect = within(trade).getByRole("button", { name: "Collect" });
  const offer = screen.getByRole("button", {
    name: "Make an offer: Meme Five",
  });
  const list = await screen.findByRole("button", { name: "List" });
  expect(collect.compareDocumentPosition(offer)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING
  );
  expect(offer.compareDocumentPosition(list)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING
  );
});
it("stops a catalog repeatedly returning another token", async () => {
  mockFetchAssets.mockResolvedValue({
    data: [
      {
        ...asset,
        token_id: "50",
        asset_key: `1:${MEMES_CONTRACT.toLowerCase()}:50`,
      },
    ],
    next: true,
    count: 100_000,
  });
  renderActions();
  await screen.findByRole("alert");
  expect(mockFetchAssets).toHaveBeenCalledTimes(2);
  expect(screen.queryByTestId("inline-trade")).not.toBeInTheDocument();
});
it.each<Partial<ApiCollectAsset>>([
  { token_id: "50" },
  { family: ApiCollectFamily.Gradients },
  { chain_id: 137 },
  { contract: "0x1111111111111111111111111111111111111111" },
  { asset_key: `${asset.asset_key}:extra` },
])("rejects page identity disagreement: %j", async (mismatch) => {
  mockFetchAssets.mockResolvedValue({ data: [{ ...asset, ...mismatch }] });
  renderActions();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This artwork could not be loaded for trading"
  );
  expect(screen.queryByTestId("inline-trade")).not.toBeInTheDocument();
});
it("retries inline lookup failure without another action", async () => {
  mockFetchAssets.mockRejectedValueOnce(new Error("temporary failure"));
  renderActions();
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByTestId("inline-trade")).toHaveAttribute(
    "data-asset",
    asset.asset_key
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it.each(["loading", "error"])(
  "returns focus after closing offer %s",
  async (state) => {
    if (state === "loading")
      mockFetchAssets.mockImplementation(() => new Promise(() => undefined));
    else mockFetchAssets.mockRejectedValue(new Error("temporary failure"));
    renderActions();
    const { dialog, trigger, user } = await openOffer();
    await within(dialog).findByRole(state === "loading" ? "status" : "alert");
    // Finish the dialog's scheduled opening focus before keyboard interaction.
    await act(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    });
    const close = within(dialog).getByRole("button", { name: "Close" });
    close.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  }
);
it("aborts old artwork lookup and never opens a modal after navigation", async () => {
  let finishOld: ((value: { data: ApiCollectAsset[] }) => void) | undefined;
  mockFetchAssets.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishOld = resolve;
      })
  );
  mockFetchAssets.mockImplementation(() => new Promise(() => undefined));
  const view = renderActions();
  await screen.findByRole("status");
  const signal = mockFetchAssets.mock.calls[0][0].signal as AbortSignal;
  view.rerender(view.content("6"));
  expect(signal.aborted).toBe(true);
  await act(async () => {
    finishOld?.({ data: [asset] });
  });
  expect(screen.queryByTestId("inline-trade")).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(mockFetchAssets).toHaveBeenCalledTimes(2);
});
it.each(["profile", "membership"])(
  "discards prepared inline state when %s changes",
  async (changed) => {
    const view = renderActions();
    const trade = await screen.findByTestId("inline-trade");
    fireEvent.click(
      within(trade).getByRole("button", { name: "Prepare review" })
    );
    expect(trade).toHaveAttribute("data-reviewed", "true");
    if (changed === "profile") mockAuth.connectedProfile.id = "profile-two";
    else mockAuth.connectedProfile.wallets = [];
    view.rerender(view.content("5"));
    expect(await screen.findByTestId("inline-trade")).toHaveAttribute(
      "data-reviewed",
      "false"
    );
  }
);
