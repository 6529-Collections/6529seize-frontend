import NextGenArtPage, {
  generateMetadata as generateArtMetadata,
} from "@/app/nextgen/collection/[collection]/art/page";
import NextGenCollectionPage, {
  generateMetadata as generateCollectionMetadata,
} from "@/app/nextgen/collection/[collection]/[[...view]]/page";
import NextGenTokenPage, {
  generateMetadata as generateTokenMetadata,
} from "@/app/nextgen/token/[token]/[[...view]]/page";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { commonApiFetch } from "@/services/api/common-api";

// Stand-in for React's request-scoped `cache`: results are memoized by
// argument identity until `resetRequestMemos()` starts a "new request".
// (React's own `cache` is a pass-through outside a server render.)
type MemoRegistry = Array<() => void>;
const registry = (): MemoRegistry => {
  const holder = globalThis as { __nextgenRequestMemos?: MemoRegistry };
  holder.__nextgenRequestMemos ??= [];
  return holder.__nextgenRequestMemos;
};
const resetRequestMemos = () => registry().forEach((reset) => reset());

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    cache: (fn: (...args: unknown[]) => unknown) => {
      const holder = globalThis as {
        __nextgenRequestMemos?: Array<() => void>;
      };
      holder.__nextgenRequestMemos ??= [];
      const entries: Array<{ args: unknown[]; value: unknown }> = [];
      holder.__nextgenRequestMemos.push(() => {
        entries.length = 0;
      });
      return (...args: unknown[]) => {
        const hit = entries.find(
          (entry) =>
            entry.args.length === args.length &&
            entry.args.every((arg, index) => Object.is(arg, args[index]))
        );
        if (hit) {
          return hit.value;
        }
        const value = fn(...args);
        entries.push({ args, value });
        return value;
      };
    },
  };
});

jest.mock("@/services/api/common-api", () => ({
  ...jest.requireActual("@/services/api/common-api"),
  commonApiFetch: jest.fn(),
}));

// Every call returns a fresh object, like the real helper, so any sharing
// between metadata and page has to come from the request-scoped wrapper.
jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn(async () => ({ "x-test": "1" })),
}));

jest.mock("@/app/nextgen/token/[token]/[[...view]]/NextGenTokenPageClient", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollection",
  () => ({ __esModule: true, default: () => null })
);
jest.mock(
  "@/components/nextGen/collections/collectionParts/art/NextGenCollectionArtPage",
  () => ({ __esModule: true, default: () => null })
);
jest.mock("@/app/nextgen/collection/[collection]/CollectionPageShell", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/lib/structured-data/nextgen", () => ({
  buildNextgenCollectionPageJsonLd: () => ({}),
  buildNextgenTokenPageJsonLd: () => ({}),
}));

const collection = {
  id: 1,
  name: "Pebbles",
  artist: "6529er",
  banner: "",
  image: "",
};
const token = {
  id: 10000000042,
  collection_id: 1,
  name: "Pebble #42",
  normalised_id: 42,
  pending: false,
};

const fetchCounts = () => {
  const counts: Record<string, number> = {};
  for (const [params] of jest.mocked(commonApiFetch).mock.calls) {
    counts[params.endpoint] = (counts[params.endpoint] ?? 0) + 1;
  }
  return counts;
};

const searchParams = Promise.resolve({});

describe("NextGen request-scoped loading", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRequestMemos();
    jest.mocked(commonApiFetch).mockImplementation(async ({ endpoint }) => {
      if (endpoint === "nextgen/tokens/10000000042") return token;
      if (endpoint === "nextgen/tokens/10000000042/traits") {
        return [{ token_count: 100 }];
      }
      if (endpoint === "nextgen/collections/1") return collection;
      if (endpoint === "nextgen/collections/pebbles") return collection;
      throw Object.assign(new Error("not found"), { status: 404 });
    });
  });

  it("loads a token, its traits and its collection once for metadata and page", async () => {
    const params = Promise.resolve({ token: "10000000042" });

    await generateTokenMetadata({ params });
    await NextGenTokenPage({ params, searchParams });

    expect(fetchCounts()).toEqual({
      "nextgen/tokens/10000000042": 1,
      "nextgen/tokens/10000000042/traits": 1,
      "nextgen/collections/1": 1,
    });
    expect(getAppCommonHeaders).toHaveBeenCalledTimes(1);
  });

  it("loads a collection once for the overview metadata and page", async () => {
    const params = Promise.resolve({ collection: "pebbles" });

    await generateCollectionMetadata({ params });
    await NextGenCollectionPage({ params });

    expect(fetchCounts()).toEqual({ "nextgen/collections/pebbles": 1 });
  });

  it("loads a collection once for a sub-route's metadata and page", async () => {
    const params = Promise.resolve({ collection: "pebbles" });

    await generateArtMetadata({ params });
    await NextGenArtPage({ params });

    expect(fetchCounts()).toEqual({ "nextgen/collections/pebbles": 1 });
  });

  it("dedupes callers that start in the same tick", async () => {
    const collectionParams = Promise.resolve({ collection: "pebbles" });
    await Promise.all([
      generateCollectionMetadata({ params: collectionParams }),
      NextGenCollectionPage({ params: collectionParams }),
    ]);
    expect(fetchCounts()).toEqual({ "nextgen/collections/pebbles": 1 });

    jest.clearAllMocks();
    resetRequestMemos();
    const tokenParams = Promise.resolve({ token: "10000000042" });
    await Promise.all([
      generateTokenMetadata({ params: tokenParams }),
      NextGenTokenPage({ params: tokenParams, searchParams }),
    ]);
    expect(fetchCounts()).toEqual({
      "nextgen/tokens/10000000042": 1,
      "nextgen/tokens/10000000042/traits": 1,
      "nextgen/collections/1": 1,
    });
  });

  it("shares nothing between requests", async () => {
    const params = Promise.resolve({ collection: "pebbles" });

    await NextGenCollectionPage({ params });
    resetRequestMemos();
    await NextGenCollectionPage({ params });

    expect(fetchCounts()).toEqual({ "nextgen/collections/pebbles": 2 });
    expect(getAppCommonHeaders).toHaveBeenCalledTimes(2);
  });

  it("reuses a failed load for the second caller within a request", async () => {
    const error = Object.assign(new Error("down"), { status: 503 });
    jest.mocked(commonApiFetch).mockRejectedValue(error);
    const params = Promise.resolve({ collection: "pebbles" });

    await expect(generateCollectionMetadata({ params })).rejects.toBe(error);
    await expect(NextGenCollectionPage({ params })).rejects.toBe(error);

    expect(fetchCounts()).toEqual({ "nextgen/collections/pebbles": 1 });
  });
});
