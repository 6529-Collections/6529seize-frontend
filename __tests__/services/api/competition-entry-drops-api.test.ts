import { fetchCompetitionEntryDrop } from "@/services/api/competition-entry-drops-api";
import { commonApiFetch } from "@/services/api/common-api";
import { fetchDropsV2ByIds } from "@/services/api/wave-drops-v2-api";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/services/api/wave-drops-v2-api", () => ({
  ...jest.requireActual("@/services/api/wave-drops-v2-api"),
  fetchDropsV2ByIds: jest.fn(),
}));
const identity = { waveId: "wave", competitionId: "comp" };
const item = (id: string) => ({
  entry: { id, drop_id: `drop-${id}`, wave_id: "wave", competition_id: "comp" },
  vote_summary: {},
  awards: [],
});
const original = (id: string) => ({ id: `drop-${id}`, wave: { id: "wave" } });
const request = (
  id: string,
  viewer = "viewer",
  controller = new AbortController()
) =>
  fetchCompetitionEntryDrop(
    identity,
    viewer,
    id,
    `drop-${id}`,
    controller.signal
  );
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(commonApiFetch).mockImplementation(
    async ({ params }) =>
      ({
        competition: { id: "comp", wave_id: "wave" },
        data: String(
          (params as Record<string, string> | undefined)?.["entry_ids"]
        )
          .split(",")
          .map(item),
      }) as never
  );
  jest
    .mocked(fetchDropsV2ByIds)
    .mockImplementation(
      async ({ dropIds }) => dropIds.map((id) => original(id.slice(5))) as never
    );
});
it("loads fifty visible cards through one scoped context request and one content request", async () => {
  const result = await Promise.all(
    Array.from({ length: 50 }, (_, index) => request(String(index)))
  );
  expect(commonApiFetch).toHaveBeenCalledTimes(1);
  expect(fetchDropsV2ByIds).toHaveBeenCalledTimes(1);
  expect(result.map((value) => value?.entry.id)).toEqual(
    Array.from({ length: 50 }, (_, index) => String(index))
  );
});
it("separates viewers and splits batches above fifty entries", async () => {
  await Promise.all([
    ...Array.from({ length: 51 }, (_, index) => request(String(index))),
    request("other", "other-viewer"),
  ]);
  expect(commonApiFetch).toHaveBeenCalledTimes(3);
});
it("omits entries hidden by the scoped context endpoint", async () => {
  jest.mocked(commonApiFetch).mockResolvedValue({
    competition: { id: "comp", wave_id: "wave" },
    data: [],
  } as never);
  expect(await request("hidden")).toBeNull();
});
it("rejects a response from another competition", async () => {
  jest.mocked(commonApiFetch).mockResolvedValue({
    competition: { id: "other", wave_id: "wave" },
    data: [item("entry")],
  } as never);
  await expect(request("entry")).rejects.toThrow("Invalid competition parent");
});
it("rejects mismatched entry and drop membership", async () => {
  jest.mocked(commonApiFetch).mockResolvedValue({
    competition: { id: "comp", wave_id: "wave" },
    data: [
      {
        ...item("entry"),
        entry: { ...item("entry").entry, drop_id: "other" },
      },
    ],
  } as never);
  await expect(request("entry")).rejects.toThrow("Invalid competition entry");
});
it("cancels offscreen cards without cancelling cards still visible", async () => {
  const controller = new AbortController();
  const abandoned = request("old", "viewer", controller);
  const rejected = expect(abandoned).rejects.toThrow();
  const visible = request("visible");
  controller.abort();
  await rejected;
  expect((await visible)?.entry.id).toBe("visible");
  expect(commonApiFetch).toHaveBeenCalledWith(
    expect.objectContaining({ params: { entry_ids: "visible" } })
  );
});

it("keeps other visible cards available when one entry fails membership validation", async () => {
  jest.mocked(commonApiFetch).mockResolvedValue({
    competition: { id: "comp", wave_id: "wave" },
    data: [
      { ...item("bad"), entry: { ...item("bad").entry, drop_id: "wrong" } },
      item("good"),
    ],
  } as never);
  const results = await Promise.allSettled([request("bad"), request("good")]);
  expect(results[0]).toMatchObject({ status: "rejected" });
  expect(results[1]).toMatchObject({
    status: "fulfilled",
    value: { entry: { id: "good" } },
  });
});

it("renders a native card through one context read without a legacy content request", async () => {
  jest.mocked(commonApiFetch).mockResolvedValue({
    competition: { id: "comp", wave_id: "wave" },
    data: [
      {
        ...item("entry"),
        metadata: [{ data_key: "Artist", data_value: "Native artist" }],
        drop: {
          id: "drop-entry",
          drop_type: "SUBMISSION",
          serial_no: 1,
          created_at: 1,
          content: "Native content",
          parts_count: 1,
          media: [],
          author: {
            id: "author",
            handle: "artist",
            badges: {},
            level: 1,
            classification: "PSEUDONYM",
            primary_address: "0x0",
          },
          priority_metadata: [],
          reactions: [],
          boosts: 0,
        },
      },
    ],
  } as never);
  const result = await fetchCompetitionEntryDrop(
    identity,
    "viewer",
    "entry",
    "drop-entry",
    new AbortController().signal,
    { wave: { id: "wave" } } as never
  );
  expect(result?.original.parts[0]?.content).toBe("Native content");
  expect(result?.original.metadata).toEqual([
    { data_key: "Artist", data_value: "Native artist" },
  ]);
  expect(commonApiFetch).toHaveBeenCalledTimes(1);
  expect(commonApiFetch).toHaveBeenCalledWith(
    expect.objectContaining({
      params: { entry_ids: "entry", include: "cards" },
    })
  );
  expect(fetchDropsV2ByIds).not.toHaveBeenCalled();
});
it("refreshes native votes while reusing previously loaded artwork content", async () => {
  const cached = original("entry");
  const result = await fetchCompetitionEntryDrop(
    identity,
    "viewer",
    "entry",
    "drop-entry",
    new AbortController().signal,
    { wave: { id: "wave" }, original: cached } as never
  );
  expect(result?.original).toBe(cached);
  expect(commonApiFetch).toHaveBeenCalledWith(
    expect.objectContaining({ params: { entry_ids: "entry" } })
  );
  expect(fetchDropsV2ByIds).not.toHaveBeenCalled();
});
