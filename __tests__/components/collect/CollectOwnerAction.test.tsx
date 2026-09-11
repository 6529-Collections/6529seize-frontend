import CollectOwnerAction from "@/components/collect/CollectOwnerAction";
import { fireEvent, render, screen } from "@testing-library/react";

const payer = "0x1111111111111111111111111111111111111111";
const owner = "0x2222222222222222222222222222222222222222";
const asset = "1:0x33fd426905f149f8376e227d0c9d3340aad17af1:1";
let mockProfile: {
  id: string;
  wallets: { wallet: string; display: string; tdh: number }[];
} | null;
let mockAddress = payer;
let mockAnalysis:
  | {
      account: { profile_id: string };
      requirements: {
        holdings: { asset_key: string; wallet: string; quantity: string }[];
      }[];
    }
  | undefined;
const mockSwitch = jest.fn();
const mockConnect = jest.fn();
const mockRefetch = jest.fn();
let mockIsPending = false;
let mockIsError = false;
let mockIsFetching = false;
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: mockProfile }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: mockAddress,
    connectedAccounts: [{ address: owner }],
    seizeSwitchConnectedAccount: mockSwitch,
    seizeConnect: mockConnect,
  }),
}));
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: { COLLECT_ANALYSIS: "collect-analysis" },
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/collect-api", () => ({
  fetchCollectAssetOwnership: jest.fn(),
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: mockAnalysis,
    isPending: mockIsPending,
    isError: mockIsError,
    isFetching: mockIsFetching,
    refetch: mockRefetch,
  }),
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockIsPending = false;
  mockIsError = false;
  mockIsFetching = false;
  mockAddress = payer;
  mockProfile = {
    id: "profile",
    wallets: [
      { wallet: payer, display: "payer.eth", tdh: 1 },
      { wallet: owner, display: "custody.eth", tdh: 1 },
    ],
  };
  mockAnalysis = {
    account: { profile_id: "profile" },
    requirements: [
      { holdings: [{ asset_key: asset, wallet: owner, quantity: "2" }] },
    ],
  };
});
it("shows listing for an NFT held by another confirmed profile wallet and requires switching to its owner", () => {
  const onList = jest.fn();
  const { rerender } = render(
    <CollectOwnerAction assetKey={asset} onList={onList} />
  );
  fireEvent.click(screen.getByRole("button", { name: "List for sale" }));
  expect(onList).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: new RegExp("custody.eth") })
  );
  expect(mockSwitch).toHaveBeenCalledWith(owner);
  mockAddress = owner;
  rerender(<CollectOwnerAction assetKey={asset} onList={onList} />);
  const trigger = screen.getByRole("button", { name: "List for sale" });
  fireEvent.click(trigger);
  expect(onList).toHaveBeenCalledWith(trigger);
});
it("never treats stale other-profile or other-asset holdings as ownership", () => {
  const onList = jest.fn();
  mockAnalysis!.account.profile_id = "other";
  const { rerender } = render(
    <CollectOwnerAction assetKey={asset} onList={onList} />
  );
  expect(
    screen.queryByRole("button", { name: "List for sale" })
  ).not.toBeInTheDocument();
  mockAnalysis!.account.profile_id = "profile";
  rerender(<CollectOwnerAction assetKey={`${asset}0`} onList={onList} />);
  expect(
    screen.queryByRole("button", { name: "List for sale" })
  ).not.toBeInTheDocument();
});
it("keeps List for sale discoverable for guests and opens the connection flow", () => {
  mockProfile = null;
  const onList = jest.fn();
  render(<CollectOwnerAction assetKey={asset} onList={onList} />);
  fireEvent.click(screen.getByRole("button", { name: "List for sale" }));
  expect(mockConnect).toHaveBeenCalledTimes(1);
  expect(onList).not.toHaveBeenCalled();
});

it("shows a disabled listing action while checking ownership", () => {
  mockAnalysis = undefined;
  mockIsPending = true;
  mockIsFetching = true;
  const onList = jest.fn();
  render(<CollectOwnerAction assetKey={asset} onList={onList} />);
  const button = screen.getByRole("button", { name: "List for sale" });
  expect(button).toBeDisabled();
  expect(button).toHaveAccessibleDescription("Checking ownership…");
  expect(screen.getByRole("status")).toHaveTextContent("Checking ownership…");
  fireEvent.click(button);
  expect(onList).not.toHaveBeenCalled();
  expect(mockConnect).not.toHaveBeenCalled();
});

it.each([true, false])(
  "shows a retry after ownership failure with cached ownership %s without opening listing",
  (hasCachedOwnership) => {
    mockIsError = true;
    mockAddress = owner;
    if (!hasCachedOwnership) mockAnalysis = undefined;
    const onList = jest.fn();
    const { rerender } = render(
      <CollectOwnerAction assetKey={asset} onList={onList} />
    );
    const list = screen.getByRole("button", { name: "List for sale" });
    expect(list).toBeDisabled();
    expect(list).toHaveAccessibleDescription("Ownership could not be checked.");
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Ownership could not be checked.");
    fireEvent.click(list);
    fireEvent.click(
      screen.getByRole("button", { name: "Retry ownership check" })
    );
    expect(mockRefetch).toHaveBeenCalledTimes(1);
    expect(onList).not.toHaveBeenCalled();
    expect(mockConnect).not.toHaveBeenCalled();
    expect(mockSwitch).not.toHaveBeenCalled();

    mockIsFetching = true;
    rerender(<CollectOwnerAction assetKey={asset} onList={onList} />);
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent("Checking ownership…");
    expect(
      screen.getByRole("button", { name: "Retry ownership check" })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "List for sale" })
    ).toBeDisabled();
  }
);

it("restores listing only after a successful ownership retry", () => {
  mockIsError = true;
  mockAddress = owner;
  const onList = jest.fn();
  const { rerender } = render(
    <CollectOwnerAction assetKey={asset} onList={onList} />
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Retry ownership check" })
  );
  mockIsError = false;
  rerender(<CollectOwnerAction assetKey={asset} onList={onList} />);
  const list = screen.getByRole("button", { name: "List for sale" });
  expect(list).toBeEnabled();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  fireEvent.click(list);
  expect(onList).toHaveBeenCalledWith(list);
});

it("keeps confirmed non-owners and profiles without eligible wallets quiet", () => {
  mockAnalysis!.requirements[0]!.holdings = [];
  const { rerender, container } = render(
    <CollectOwnerAction assetKey={asset} onList={jest.fn()} />
  );
  expect(container).toBeEmptyDOMElement();
  mockProfile!.wallets = [];
  mockAnalysis = undefined;
  mockIsPending = true;
  rerender(<CollectOwnerAction assetKey={asset} onList={jest.fn()} />);
  expect(container).toBeEmptyDOMElement();
});
