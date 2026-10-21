import { fetchCompetitionEntryDrop } from "@/services/api/competition-entry-drops-api";
import { commonApiFetch } from "@/services/api/common-api";
import { fetchDropsV2ByIds } from "@/services/api/wave-drops-v2-api";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/services/api/wave-drops-v2-api", () => ({
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
        data: String(params?.["entry_ids"]).split(",").map(item),
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
