import {
  fetchGlobalRepCategoryOverview,
  fetchGlobalRepCategoryPage,
  fetchGlobalRepCategoryWaveContributorsPage,
  fetchGlobalRepCategoryWaveOverview,
  fetchGlobalRepCategoryWavesPage,
  fetchSuggestedRepCategories,
  searchGlobalRepCategories,
} from "@/components/rep/categories/globalRepCategory.api";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

describe("globalRepCategory.api", () => {
  const commonApiFetchMock = commonApiFetch as jest.Mock;

  beforeEach(() => {
    commonApiFetchMock.mockReset();
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
      endpoint: "rep/categories",
      params: { param: "bui" },
    });
  });

  it("requests suggested REP categories", async () => {
    commonApiFetchMock.mockResolvedValueOnce([]);

    await fetchSuggestedRepCategories();

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "rep/categories/top",
    });
  });

  it("requests category-wide Wave REP overview", async () => {
    await fetchGlobalRepCategoryWaveOverview("Art, code?");

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "rep/categories/Art%2C%20code%3F/wave-overview",
    });
  });

  it("requests category-wide Wave REP waves", async () => {
    await fetchGlobalRepCategoryWavesPage({
      category: "Art, code?",
      sort: "rep_asc",
      page: 2,
    });

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "rep/categories/Art%2C%20code%3F/waves",
      params: {
        order: "ASC",
        order_by: "rep",
        page: "2",
        page_size: "25",
      },
    });
  });

  it("requests category-wide Wave REP contributors", async () => {
    await fetchGlobalRepCategoryWaveContributorsPage({
      category: "Art, code?",
      sort: "recent",
      page: 2,
    });

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "rep/categories/Art%2C%20code%3F/wave-contributors",
      params: {
        order: "DESC",
        order_by: "last_modified",
        page: "2",
        page_size: "25",
      },
    });
  });
});
