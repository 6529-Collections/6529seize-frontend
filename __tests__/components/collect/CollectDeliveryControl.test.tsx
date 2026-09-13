import CollectDeliveryControl from "@/components/collect/CollectDeliveryControl";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useIdentity } from "@/hooks/useIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { getAddress } from "viem";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/hooks/useIdentity", () => ({ useIdentity: jest.fn() }));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/helpers/server.helpers", () => ({ getUserProfile: jest.fn() }));
jest.mock("@/components/nft-transfer/TransferModalPfp", () => () => null);

const payer = "0x2222222222222222222222222222222222222222";
const custody = "0xde709f2102306220921060314715629080e2fb77";
function setup(disabled = false) {
  const props: ComponentProps<typeof CollectDeliveryControl> = {
    profile: {
      id: "profile",
      primary_wallet: payer,
      handle: "collector",
      level: 12,
      tdh: 1500,
      wallets: [
        { wallet: payer, display: "collector.eth", tdh: 1000 },
        { wallet: custody, display: "custody.collector.eth", tdh: 500 },
      ],
    } as ApiIdentity,
    payingWallet: payer,
    value: payer,
    onChange: jest.fn(),
    errorId: "delivery-error",
    disabled,
  };
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  render(
    <QueryClientProvider client={client}>
      <CollectDeliveryControl {...props} />
    </QueryClientProvider>
  );
  return props;
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useIdentity).mockReturnValue({ profile: null, isLoading: false });
  jest.mocked(commonApiFetch).mockResolvedValue([]);
});

it("uses the same compact profile and wallet context before review and restores Change focus", async () => {
  const user = userEvent.setup();
  const props = setup();
  await user.click(screen.getByRole("button", { name: "Change" }));
  expect(screen.getByText("Profile level 12")).toBeVisible();
  expect(screen.getByText("Profile TDH: 1,500")).toBeVisible();
  const destination = screen.getByRole("button", {
    name: /^custody.collector.eth /,
  });
  expect(destination).toHaveAccessibleDescription("Wallet TDH: 500");
  await user.click(destination);
  expect(props.onChange).toHaveBeenCalledWith(getAddress(custody));
  expect(commonApiFetch).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Done" }));
  expect(screen.getByRole("button", { name: "Change" })).toHaveFocus();
  expect(screen.queryByText("Profile level 12")).not.toBeInTheDocument();
});

it("does not mount or change a destination while the form is disabled", async () => {
  const user = userEvent.setup();
  const props = setup(true);
  await user.click(screen.getByRole("button", { name: "Change" }));
  expect(screen.queryByText("Profile level 12")).not.toBeInTheDocument();
  expect(props.onChange).not.toHaveBeenCalled();
});
