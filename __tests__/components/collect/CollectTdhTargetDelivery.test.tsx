import CollectTdhTargetDelivery from "@/components/collect/CollectTdhTargetDelivery";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useIdentity } from "@/hooks/useIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  TARGET_PRIMARY,
  TARGET_CUSTODY,
  targetProfile,
} from "./collect-tdh-target.fixture";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/hooks/useIdentity", () => ({ useIdentity: jest.fn() }));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/helpers/server.helpers", () => ({ getUserProfile: jest.fn() }));
jest.mock("@/components/nft-transfer/TransferModalPfp", () => () => null);
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useIdentity).mockReturnValue({ profile: null, isLoading: false });
});
function mount(profile: ApiIdentity = targetProfile) {
  const onChange = jest.fn();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  render(
    <QueryClientProvider client={client}>
      <CollectTdhTargetDelivery
        profile={profile}
        value={TARGET_PRIMARY}
        onChange={onChange}
      />
    </QueryClientProvider>
  );
  return onChange;
}
it("starts compact, then uses the mint selector for all confirmed profile wallets with full addresses", () => {
  const onChange = mount();
  expect(screen.getByText("collector.eth")).toHaveAttribute(
    "title",
    TARGET_PRIMARY
  );
  expect(
    screen.queryByRole("button", { name: /custody.eth/ })
  ).not.toBeInTheDocument();
  const change = screen.getByRole("button", { name: "Change" });
  fireEvent.click(change);
  expect(
    screen.getByRole("button", { name: /collector.eth 0x5290/i })
  ).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByText(TARGET_CUSTODY)).toBeVisible();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.queryByText("Send to a fren")).not.toBeInTheDocument();
  expect(commonApiFetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: /custody.eth/ }));
  expect(onChange).toHaveBeenCalledWith(TARGET_CUSTODY);
  expect(change).toHaveFocus();
  expect(change).toHaveAttribute("aria-expanded", "false");
});
it("retains a valid primary wallet when optional wallet membership is omitted", () => {
  const { wallets: _wallets, ...withoutWallets } = targetProfile;
  mount(withoutWallets);
  fireEvent.click(screen.getByRole("button", { name: "Change" }));
  expect(screen.getByText(TARGET_PRIMARY)).toBeVisible();
  expect(commonApiFetch).not.toHaveBeenCalled();
});
