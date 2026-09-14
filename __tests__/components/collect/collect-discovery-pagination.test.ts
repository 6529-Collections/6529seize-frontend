import { fetchMarketListings } from "@/services/api/market-api";
import { fetchCollectTdhListings } from "@/services/api/collect-api";
import { commonApiFetch } from "../../../services/api/common-api";
import { ApiCollectPlanningFamily } from "@/generated/models/ApiCollectPlanningFamily";

jest.unmock("@/services/api/market-api");
jest.unmock("@/services/api/collect-api");
jest.mock("../../../services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));
it.each([fetchMarketListings, fetchCollectTdhListings])(
  "requests 48 listings and retains the exact next-page cursor and abort signal",
  async (fetchPage) => {
    const signal = new AbortController().signal;
    await fetchPage(
      ApiCollectPlanningFamily.Gradients,
      "snapshot:next",
      signal
    );
    expect(commonApiFetch).toHaveBeenLastCalledWith(
      expect.objectContaining({
        params: { family: "gradients", limit: "48", cursor: "snapshot:next" },
        signal,
        cache: "no-store",
      })
    );
  }
);
