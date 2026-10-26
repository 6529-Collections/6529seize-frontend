/** @jest-environment node */
import { selectVideoFixtures } from "../../tests/media/stagingVideoFixtures";
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

function fixturePage(
  pages: unknown[][],
  ok = true,
  access: string | null = "fixture-access"
) {
  const get = jest.fn();
  for (const [index, records] of pages.entries())
    get.mockResolvedValueOnce({
      ok: () => ok,
      status: () => (ok ? 200 : 503),
      json: async () => ({
        data: records,
        page: index + 1,
        next: index + 1 < pages.length ? "/nfts?next-page" : null,
      }),
    });
  const context = {
    cookies: async () =>
      access === null ? [] : [{ name: "x-6529-auth", value: access }],
    request: { get },
  };
  const page = {
    context: () => context,
  } as unknown as import("@playwright/test").Page;
  return { page, get, context };
}

it("qualifies both shapes across inventory pages and reuses the inventory within a browser context", async () => {
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

it("finds a required shape after the third page without following response URLs", async () => {
  const { getStagingVideoFixtures } =
    await import("../../tests/media/stagingVideoFixtures");
  const { page, get } = fixturePage([
    [video(900, 640, 960)],
    [video(800, 640, 960)],
    [video(700, 640, 960)],
    [video(600, 1000, 1000)],
  ]);
  await expect(getStagingVideoFixtures(page)).resolves.toEqual({
    portrait: { id: 900, width: 640, height: 960 },
    square: { id: 600, width: 1000, height: 1000 },
  });
  expect(get).toHaveBeenCalledTimes(4);
  for (const [index, [url]] of get.mock.calls.entries()) {
    expect(new URL(url).origin).toBe("https://api.staging.6529.io");
    expect(new URL(url).searchParams.get("page")).toBe(String(index + 1));
  }
});

it("stops at the end of a full inventory page when a shape is absent", async () => {
  const { getStagingVideoFixtures } =
    await import("../../tests/media/stagingVideoFixtures");
  const { page, get } = fixturePage([
    Array.from({ length: 101 }, (_, index) => video(index + 1, 640, 960)),
  ]);
  await expect(getStagingVideoFixtures(page)).rejects.toThrow(
    "both a qualified portrait and square"
  );
  expect(get).toHaveBeenCalledTimes(1);
});

it("rejects a non-advancing inventory page rather than looping", async () => {
  const { getStagingVideoFixtures } =
    await import("../../tests/media/stagingVideoFixtures");
  const { page, get } = fixturePage([]);
  get.mockResolvedValue({
    ok: () => true,
    json: async () => ({
      data: [video(549, 640, 960)],
      page: 1,
      next: "/nfts",
    }),
  });
  await expect(getStagingVideoFixtures(page)).rejects.toThrow(
    "pagination must advance"
  );
  expect(get).toHaveBeenCalledTimes(2);
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

it("isolates inventory and auth for concurrent browser contexts", async () => {
  const { getStagingVideoFixtures } =
    await import("../../tests/media/stagingVideoFixtures");
  const first = fixturePage(
    [[video(11, 640, 960), video(12, 1000, 1000)]],
    true,
    "first-access"
  );
  const second = fixturePage(
    [[video(21, 640, 960), video(22, 1000, 1000)]],
    true,
    "second-access"
  );
  const [a, b] = await Promise.all([
    getStagingVideoFixtures(first.page),
    getStagingVideoFixtures(second.page),
  ]);
  expect(a.portrait.id).toBe(11);
  expect(b.portrait.id).toBe(21);
  expect(first.get).toHaveBeenCalledWith(expect.any(String), {
    headers: { "x-6529-auth": "first-access" },
  });
  expect(second.get).toHaveBeenCalledWith(expect.any(String), {
    headers: { "x-6529-auth": "second-access" },
  });
  const siblingPage = {
    context: () => first.context,
  } as unknown as import("@playwright/test").Page;
  expect(await getStagingVideoFixtures(siblingPage)).toBe(a);
  expect(first.get).toHaveBeenCalledTimes(1);
});

it("reports missing staging auth before making an inventory request", async () => {
  const { getStagingVideoFixtures } =
    await import("../../tests/media/stagingVideoFixtures");
  const { page, get } = fixturePage([[]], true, null);
  await expect(getStagingVideoFixtures(page)).rejects.toThrow(
    "require the x-6529-auth cookie"
  );
  expect(get).not.toHaveBeenCalled();
});

it("does not expose staging auth from transport error call logs", async () => {
  const { getStagingVideoFixtures } =
    await import("../../tests/media/stagingVideoFixtures");
  const { page, get } = fixturePage([]);
  get.mockRejectedValue(new Error("Call log: x-6529-auth: PRIVATE_TOKEN"));
  const failure = await getStagingVideoFixtures(page).catch(
    (error: unknown) => error
  );
  expect(failure).toBeInstanceOf(Error);
  expect((failure as Error).message).toContain(
    "transport failed before an HTTP response"
  );
  expect(String(failure)).not.toContain("PRIVATE_TOKEN");
  expect((failure as Error).cause).toBeUndefined();
  expect(get).toHaveBeenCalledTimes(1);
});
