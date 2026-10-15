import {
  fetchTokenData,
  getContentView,
} from "@/app/nextgen/token/[token]/[[...view]]/page-utils";
import { NextgenCollectionView } from "@/types/enums";

jest.mock("@/services/api/common-api", () => ({
  ...jest.requireActual("@/services/api/common-api"),
  commonApiFetch: jest.fn(),
}));
jest.mock("@/helpers/Helpers", () => ({ isEmptyObject: jest.fn(() => false) }));

const { commonApiFetch } = require("@/services/api/common-api");
const { isEmptyObject } = require("@/helpers/Helpers");

const apiError = (status: number) =>
  Object.assign(new Error(`HTTP ${status}`), { status });

function mockEndpoints(responses: Record<string, unknown>) {
  (commonApiFetch as jest.Mock).mockImplementation(
    async ({ endpoint }: { endpoint: string }) => {
      if (!(endpoint in responses)) {
        throw apiError(404);
      }
      const response = responses[endpoint];
      if (response instanceof Error) {
        throw response;
      }
      return response;
    }
  );
}

const endpointsCalled = () =>
  (commonApiFetch as jest.Mock).mock.calls.map(
    ([params]: [{ endpoint: string }]) => params.endpoint
  );

describe("token utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isEmptyObject as jest.Mock).mockReturnValue(false);
  });

  it("fetchTokenData returns data", async () => {
    mockEndpoints({
      "nextgen/tokens/1": { id: 1, name: "Tok", collection_id: 2 },
      "nextgen/tokens/1/traits": [{ token_count: 5 }],
      "nextgen/collections/2": { id: 2, name: "Coll" },
    });
    const data = await fetchTokenData("1", {});
    expect(data?.token?.id).toBe(1);
    expect(data?.tokenCount).toBe(5);
    expect(data?.collection.id).toBe(2);
  });

  it("requests every endpoint with structured errors and the given headers", async () => {
    mockEndpoints({
      "nextgen/tokens/1": { id: 1, collection_id: 2 },
      "nextgen/tokens/1/traits": [],
      "nextgen/collections/2": { id: 2 },
    });
    await fetchTokenData("1", { "x-test": "1" });
    expect(commonApiFetch).toHaveBeenCalledTimes(3);
    for (const [params] of (commonApiFetch as jest.Mock).mock.calls) {
      expect(params).toMatchObject({
        errorMode: "structured",
        headers: { "x-test": "1" },
      });
    }
  });

  it("loads traits and the collection in parallel once the token is known", async () => {
    const pending: Record<string, () => void> = {};
    const payloads: Record<string, unknown> = {
      "nextgen/tokens/1": { id: 1, collection_id: 2 },
      "nextgen/tokens/1/traits": [{ token_count: 3 }],
      "nextgen/collections/2": { id: 2 },
    };
    (commonApiFetch as jest.Mock).mockImplementation(
      ({ endpoint }: { endpoint: string }) =>
        new Promise((resolve) => {
          pending[endpoint] = () => resolve(payloads[endpoint]);
        })
    );

    const result = fetchTokenData("1", {});
    expect(Object.keys(pending)).toEqual(["nextgen/tokens/1"]);

    pending["nextgen/tokens/1"]?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
    // Both dependent requests are in flight before either one resolves.
    expect(Object.keys(pending).sort()).toEqual([
      "nextgen/collections/2",
      "nextgen/tokens/1",
      "nextgen/tokens/1/traits",
    ]);

    pending["nextgen/collections/2"]?.();
    pending["nextgen/tokens/1/traits"]?.();
    await expect(result).resolves.toMatchObject({ tokenCount: 3 });
  });

  it("returns null when collection empty", async () => {
    mockEndpoints({
      "nextgen/tokens/5": { id: 5, collection_id: 0 },
      "nextgen/tokens/5/traits": [],
      "nextgen/collections/0": {},
    });
    (isEmptyObject as jest.Mock).mockReturnValue(true);
    const data = await fetchTokenData("5", {});
    expect(data).toBeNull();
  });

  it("returns null when the collection is a real 404", async () => {
    mockEndpoints({
      "nextgen/tokens/10000000042": { id: 10000000042, collection_id: 1 },
      "nextgen/tokens/10000000042/traits": [],
    });
    await expect(fetchTokenData("10000000042", {})).resolves.toBeNull();
  });

  it("falls back to the id-derived collection when the token is a 404", async () => {
    mockEndpoints({
      "nextgen/collections/1": { id: 1, name: "Coll" },
    });
    const data = await fetchTokenData("10000000042", {});
    expect(data).toMatchObject({
      tokenId: 10000000042,
      token: null,
      traits: [],
      tokenCount: 0,
      collection: { id: 1 },
    });
    expect(endpointsCalled()).toEqual([
      "nextgen/tokens/10000000042",
      "nextgen/collections/1",
    ]);
  });

  it("treats a pending token as not minted yet", async () => {
    mockEndpoints({
      "nextgen/tokens/10000000042": {
        id: 10000000042,
        collection_id: 1,
        pending: true,
      },
      "nextgen/collections/1": { id: 1, name: "Coll" },
    });
    const data = await fetchTokenData("10000000042", {});
    expect(data?.token).toBeNull();
    expect(endpointsCalled()).not.toContain("nextgen/tokens/10000000042/traits");
  });

  it("keeps an empty trait list when the traits endpoint is a 404", async () => {
    mockEndpoints({
      "nextgen/tokens/1": { id: 1, collection_id: 2 },
      "nextgen/collections/2": { id: 2 },
    });
    const data = await fetchTokenData("1", {});
    expect(data?.traits).toEqual([]);
    expect(data?.tokenCount).toBe(0);
  });

  it("returns null for malformed token ids without calling the API", async () => {
    await expect(fetchTokenData("not-a-token", {})).resolves.toBeNull();
    await expect(fetchTokenData("12abc", {})).resolves.toBeNull();
    expect(commonApiFetch).not.toHaveBeenCalled();
  });

  describe.each([500, 502, 503, 429])("when the API answers %s", (status) => {
    it("rethrows a token lookup failure instead of reporting not found", async () => {
      const error = apiError(status);
      mockEndpoints({ "nextgen/tokens/1": error });
      await expect(fetchTokenData("1", {})).rejects.toBe(error);
    });

    it("rethrows a traits failure", async () => {
      const error = apiError(status);
      mockEndpoints({
        "nextgen/tokens/1": { id: 1, collection_id: 2 },
        "nextgen/tokens/1/traits": error,
        "nextgen/collections/2": { id: 2 },
      });
      await expect(fetchTokenData("1", {})).rejects.toBe(error);
    });

    it("rethrows a collection failure", async () => {
      const error = apiError(status);
      mockEndpoints({
        "nextgen/tokens/1": { id: 1, collection_id: 2 },
        "nextgen/tokens/1/traits": [],
        "nextgen/collections/2": error,
      });
      await expect(fetchTokenData("1", {})).rejects.toBe(error);
    });
  });

  it("rethrows network failures", async () => {
    const error = new TypeError("Failed to fetch");
    mockEndpoints({ "nextgen/tokens/1": error });
    await expect(fetchTokenData("1", {})).rejects.toBe(error);
  });

  it("maps content view", () => {
    expect(getContentView("provenance")).toBe(NextgenCollectionView.PROVENANCE);
    expect(getContentView("unknown")).toBe(NextgenCollectionView.ABOUT);
    expect(getContentView("listings-and-offers")).toBe(
      NextgenCollectionView.LISTINGS_AND_OFFERS
    );
    expect(getContentView("display-center")).toBe(
      NextgenCollectionView.DISPLAY_CENTER
    );
    expect(getContentView("rarity")).toBe(NextgenCollectionView.RARITY);
  });
});
