/** @jest-environment node */
import { selectVideoFixtures } from "../../tests/media/stagingVideoFixtures";
jest.mock("../../tests/testHelpers", () => ({
  expect:
    jest.requireActual<typeof import("@jest/globals")>("@jest/globals").expect,
}));
const contract = "0x33FD426905F149f8376e227d0C9D3340AaD17aF1";
const video = (id: number, width: number, height: number) => ({
  id,
  contract,
  animation: "https://example.com/video.mp4",
  metadata: { animation_details: { format: "MP4", width, height } },
});
it("replaces obsolete numeric fixtures while retaining both required video shapes", () => {
  expect(
    selectVideoFixtures([
      {
        id: 550,
        contract,
        animation: "https://example.com/stale.MP4",
        metadata: { image_details: { format: "JPG" } },
      },
      video(549, 640, 960),
      video(500, 1000, 1000),
      video(499, 640, 960),
    ])
  ).toEqual({
    portrait: { id: 549, width: 640, height: 960 },
    square: { id: 500, width: 1000, height: 1000 },
  });
});
it("rejects image metadata, missing sources, wrong contracts and invalid dimensions", () => {
  expect(
    selectVideoFixtures([
      null,
      { ...video(1, 640, 960), contract: "other" },
      { ...video(2, 640, 960), animation: " " },
      video(3, 0, 960),
      video(4, 640, Number.NaN),
      video(5, 960, 640),
      {
        ...video(6, 640, 960),
        metadata: {
          animation_details: { format: "GIF", width: 640, height: 960 },
        },
      },
    ])
  ).toEqual({});
});
it("accepts renderer-supported metadata animation URLs and MOV", () => {
  expect(
    selectVideoFixtures([
      {
        id: 7,
        contract,
        metadata: {
          animation_url: "https://example.com/video.mov",
          animation_details: { format: "mov", width: 100, height: 100 },
        },
      },
    ])
  ).toEqual({ square: { id: 7, width: 100, height: 100 } });
});

function fixturePage(pages: unknown[][], ok = true) {
  const get = jest.fn();
  for (const records of pages)
    get.mockResolvedValueOnce({
      ok: () => ok,
      json: async () => ({ data: records }),
    });
  const page = {
    context: () => ({
      cookies: async () => [{ name: "x-6529-auth", value: "fixture-access" }],
    }),
    request: { get },
  } as unknown as import("@playwright/test").Page;
  return { page, get };
}

it("qualifies both shapes across bounded pages and reuses the inventory within a worker", async () => {
  jest.resetModules();
  const { getStagingVideoFixtures } =
    await import("../../tests/media/stagingVideoFixtures");
  const { page, get } = fixturePage([
    [video(549, 640, 960), ...Array.from({ length: 100 }, () => null)],
    [video(500, 1000, 1000)],
  ]);
  const result = await getStagingVideoFixtures(page);
  expect(result).toEqual({
    portrait: { id: 549, width: 640, height: 960 },
    square: { id: 500, width: 1000, height: 1000 },
  });
  expect(await getStagingVideoFixtures(page)).toBe(result);
  expect(get).toHaveBeenCalledTimes(2);
  expect(new URL(get.mock.calls[1][0]).searchParams.get("page")).toBe("2");
  expect(get.mock.calls[0][1]).toEqual({
    headers: { "x-6529-auth": "fixture-access" },
  });
});

it("fails explicitly if the inventory cannot supply both shapes", async () => {
  jest.resetModules();
  const { getStagingVideoFixtures } =
    await import("../../tests/media/stagingVideoFixtures");
  const { page, get } = fixturePage([[video(549, 640, 960)]]);
  await expect(getStagingVideoFixtures(page)).rejects.toThrow(
    "both a qualified portrait and square"
  );
  expect(get).toHaveBeenCalledTimes(1);
});

it("does not retry or disguise an unsuccessful authenticated inventory request", async () => {
  jest.resetModules();
  const { getStagingVideoFixtures } =
    await import("../../tests/media/stagingVideoFixtures");
  const { page, get } = fixturePage([[]], false);
  await expect(getStagingVideoFixtures(page)).rejects.toThrow(
    "Staging video fixture inventory must load"
  );
  expect(get).toHaveBeenCalledTimes(1);
});
