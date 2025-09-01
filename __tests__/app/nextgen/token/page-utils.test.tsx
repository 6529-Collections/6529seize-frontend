import {
  fetchTokenData,
  getContentView,
} from "@/app/nextgen/token/[token]/[[...view]]/page-utils";
import { NextgenCollectionView } from "@/enums";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/helpers/Helpers", () => ({ isEmptyObject: jest.fn(() => false) }));

const { commonApiFetch } = require("@/services/api/common-api");
const { isEmptyObject } = require("@/helpers/Helpers");

describe("token utils", () => {
  beforeEach(() => jest.clearAllMocks());

  it("fetchTokenData returns data", async () => {
    (commonApiFetch as jest.Mock).mockImplementation(async ({ endpoint }) => {
      if (endpoint === "nextgen/tokens/1")
        return { id: 1, name: "Tok", collection_id: 2 };
      if (endpoint === "nextgen/tokens/1/traits") return [{ token_count: 5 }];
      if (endpoint === "nextgen/collections/2") return { id: 2, name: "Coll" };
    });
    const data = await fetchTokenData("1", {});
    expect(data?.token?.id).toBe(1);
    expect(data?.tokenCount).toBe(5);
  });

  it("returns null when collection empty", async () => {
    (commonApiFetch as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    (isEmptyObject as jest.Mock).mockReturnValue(true);
    const data = await fetchTokenData("5", {});
    expect(data).toBeNull();
  });

  it("maps content view", () => {
    expect(getContentView("provenance")).toBe(NextgenCollectionView.PROVENANCE);
    expect(getContentView("unknown")).toBe(NextgenCollectionView.ABOUT);
  });
});
