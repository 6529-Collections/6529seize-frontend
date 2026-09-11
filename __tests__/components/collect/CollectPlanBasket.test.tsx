import CollectPlanBasket from "@/components/collect/CollectPlanBasket";
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
    const plan: ApiCollectPlan = {
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
