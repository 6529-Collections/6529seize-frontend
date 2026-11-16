import MemePage, { generateMetadata } from "@/app/the-memes/[id]/page";
import { generateMetadata as generateDistributionMetadata } from "@/app/the-memes/[id]/distribution/page";
import { resolveMemeRoute } from "@/app/the-memes/[id]/memeRouteResolution";
import {
  getCanonicalNextMintNumber,
  getCardsRemainingUntilEndOf,
  getUpcomingMintsAcrossSeasons,
  isMintEligibleUtcDay,
} from "@/components/meme-calendar/meme-calendar.helpers";
import { getSharedAppServerSideProps } from "@/components/the-memes/MemeShared";
import { MEMES_CONTRACT } from "@/constants/constants";
import { fetchUrl } from "@/services/6529api";
import { render, screen } from "@testing-library/react";

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  cache: (fn: unknown) => fn,
}));
jest.mock("@/services/6529api", () => ({ fetchUrl: jest.fn() }));
jest.mock("@/components/meme-calendar/meme-calendar.helpers", () => ({
  getCanonicalNextMintNumber: jest.fn(),
  getCardsRemainingUntilEndOf: jest.fn(),
  getUpcomingMintsAcrossSeasons: jest.fn(),
  isMintEligibleUtcDay: jest.fn(),
}));
jest.mock("@/components/the-memes/MemeShared", () => ({
  getSharedAppServerSideProps: jest.fn(),
  MEME_FOCUS: { LIVE: "live" },
}));
jest.mock("@/components/the-memes/MemePage", () => ({
  __esModule: true,
  default: ({
    nftId,
    initialData,
  }: {
    readonly nftId: string;
    readonly initialData?: { readonly nftNotFound?: boolean };
  }) => (
    <div
      data-testid="meme-page"
      data-token={nftId}
      data-upcoming={initialData?.nftNotFound}
    />
  ),
}));
jest.mock("@/components/distribution/Distribution", () => ({
  __esModule: true,
  default: () => null,
}));

const scheduledRows = (memes: readonly number[]) =>
  memes.map((meme) => ({
    meme,
    utcDay: new Date("2026-11-16T00:00:00Z"),
    instantUtc: new Date("2026-11-16T15:40:00Z"),
    seasonIndex: 16,
  }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(fetchUrl).mockResolvedValue({ data: [] });
  jest.mocked(getCanonicalNextMintNumber).mockReturnValue(575);
  jest.mocked(getCardsRemainingUntilEndOf).mockReturnValue(2);
  jest.mocked(isMintEligibleUtcDay).mockReturnValue(true);
  jest
    .mocked(getUpcomingMintsAcrossSeasons)
    .mockReturnValue(scheduledRows([575, 576, 577]));
  jest.mocked(getSharedAppServerSideProps).mockResolvedValue({
    title: "The Memes card",
    robots: { index: true, follow: true },
  });
});

it.each([
  ["575", "published-upcoming"],
  ["576", "scheduled-upcoming"],
  ["577", "scheduled-upcoming"],
  ["574", "missing"],
  ["578", "missing"],
  ["999999999", "missing"],
])("resolves unindexed Meme %s as %s", async (id, kind) => {
  await expect(resolveMemeRoute(id)).resolves.toEqual({ kind });
  expect(fetchUrl).toHaveBeenCalledTimes(2);
});

it.each(["0", "-1", "575x", "1.5", "9007199254740992"])(
  "rejects invalid id %s before fetching",
  async (id) => {
    await expect(resolveMemeRoute(id)).resolves.toEqual({ kind: "missing" });
    expect(fetchUrl).not.toHaveBeenCalled();
  }
);

it("keeps today's row reachable after the canonical next mint moves on", async () => {
  jest.mocked(getCanonicalNextMintNumber).mockReturnValue(576);
  await expect(resolveMemeRoute("575")).resolves.toEqual({
    kind: "scheduled-upcoming",
  });
  const today = jest.mocked(getUpcomingMintsAcrossSeasons).mock.calls[0]![1]!;
  expect(today.getUTCHours()).toBe(0);
  expect(today.getUTCMinutes()).toBe(0);
});

it("keeps published cards independent of the scheduled window", async () => {
  const nft = { id: 574, contract: MEMES_CONTRACT };
  jest.mocked(fetchUrl).mockImplementation(async (url) => ({
    data: String(url).includes("/nfts?") ? [nft] : [{ id: 574 }],
  }));
  await expect(resolveMemeRoute("574")).resolves.toEqual({
    kind: "published",
    nft,
    nftMeta: { id: 574 },
  });
  expect(getUpcomingMintsAcrossSeasons).not.toHaveBeenCalled();
});

it("retains the full subscription window across a season boundary", async () => {
  jest.mocked(getCardsRemainingUntilEndOf).mockReturnValue(4);
  jest
    .mocked(getUpcomingMintsAcrossSeasons)
    .mockReturnValue(scheduledRows([575, 576, 577, 578, 579]));
  await expect(resolveMemeRoute("579")).resolves.toEqual({
    kind: "scheduled-upcoming",
  });
  expect(getUpcomingMintsAcrossSeasons).toHaveBeenCalledWith(
    5,
    expect.any(Date)
  );
});

it("does not add a mint-day row on a non-mint day", async () => {
  jest.mocked(isMintEligibleUtcDay).mockReturnValue(false);
  await expect(resolveMemeRoute("576")).resolves.toEqual({
    kind: "scheduled-upcoming",
  });
  expect(getUpcomingMintsAcrossSeasons).toHaveBeenCalledWith(
    2,
    expect.any(Date)
  );
});

it("does not disguise failed reads as an upcoming card", async () => {
  jest.mocked(fetchUrl).mockRejectedValue(new Error("Fixture unavailable"));
  await expect(resolveMemeRoute("576")).resolves.toEqual({
    kind: "unavailable",
  });
});

it("does not replace partially indexed data with a scheduled placeholder", async () => {
  jest.mocked(fetchUrl).mockImplementation(async (url) => ({
    data: String(url).includes("/nfts?") ? [] : [{ id: 576 }],
  }));
  await expect(resolveMemeRoute("576")).resolves.toEqual({
    kind: "unavailable",
  });
});

it.each(["575", "576"])(
  "opens the existing upcoming view for %s",
  async (id) => {
    render(await MemePage({ params: Promise.resolve({ id }) }));
    expect(screen.getByTestId("meme-page")).toHaveAttribute("data-token", id);
    expect(screen.getByTestId("meme-page")).toHaveAttribute(
      "data-upcoming",
      "true"
    );
  }
);

it.each([
  ["575", true],
  ["576", false],
])("sets search indexing for %s to %s", async (id, index) => {
  const metadata = await generateMetadata({
    params: Promise.resolve({ id }),
    searchParams: Promise.resolve({}),
  });
  expect(metadata.title).toBe("The Memes card");
  expect(metadata.robots).toEqual({ index, follow: true });
});

it.each([
  ["575", true],
  ["576", false],
])(
  "keeps the matching distribution placeholder's indexing consistent for %s",
  async (id, index) => {
    const metadata = await generateDistributionMetadata({
      params: Promise.resolve({ id }),
      searchParams: Promise.resolve({}),
    });
    expect(metadata.title).toBe("The Memes card");
    expect(metadata.robots).toEqual({ index, follow: true });
  }
);
