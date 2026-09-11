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
} from "@testing-library/react";
import type { CollectTradeAction } from "@/components/collect/collect.types";
import userEvent from "@testing-library/user-event";

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
jest.mock("@/components/collect/CollectTradeController", () => ({
  __esModule: true,
  default: ({
    asset,
    action,
    onClose,
    onMarketChange,
    presentation,
  }: {
    asset: ApiCollectAsset;
    action: CollectTradeAction;
    onClose: () => void;
    onMarketChange?: () => void;
    presentation?: string;
  }) => {
    mockControllerRender();
    if (mockSuspendedController) throw mockSuspendedController;
    return (
      <div
        data-testid="trade"
        data-asset={asset.asset_key}
        data-action={action}
        data-presentation={presentation}
      >
        <button onClick={onClose}>Close trade</button>
        <button onClick={onMarketChange}>Market changed</button>
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

it("opens one modal immediately and keeps it through the canonical lookup", async () => {
  let finish: ((value: { data: ApiCollectAsset[] }) => void) | undefined;
  mockFetchAssets.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  const view = renderActions();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Collect Meme Five" }));
  const dialog = screen.getByRole("dialog", { name: "Meme Five" });
  expect(dialog).toContainElement(screen.getByRole("status"));
  expect(screen.queryByTestId("trade")).not.toBeInTheDocument();
  await waitFor(() => {
    expect(view.container.inert).toBe(true);
    expect(dialog).toContainElement(document.activeElement);
  });
  await act(async () => {
    finish?.({ data: [asset] });
  });
  expect(await screen.findByTestId("trade")).toHaveAttribute(
    "data-presentation",
    "contents"
  );
  expect(screen.getAllByRole("dialog")).toHaveLength(1);
  expect(screen.getByRole("dialog")).toBe(dialog);
  expect(view.container.inert).toBe(true);
});

it("keeps lazy trade loading inside the existing modal without another opening", async () => {
  let finish: (() => void) | undefined;
  mockSuspendedController = new Promise<void>((resolve) => {
    finish = resolve;
  });
  renderActions();
  fireEvent.click(screen.getByRole("button", { name: "Collect Meme Five" }));
  const dialog = screen.getByRole("dialog", { name: "Meme Five" });
  await waitFor(() => expect(mockControllerRender).toHaveBeenCalled());
  expect(dialog).toContainElement(screen.getByRole("status"));
  expect(screen.queryByTestId("trade")).not.toBeInTheDocument();
  await act(async () => {
    mockSuspendedController = null;
    finish?.();
  });
  expect(await screen.findByTestId("trade")).toBeInTheDocument();
  expect(screen.getAllByRole("dialog")).toHaveLength(1);
  expect(screen.getByRole("dialog")).toBe(dialog);
});

it("discards suspended trade content when Escape closes the intent", async () => {
  let finish: (() => void) | undefined;
  mockSuspendedController = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const view = renderActions();
  const trigger = screen.getByRole("button", { name: "Collect Meme Five" });
  const user = userEvent.setup();
  await user.click(trigger);
  await screen.findByRole("status");
  await waitFor(() => expect(mockControllerRender).toHaveBeenCalled());
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
  expect(screen.queryByTestId("trade")).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

it("does not mount the dialog or begin lookup when purchasing is hidden", () => {
  mockHidePurchasing = true;
  renderActions();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(mockFetchAssets).not.toHaveBeenCalled();
});

it("refreshes the enclosing artwork market on a reported trading change", async () => {
  const changed = jest.fn();
  renderActions("5", changed);
  fireEvent.click(screen.getByRole("button", { name: "Collect Meme Five" }));
  await screen.findByTestId("trade");
  expect(changed).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Market changed" }));
  expect(changed).toHaveBeenCalledTimes(1);
});

it("loads the canonical artwork only after an explicit action and reviews it in place", async () => {
  renderActions();
  expect(mockFetchAssets).not.toHaveBeenCalled();
  expect(screen.queryByTestId("trade")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Collect Meme Five" }));
  expect(await screen.findByTestId("trade")).toHaveAttribute(
    "data-asset",
    asset.asset_key
  );
  expect(screen.getByTestId("trade")).toHaveAttribute("data-action", "buy");
  expect(mockFetchAssets).toHaveBeenCalledWith({
    family: ApiCollectFamily.Memes,
    query: "5",
    page: 1,
    signal: expect.any(AbortSignal),
  });
  fireEvent.click(screen.getByRole("button", { name: "Close trade" }));
  expect(screen.queryByTestId("trade")).not.toBeInTheDocument();
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Collect Meme Five" })
    ).toHaveFocus()
  );
});

it("selects an exact token rather than the first catalog search match", async () => {
  mockFetchAssets.mockResolvedValue({
    data: [
      {
        ...asset,
        token_id: "50",
        asset_key: `1:${MEMES_CONTRACT.toLowerCase()}:50`,
      },
      asset,
    ],
  });
  renderActions();
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", { name: "More trading actions for Meme Five" })
  );
  await user.click(
    await screen.findByRole("menuitem", { name: "Make an offer: Meme Five" })
  );
  expect(await screen.findByTestId("trade")).toHaveAttribute(
    "data-asset",
    asset.asset_key
  );
  expect(screen.getByTestId("trade")).toHaveAttribute("data-action", "offer");
});

it("finds the exact token on a later search page when names also match the token ID", async () => {
  mockFetchAssets.mockResolvedValueOnce({
    data: [
      {
        ...asset,
        token_id: "50",
        asset_key: `1:${MEMES_CONTRACT.toLowerCase()}:50`,
      },
    ],
    page: 1,
    next: true,
    count: 2,
  });
  renderActions();
  fireEvent.click(screen.getByRole("button", { name: "Collect Meme Five" }));
  expect(await screen.findByTestId("trade")).toHaveAttribute(
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

it("stops a catalog that continually returns another matching token", async () => {
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
  fireEvent.click(screen.getByRole("button", { name: "Collect Meme Five" }));
  await screen.findByRole("alert");
  expect(mockFetchAssets).toHaveBeenCalledTimes(2);
  expect(screen.queryByTestId("trade")).not.toBeInTheDocument();
});

it.each<Partial<ApiCollectAsset>>([
  { token_id: "50" },
  { family: ApiCollectFamily.Gradients },
  { chain_id: 137 },
  { contract: "0x1111111111111111111111111111111111111111" },
  { asset_key: `${asset.asset_key}:extra` },
])(
  "does not review a catalog asset whose identity disagrees with the page: %j",
  async (mismatch) => {
    mockFetchAssets.mockResolvedValue({ data: [{ ...asset, ...mismatch }] });
    renderActions();
    fireEvent.click(screen.getByRole("button", { name: "Collect Meme Five" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This artwork could not be loaded for trading"
    );
    expect(screen.queryByTestId("trade")).not.toBeInTheDocument();
  }
);

it("allows a failed lookup to be retried without a second trade action", async () => {
  mockFetchAssets.mockRejectedValueOnce(new Error("temporary failure"));
  renderActions();
  fireEvent.click(screen.getByRole("button", { name: "Collect Meme Five" }));
  const dialog = screen.getByRole("dialog", { name: "Meme Five" });
  await screen.findByRole("alert");
  expect(dialog).toContainElement(screen.getByRole("alert"));
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByTestId("trade")).toHaveAttribute(
    "data-asset",
    asset.asset_key
  );
  expect(screen.getAllByRole("dialog")).toHaveLength(1);
  expect(screen.getByRole("dialog")).toBe(dialog);
});

it("cancels the pending lookup when the user closes it", async () => {
  let finish: ((value: { data: ApiCollectAsset[] }) => void) | undefined;
  mockFetchAssets.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  renderActions();
  fireEvent.click(screen.getByRole("button", { name: "Collect Meme Five" }));
  await screen.findByRole("status");
  const signal = mockFetchAssets.mock.calls[0][0].signal as AbortSignal;
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(signal.aborted).toBe(true);
  await act(async () => {
    finish?.({ data: [asset] });
  });
  expect(screen.queryByTestId("trade")).not.toBeInTheDocument();
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Collect Meme Five" })
    ).toHaveFocus()
  );
});

it.each(["loading", "error"])(
  "returns focus to the overflow trigger after closing the modal's %s state",
  async (state) => {
    if (state === "loading")
      mockFetchAssets.mockImplementation(() => new Promise(() => undefined));
    else mockFetchAssets.mockRejectedValueOnce(new Error("temporary failure"));
    renderActions();
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", {
      name: "More trading actions for Meme Five",
    });
    await user.click(trigger);
    await user.click(
      await screen.findByRole("menuitem", { name: "Make an offer: Meme Five" })
    );
    await screen.findByRole(state === "loading" ? "status" : "alert");
    const close = screen.getByRole("button", { name: "Close" });
    close.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(
      screen.queryByRole("button", { name: "Close" })
    ).not.toBeInTheDocument();
  }
);

it("does not open a previous artwork when its pending lookup finishes after navigation", async () => {
  let finish: ((value: { data: ApiCollectAsset[] }) => void) | undefined;
  mockFetchAssets.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  const view = renderActions();
  fireEvent.click(screen.getByRole("button", { name: "Collect Meme Five" }));
  await screen.findByRole("status");
  const signal = mockFetchAssets.mock.calls[0][0].signal as AbortSignal;
  view.rerender(view.content("6"));
  expect(signal.aborted).toBe(true);
  await act(async () => {
    finish?.({ data: [asset] });
  });
  expect(screen.queryByTestId("trade")).not.toBeInTheDocument();
  expect(mockFetchAssets).toHaveBeenCalledTimes(1);
});

it.each(["profile", "membership", "token"])(
  "clears the review when the %s changes",
  async (changed) => {
    const view = renderActions();
    fireEvent.click(screen.getByRole("button", { name: "Collect Meme Five" }));
    await screen.findByTestId("trade");
    if (changed === "profile") mockAuth.connectedProfile.id = "profile-two";
    if (changed === "membership") mockAuth.connectedProfile.wallets = [];
    view.rerender(view.content(changed === "token" ? "6" : "5"));
    await waitFor(() =>
      expect(screen.queryByTestId("trade")).not.toBeInTheDocument()
    );
    expect(mockFetchAssets).toHaveBeenCalledTimes(1);
  }
);
