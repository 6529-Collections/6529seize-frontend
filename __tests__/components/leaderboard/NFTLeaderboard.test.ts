import {
  buildNftCollectorsCsv,
  fetchAllNftTdhResults,
  fetchNftTdhResults,
  setScrollPosition,
  PAGE_SIZE,
} from "@/components/leaderboard/NFTLeaderboard";
import { cicToType } from "@/helpers/Helpers";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api");
jest.mock("@/helpers/Helpers", () => ({
  cicToType: jest.fn().mockReturnValue("TYPE"),
}));

beforeEach(() => {
  jest.clearAllMocks();
  (cicToType as jest.Mock).mockReturnValue("TYPE");
});

const baseCollector = {
  id: 1,
  contract: "0xabc",
  handle: "alice",
  pfp_url: "",
  consolidation_key: "0xalice",
  consolidation_display: "Alice Display",
  balance: 2,
  tdh: 3,
  boost: 1,
  boosted_tdh: 4.5,
  tdh__raw: 5.5,
  tdh_rank: 10,
  total_balance: 20,
  total_tdh: 30,
  total_tdh__raw: 40.5,
  total_boosted_tdh: 50.5,
  rep_score: 0,
  cic_score: 1,
  primary_wallet: "0xprimary",
  level: 1,
};

describe("fetchNftTdhResults", () => {
  it("fetches data and converts cic type", async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue({
      count: 1,
      page: 1,
      next: null,
      data: [{ id: 1, cic_score: 10 }],
    });
    const result = await fetchNftTdhResults({
      contract: "0x",
      nftId: 1,
      walletFilter: "",
      page: 2,
      sort: "balance",
      sortDirection: "ASC",
    });
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: `tdh/nft/0x/1?&page_size=${PAGE_SIZE}&page=2&sort=balance&sort_direction=ASC`,
    });
    expect(cicToType).toHaveBeenCalledWith(10);
    expect(result.data[0]).toHaveProperty("cic_type", "TYPE");
  });
});

describe("setScrollPosition", () => {
  it("scrolls when needed", () => {
    document.body.innerHTML =
      '<div id="nft-leaderboard" style="height:10px"></div>';
    const elem = document.getElementById("nft-leaderboard") as HTMLElement;
    Object.defineProperty(elem, "offsetTop", { value: 50 });
    Object.defineProperty(window, "scrollY", { value: 5, writable: true });
    const spy = jest.spyOn(window, "scrollTo").mockImplementation();
    setScrollPosition();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("does not scroll when already at top", () => {
    document.body.innerHTML = '<div id="nft-leaderboard"></div>';
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
    const spy = jest.spyOn(window, "scrollTo").mockImplementation();
    setScrollPosition();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("fetchNftTdhResults multiple entries", () => {
  it("converts cic_type for each entry", async () => {
    (cicToType as jest.Mock).mockClear();
    (commonApiFetch as jest.Mock).mockResolvedValue({
      count: 2,
      page: 1,
      next: null,
      data: [
        { id: 1, cic_score: 1 },
        { id: 2, cic_score: 2 },
      ],
    });
    (cicToType as jest.Mock).mockImplementation((score) => `T${score}`);

    const result = await fetchNftTdhResults({
      contract: "0xdef",
      nftId: 1,
      walletFilter: "",
      page: 1,
      sort: "balance",
      sortDirection: "DESC",
    });
    expect(cicToType).toHaveBeenCalledTimes(2);
    expect(result.data[0]?.cic_type).toBe("T1");
    expect(result.data[1]?.cic_type).toBe("T2");
  });
});

describe("setScrollPosition", () => {
  it("handles missing element gracefully", () => {
    document.body.innerHTML = "";
    const spy = jest.spyOn(window, "scrollTo").mockImplementation();
    setScrollPosition();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("fetchNftTdhResults wallet filter", () => {
  it("adds search param when wallets provided", async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue({
      count: 0,
      page: 1,
      next: null,
      data: [],
    });
    await fetchNftTdhResults({
      contract: "0xabc",
      nftId: 2,
      walletFilter: "&search=0x1",
      page: 1,
      sort: "balance",
      sortDirection: "ASC",
    });
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: `tdh/nft/0xabc/2?&search=0x1&page_size=${PAGE_SIZE}&page=1&sort=balance&sort_direction=ASC`,
    });
  });
});

describe("fetchAllNftTdhResults", () => {
  it("fetches every page with the same filters and sort", async () => {
    (commonApiFetch as jest.Mock)
      .mockResolvedValueOnce({
        count: PAGE_SIZE + 1,
        page: 1,
        next: null,
        data: [{ ...baseCollector, id: 1 }],
      })
      .mockResolvedValueOnce({
        count: PAGE_SIZE + 1,
        page: 2,
        next: null,
        data: [{ ...baseCollector, id: 2, handle: "bob" }],
      });

    const results = await fetchAllNftTdhResults({
      contract: "0xabc",
      nftId: 7,
      walletFilter: "&search=0x1",
      sort: "balance",
      sortDirection: "DESC",
    });

    expect(results).toHaveLength(2);
    expect(commonApiFetch).toHaveBeenNthCalledWith(1, {
      endpoint: `tdh/nft/0xabc/7?&search=0x1&page_size=${PAGE_SIZE}&page=1&sort=balance&sort_direction=DESC`,
    });
    expect(commonApiFetch).toHaveBeenNthCalledWith(2, {
      endpoint: `tdh/nft/0xabc/7?&search=0x1&page_size=${PAGE_SIZE}&page=2&sort=balance&sort_direction=DESC`,
    });
  });
});

describe("buildNftCollectorsCsv", () => {
  it("builds escaped collector rows with export columns", () => {
    const csv = buildNftCollectorsCsv(
      [
        {
          ...baseCollector,
          handle: 'alice, "collector"',
          primary_wallet: "0xwallet",
        },
      ],
      false
    );

    expect(csv).toBe(
      "rank,collector,primary_wallet,balance,card_tdh,card_unweighted_tdh,total_balance,total_tdh,total_unweighted_tdh\n" +
        '1,"alice, ""collector""",0xwallet,2,4.5,5.5,20,50.5,40.5\n'
    );
  });

  it("uses the API TDH rank for search-filtered exports", () => {
    const csv = buildNftCollectorsCsv(
      [{ ...baseCollector, tdh_rank: 42 }],
      true
    );

    expect(csv.split("\n")[1]?.startsWith("42,")).toBe(true);
  });
});
