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
  useQuery: () => ({ data: mockAnalysis }),
}));
beforeEach(() => {
  jest.clearAllMocks();
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
