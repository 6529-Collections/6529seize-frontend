import { resolveCmsUri } from "@/lib/profile-cms/runtime/uri";
import type {
  WalletGallerySnapshot,
  WalletGallerySnapshotAsset,
} from "./gallery-source";

type ImageDimensions = { readonly width: number; readonly height: number };
export type WalletGalleryImageMeasure = (
  resolvedUrl: string,
  signal: AbortSignal
) => Promise<ImageDimensions | null>;

type MeasurementOptions = {
  readonly measureImage?: WalletGalleryImageMeasure;
  readonly concurrency?: number;
  readonly perImageTimeoutMs?: number;
  readonly totalTimeoutMs?: number;
};

const UNMEASURED_WARNING = "backend_snapshot_unmeasured_images";

/** Preserve holdings and authored URIs; dimensions describe the exact image loaded. */
export async function enrichWalletGalleryImageDimensions(
  snapshot: WalletGallerySnapshot,
  options: MeasurementOptions = {}
): Promise<WalletGallerySnapshot> {
  const assets = snapshot.assets.map((asset) =>
    needsDimensions(asset)
      ? { ...asset, mediaState: "partial" as const }
      : asset
  );
  const jobs = collectMeasurementJobs(snapshot.assets);
  const measure = options.measureImage ?? measureWalletGalleryImage;
  const perImageTimeoutMs = boundedOption(options.perImageTimeoutMs, 4000);
  const deadline = Date.now() + boundedOption(options.totalTimeoutMs, 12000);
  let nextJob = 0;
  const worker = async () => {
    while (nextJob < jobs.length) {
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) return;
      const job = jobs[nextJob++];
      if (!job) return;
      const [url, indices] = job;
      const dimensions = await measureWithinBudget(
        measure,
        url,
        Math.min(perImageTimeoutMs, remainingMs)
      );
      if (!dimensions || !hasDimensions(dimensions)) continue;
      indices.forEach((index) => {
        const original = snapshot.assets[index];
        if (original) assets[index] = { ...original, ...dimensions };
      });
    }
  };
  await Promise.all(
    Array.from(
      { length: Math.min(jobs.length, boundedOption(options.concurrency, 4)) },
      worker
    )
  );
  const warnings = snapshot.warnings.filter(
    (code) => code !== UNMEASURED_WARNING
  );
  if (assets.some(needsDimensions)) warnings.push(UNMEASURED_WARNING);
  return { ...snapshot, assets, warnings };
}

function boundedOption(value: number | undefined, maximum: number): number {
  return value !== undefined && Number.isSafeInteger(value) && value > 0
    ? Math.min(value, maximum)
    : maximum;
}

function hasDimensions(value: {
  readonly width?: number | undefined;
  readonly height?: number | undefined;
}): boolean {
  return (
    Number.isSafeInteger(value.width) &&
    Number.isSafeInteger(value.height) &&
    (value.width ?? 0) > 0 &&
    (value.height ?? 0) > 0
  );
}

function needsDimensions(asset: WalletGallerySnapshotAsset): boolean {
  return !!asset.imageUri && !hasDimensions(asset);
}

function collectMeasurementJobs(
  assets: readonly WalletGallerySnapshotAsset[]
): Array<[string, number[]]> {
  const jobs = new Map<string, number[]>();
  assets.forEach((asset, index) => {
    if (!needsDimensions(asset)) return;
    const resolved = resolveCmsUri(asset.imageUri);
    if (!resolved) return;
    const url = new URL(resolved);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return;
    const indices = jobs.get(resolved) ?? [];
    indices.push(index);
    jobs.set(resolved, indices);
  });
  return [...jobs];
}

/** The timeout also bounds injected implementations that ignore cancellation. */
function measureWithinBudget(
  measure: WalletGalleryImageMeasure,
  url: string,
  timeoutMs: number
): Promise<ImageDimensions | null> {
  return new Promise((resolve) => {
    const controller = new AbortController();
    let settled = false;
    const finish = (dimensions: ImageDimensions | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      controller.abort();
      resolve(dimensions);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    Promise.resolve()
      .then(() => measure(url, controller.signal))
      .then(finish)
      .catch(() => finish(null));
  });
}

/** Image loading needs no CORS access to pixels to read its intrinsic dimensions. */
export const measureWalletGalleryImage: WalletGalleryImageMeasure = (
  resolvedUrl,
  signal
) => {
  if (typeof globalThis.Image === "undefined" || signal.aborted)
    return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new globalThis.Image();
    const finish = (dimensions: ImageDimensions | null) => {
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener("abort", abort);
      image.removeAttribute("src");
      resolve(dimensions);
    };
    const abort = () => finish(null);
    image.onload = () => {
      const dimensions = {
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
      finish(hasDimensions(dimensions) ? dimensions : null);
    };
    image.onerror = () => finish(null);
    signal.addEventListener("abort", abort, { once: true });
    image.referrerPolicy = "no-referrer";
    image.decoding = "async";
    image.src = resolvedUrl;
  });
};
