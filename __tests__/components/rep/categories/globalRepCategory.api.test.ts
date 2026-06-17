import {
  fetchWaveRepCategoryContributors,
  fetchWaveRepCategorySummary,
  fetchGlobalRepCategoryOverview,
  fetchGlobalRepCategoryPage,
  searchGlobalRepCategories,
} from "@/components/rep/categories/globalRepCategory.api";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

describe("globalRepCategory.api", () => {
  const commonApiFetchMock = commonApiFetch as jest.Mock;

  beforeEach(() => {
    commonApiFetchMock.mockResolvedValue({ data: [], page: 1, next: false });
  });

  it("encodes category names in overview endpoint paths", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      category: "Dev extraordinaire",
    });

    await fetchGlobalRepCategoryOverview("Dev extraordinaire");

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "rep/categories/Dev%20extraordinaire/overview",
    });
  });

  it("requests recipients with server-side REP ascending sort", async () => {
    await fetchGlobalRepCategoryPage({
      category: "Art, code?",
      tab: "recipients",
      sort: "rep_asc",
      page: 3,
    });

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "rep/categories/Art%2C%20code%3F/recipients",
      params: {
        order: "ASC",
        order_by: "rep",
        page: "3",
        page_size: "25",
      },
    });
  });

  it("forces recent ratings to last modified descending", async () => {
    await fetchGlobalRepCategoryPage({
      category: "Builder",
      tab: "recent",
      sort: "rep_asc",
      page: 1,
    });

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "rep/categories/Builder/ratings",
      params: {
        order: "DESC",
        order_by: "last_modified",
        page: "1",
        page_size: "25",
      },
    });
  });

  it("searches global REP categories", async () => {
    commonApiFetchMock.mockResolvedValueOnce(["Builder"]);

    await expect(searchGlobalRepCategories("bui")).resolves.toEqual([
      "Builder",
    ]);

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "/rep/categories",
      params: { param: "bui" },
    });
  });

  it("finds a wave REP category summary from the wave category page", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      page: 1,
      next: false,
      data: [
        {
          category: "Builder",
          total_rep: 10,
          contributor_count: 2,
          authenticated_user_contribution: null,
          top_contributors: [],
        },
      ],
    });

    await expect(
      fetchWaveRepCategorySummary({
        waveId: "wave-1",
        category: "builder",
      })
    ).resolves.toEqual({
      category: "Builder",
      total_rep: 10,
      contributor_count: 2,
      authenticated_user_contribution: null,
      top_contributors: [],
    });

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "waves/wave-1/rep/categories",
      params: {
        page: "1",
        page_size: "100",
        top_contributors_limit: "5",
      },
    });
  });

  it("requests wave REP category contributors", async () => {
    await fetchWaveRepCategoryContributors({
      waveId: "wave-1",
      category: "Art, code?",
      page: 2,
    });

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "waves/wave-1/rep/categories/Art%2C%20code%3F/contributors",
      params: {
        page: "2",
        page_size: "25",
      },
    });
  });
});
