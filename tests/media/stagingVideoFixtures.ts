import type { BrowserContext, Page } from "@playwright/test";

const MEMES_CONTRACT = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
export type VideoShape = "portrait" | "square";
export type VideoFixture = { id: number; width: number; height: number };

type VideoRecord = {
  id?: unknown;
  contract?: unknown;
  animation?: unknown;
  metadata?: {
    animation?: unknown;
    animation_url?: unknown;
    animation_details?: { format?: unknown; width?: unknown; height?: unknown };
  };
};

function positiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function videoDimensions(nft: VideoRecord) {
  const details = nft.metadata?.animation_details;
  const source = [
    nft.animation,
    nft.metadata?.animation,
    nft.metadata?.animation_url,
  ].some((value) => typeof value === "string" && value.trim().length > 0);
  if (
    !source ||
    typeof details?.format !== "string" ||
    !["mp4", "mov"].includes(details.format.toLowerCase()) ||
    !positiveNumber(details.width) ||
    !positiveNumber(details.height)
  )
    return null;
  return { width: details.width, height: details.height };
}

/** Token IDs are mutable staging data; qualify the actual renderer inputs. */
export function selectVideoFixtures(records: readonly unknown[]) {
  const selected: Partial<Record<VideoShape, VideoFixture>> = {};
  for (const record of records) {
    if (record === null || typeof record !== "object") continue;
    const nft = record as VideoRecord;
    if (
      !positiveNumber(nft.id) ||
      !Number.isSafeInteger(nft.id) ||
      typeof nft.contract !== "string" ||
      nft.contract.toLowerCase() !== MEMES_CONTRACT
    )
      continue;
    const dimensions = videoDimensions(nft);
    if (dimensions === null || dimensions.width > dimensions.height) continue;
    const shape: VideoShape =
      dimensions.width === dimensions.height ? "square" : "portrait";
    selected[shape] ??= { id: nft.id, ...dimensions };
  }
  return selected;
}

// Each test context owns its staging auth and request lifecycle. Never reuse a
// first page's inventory across unrelated browser contexts in the same worker.
const fixtures = new WeakMap<
  BrowserContext,
  Promise<Record<VideoShape, VideoFixture>>
>();

export function getStagingVideoFixtures(page: Page) {
  const context = page.context();
  let inventory = fixtures.get(context);
  if (inventory === undefined) {
    inventory = loadStagingVideoFixtures(context);
    fixtures.set(context, inventory);
  }
  return inventory;
}

async function loadInventoryPage(
  context: BrowserContext,
  access: string,
  pageNumber: number
) {
  const query = new URLSearchParams({
    contract: MEMES_CONTRACT,
    page_size: "101",
    page: String(pageNumber),
    sort_direction: "DESC",
  });
  const response = await context.request
    .get(`https://api.staging.6529.io/api/nfts?${query}`, {
      headers: { "x-6529-auth": access },
    })
    .catch(() => {
      // Playwright transport errors can include the request's private headers.
      throw new Error(
        "Staging video fixture inventory transport failed before an HTTP response"
      );
    });
  if (!response.ok())
    throw new Error(
      `Staging video fixture inventory must load (HTTP ${response.status()})`
    );
  const body = (await response.json()) as {
    data?: unknown;
    page?: unknown;
    next?: unknown;
  };
  if (!Array.isArray(body.data))
    throw new Error("Staging NFT inventory must contain records");
  if (
    body.page !== pageNumber ||
    (body.next !== null && typeof body.next !== "string") ||
    (body.next !== null && body.data.length === 0)
  )
    throw new Error("Staging NFT inventory pagination must advance");
  // Generate each numbered request ourselves; never follow an API-provided URL
  // with the staging authentication header.
  return { records: body.data as unknown[], hasNext: body.next !== null };
}

async function loadStagingVideoFixtures(
  context: BrowserContext
): Promise<Record<VideoShape, VideoFixture>> {
  const access = (await context.cookies("https://staging.6529.io")).find(
    (cookie) => cookie.name === "x-6529-auth"
  )?.value;
  if (!access)
    throw new Error("Staging video fixtures require the x-6529-auth cookie");
  const selected: Partial<Record<VideoShape, VideoFixture>> = {};
  for (let pageNumber = 1; ; pageNumber += 1) {
    const { records, hasNext } = await loadInventoryPage(
      context,
      access,
      pageNumber
    );
    const candidates = selectVideoFixtures(records);
    if (candidates.portrait) selected.portrait ??= candidates.portrait;
    if (candidates.square) selected.square ??= candidates.square;
    if (selected.portrait && selected.square)
      return { portrait: selected.portrait, square: selected.square };
    if (!hasNext) break;
  }
  throw new Error(
    "Staging must provide both a qualified portrait and square MP4/MOV artwork; no geometry cases were skipped"
  );
}
