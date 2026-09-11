import CollectPlanBasket from "@/components/collect/CollectPlanBasket";
import type { ApiCollectPlan } from "@/generated/models/ApiCollectPlan";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
jest.mock("@/components/collect/CollectSaveRule", () => ({
  __esModule: true,
  default: () => <button>Save rule</button>,
}));
const assetKey = "1:0x33fd426905f149f8376e227d0c9d3340aad17af1:1";
it.each([null, "", "invalid", "0x0000000000000000000000000000000000000000"])(
  "explains and blocks a plan with invalid destination %s",
  (recipient) => {
    const client = new QueryClient();
    const plan = {
      id: "plan",
      profile_id: "profile",
      result: {
        recipient,
        total_cost_wei: "1",
        remaining_requirements: [],
        legs: [
          {
            candidate_id: "one",
            asset_key: assetKey,
            order_id: "hash",
            quantity: "1",
          },
        ],
      },
    } as ApiCollectPlan;
    render(
      <QueryClientProvider client={client}>
        <CollectPlanBasket
          plan={plan}
          onClose={jest.fn()}
          onPurchase={jest.fn()}
        />
      </QueryClientProvider>
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "no valid receiving wallet"
    );
    expect(
      screen.getByRole("button", { name: "Review purchase" })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Preview this basket’s TDH" })
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Save rule" })
    ).not.toBeInTheDocument();
  }
);
