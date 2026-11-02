import {
  fetchPublicUrl,
  parsePublicUrl,
  UrlGuardError,
  type FetchPublicUrlOptions,
} from "@/lib/security/urlGuard";
import { OG_IMAGE_PROXY_MAX_BYTES } from "@/app/api/og-metadata/_lib/imageProxyPolicy";
import {
  GIPHY_MEDIA_HOSTS,
  isGiphyVideoRenditionUrl,
} from "@/app/api/og-metadata/_lib/giphyRenditions";
import {
  BoundedResultCache,
  type CacheableResult,
} from "@/lib/cache/boundedResultCache";
import {
  AdmissionQueue,
  AdmissionQueueError,
} from "@/lib/fetch/admissionQueue";
import { NextResponse, type NextRequest } from "next/server";
import sharp, { type Metadata, type Sharp } from "sharp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// This route only rasterizes the raster formats sniffed below. Also disable
// libvips' SVG loader so remote vector documents never reach a decoder, even
// when their bytes are mistaken for another format.
// The block is process-global: it applies to every sharp call in this server
// process, not just this route. That is safe because this route is the only
// runtime sharp user, and Next's image optimizer never decodes SVG with sharp
// while dangerouslyAllowSVG is off (the default here).
sharp.block({ operation: ["VipsForeignLoadSvg"] });

const DEFAULT_WIDTH = 1200;
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 12000;
const MAX_INPUT_PIXELS = 512_000_000;
const MAX_INPUT_DIMENSION = 65_536;
// Admit before fetching to bound both compressed buffers and native image work.
// Ordinary multi-image cards can wait briefly without allocating image buffers.
const imageAdmission = new AdmissionQueue({ maxPending: 32, waitMs: 15_000 });
// Video pass-through never decodes, so it must not wait behind GIF re-encodes.
const videoAdmission = new AdmissionQueue({ maxPending: 32, waitMs: 15_000 });
const OVERSIZED_GIF_PREVIEW_MAX_BYTES = 8 * 1024 * 1024;
const MAX_ANIMATED_WORK_BYTES = 512 * 1024 * 1024;
const VIDEO_PASSTHROUGH_MAX_BYTES = 8 * 1024 * 1024;
const PNG_CONTENT_TYPE = "image/png";
const GIF_CONTENT_TYPE = "image/gif";
const MP4_CONTENT_TYPE = "video/mp4";
const CACHE_CONTROL =
  "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=2592000";
// A first frame served because the animated re-encode failed is a stand-in:
// keep it briefly so a later request can still produce the animation.
const DEGRADED_CACHE_CONTROL = "public, max-age=300";
const RESULT_TTL_MS = 24 * 60 * 60 * 1000;
const DEGRADED_RESULT_TTL_MS = 5 * 60 * 1000;
// Brief, so a broken image cannot be hammered and a manual retry soon works.
const FAILURE_TTL_MS = 30 * 1000;
const IMAGE_ACCEPT_HEADER =
  "image/png,image/jpeg,image/gif,image/webp,*/*;q=0.5";
const USER_AGENT =
  "Mozilla/5.0 (compatible; 6529-og-image/1.0; +https://6529.io)";
const IMAGE_TYPE_SIGNATURES = [
  {
    contentType: "image/jpeg",
    matches: (buffer: Buffer): boolean =>
      buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  {
    contentType: "image/png",
    matches: (buffer: Buffer): boolean =>
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a,
  },
  {
    contentType: "image/gif",
    matches: (buffer: Buffer): boolean =>
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38,
  },
  {
    contentType: "image/webp",
    matches: (buffer: Buffer): boolean =>
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50,
  },
] as const;
const FETCH_OPTIONS: FetchPublicUrlOptions = {
  timeoutMs: 7000,
  userAgent: USER_AGENT,
};
// Every redirect hop must stay on an exact Giphy media host.
const GIPHY_VIDEO_FETCH_OPTIONS: FetchPublicUrlOptions = {
  ...FETCH_OPTIONS,
  policy: { allowedHosts: GIPHY_MEDIA_HOSTS },
};

type ProxyResult =
  | {
      readonly kind: "media";
      readonly data: Buffer;
      readonly contentType: string;
      readonly cacheControl: string;
    }
  | { readonly kind: "error"; readonly status: number; readonly error: string };

type ByteRange = { readonly start: number; readonly end: number };

// No shared cache sits in front of this route, so keep processed results here.
const proxyResults = new BoundedResultCache<ProxyResult>({
  maxBytes: 128 * 1024 * 1024,
  maxEntryBytes: 16 * 1024 * 1024,
});

const parseWidth = (value: string | null): number => {
  if (!value) {
    return DEFAULT_WIDTH;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_WIDTH;
  }

  return Math.min(parsed, MAX_WIDTH);
};

const ensureDefaultHttpsPort = (url: URL): void => {
  if (url.protocol !== "https:") {
    throw new UrlGuardError(
      "Only HTTPS image URLs are supported.",
      "unsupported-protocol"
    );
  }

  if (url.port && url.port !== "443") {
    throw new UrlGuardError(
      "Only default HTTPS image ports are supported.",
      "host-not-allowed"
    );
  }
};

const jsonError = (error: string, status: number): NextResponse =>
  NextResponse.json({ error }, { status });

const getContentLength = (response: Response): number | null => {
  const contentLength = response.headers.get("content-length");
  if (!contentLength) {
    return null;
  }

  const parsed = Number.parseInt(contentLength, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const getResponseContentType = (response: Response): string | null => {
  const contentType = response.headers.get("content-type");
  return contentType?.split(";")[0]?.trim().toLowerCase() || null;
};

const ensureAllowedImageSize = (byteLength: number): void => {
  if (byteLength > OG_IMAGE_PROXY_MAX_BYTES) {
    throw new Error("Image response exceeded maximum size.");
  }
};

const ensureAllowedGifPreviewSize = (byteLength: number): void => {
  if (byteLength > OVERSIZED_GIF_PREVIEW_MAX_BYTES) {
    throw new Error("GIF preview response exceeded maximum size.");
  }
};

const isGifUrl = (url: URL): boolean => /\.gif(?:$|[?#])/i.test(url.pathname);

const shouldUseOversizedGifPreview = ({
  contentLength,
  contentType,
  url,
}: {
  readonly contentLength: number | null;
  readonly contentType: string | null;
  readonly url: URL;
}): boolean =>
  contentLength !== null &&
  contentLength > OG_IMAGE_PROXY_MAX_BYTES &&
  (contentType === GIF_CONTENT_TYPE || isGifUrl(url));

const cancelResponseBody = async (response: Response): Promise<void> => {
  try {
    await response.body?.cancel();
  } catch {
    // Best-effort cleanup before issuing a bounded range request.
  }
};

const describeFailure = (
  error: unknown
): { readonly status: number; readonly error: string } => {
  if (error instanceof UrlGuardError) {
    switch (error.kind) {
      case "missing-url":
      case "invalid-url":
      case "unsupported-protocol":
        return { status: 400, error: "Invalid image url" };
      case "host-not-allowed":
      case "dns-lookup-failed":
      case "ip-not-allowed":
        return { status: 400, error: "Unsupported image host" };
      case "timeout":
        return { status: 504, error: "Upstream timeout" };
      case "redirect-location-missing":
      case "redirect-location-invalid":
      case "too-many-redirects":
      case "fetch-failed":
        return { status: 502, error: "Failed to fetch image" };
    }
  }

  return { status: 502, error: "Failed to normalize image" };
};

const mapErrorToResponse = (error: unknown): NextResponse => {
  if (error instanceof AdmissionQueueError) {
    return NextResponse.json(
      { error: "Image processing busy" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store", "Retry-After": "1" },
      }
    );
  }
  const { status, error: message } = describeFailure(error);
  return jsonError(message, status);
};

const readImageResponseBuffer = async (
  response: Response,
  maxBytes = OG_IMAGE_PROXY_MAX_BYTES
): Promise<Buffer> => {
  if (!response.body) {
    throw new Error("Image response did not include a readable body.");
  }

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      const chunk = Buffer.from(value);
      totalBytes += chunk.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel("Image response exceeded maximum size.");
        throw new Error("Image response exceeded maximum size.");
      }
      chunks.push(chunk);
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, totalBytes);
};

const fetchImageBuffer = async (
  url: URL
): Promise<{ buffer: Buffer; complete: boolean }> => {
  const response = await fetchPublicUrl(
    url,
    {
      headers: {
        accept: IMAGE_ACCEPT_HEADER,
      },
    },
    FETCH_OPTIONS
  );

  if (!response.ok) {
    await cancelResponseBody(response);
    throw new Error(`Image request failed: ${response.status}`);
  }

  const contentLength = getContentLength(response);
  const contentType = getResponseContentType(response);
  if (shouldUseOversizedGifPreview({ contentLength, contentType, url })) {
    await cancelResponseBody(response);
    return {
      buffer: await fetchOversizedGifPreviewBuffer(url),
      complete: false,
    };
  }

  if (contentLength !== null) {
    try {
      ensureAllowedImageSize(contentLength);
    } catch (error) {
      await cancelResponseBody(response);
      throw error;
    }
  }

  return { buffer: await readImageResponseBuffer(response), complete: true };
};

const fetchOversizedGifPreviewBuffer = async (url: URL): Promise<Buffer> => {
  const response = await fetchPublicUrl(
    url,
    {
      headers: {
        accept: IMAGE_ACCEPT_HEADER,
        range: `bytes=0-${OVERSIZED_GIF_PREVIEW_MAX_BYTES - 1}`,
      },
    },
    FETCH_OPTIONS
  );

  if (response.status !== 206) {
    await cancelResponseBody(response);
    throw new Error(`Image range request failed: ${response.status}`);
  }

  const contentLength = getContentLength(response);
  if (contentLength !== null) {
    try {
      ensureAllowedGifPreviewSize(contentLength);
    } catch (error) {
      await cancelResponseBody(response);
      throw error;
    }
  }

  const buffer = await readImageResponseBuffer(
    response,
    OVERSIZED_GIF_PREVIEW_MAX_BYTES
  );
  ensureAllowedGifPreviewSize(buffer.byteLength);
  if (detectContentType(buffer) !== GIF_CONTENT_TYPE) {
    throw new Error("GIF range response is not a GIF.");
  }
  return buffer;
};

const detectContentType = (buffer: Buffer): string | null =>
  IMAGE_TYPE_SIGNATURES.find(({ matches }) => matches(buffer))?.contentType ??
  null;

const normalizeImage = async ({
  buffer,
  width,
  allowAnimation,
}: {
  readonly buffer: Buffer;
  readonly width: number;
  readonly allowAnimation: boolean;
}): Promise<{ data: Buffer; contentType: string; degraded: boolean }> => {
  const detectedContentType = detectContentType(buffer);
  if (!detectedContentType) {
    throw new Error("Upstream response is not a supported raster image.");
  }

  const image = sharp(buffer, {
    limitInputPixels: MAX_INPUT_PIXELS,
    page: 0,
    pages: 1,
    sequentialRead: true,
  }).timeout({ seconds: 7 });
  // Read only the first frame, so animation length does not consume the pixel
  // budget. Sharp enforces its finite pixel limit while opening this metadata.
  const metadata = await image.metadata();
  ensureAllowedImageDimensions(metadata);
  const frames = metadata.pages ?? 1;
  const animatedWorkBytes =
    metadata.width * (metadata.pageHeight ?? metadata.height) * frames * 16;
  const animated =
    allowAnimation &&
    detectedContentType === GIF_CONTENT_TYPE &&
    Number.isSafeInteger(frames) &&
    frames > 1 &&
    Number.isSafeInteger(animatedWorkBytes) &&
    animatedWorkBytes <= MAX_ANIMATED_WORK_BYTES;
  // Preserve ordinary external GIFs without admitting an unbounded animation.
  // Range-fetched or over-budget GIFs keep the existing first-frame PNG path.
  if (!animated) {
    return { ...(await encodeFirstFrame(image, width)), degraded: false };
  }
  try {
    const animatedImage = sharp(buffer, {
      animated: true,
      limitInputPixels: MAX_ANIMATED_WORK_BYTES / 16,
    }).timeout({ seconds: 7 });
    return {
      data: await fitInside(animatedImage, width).gif().toBuffer(),
      contentType: GIF_CONTENT_TYPE,
      degraded: false,
    };
  } catch (error) {
    // A slow or failing re-encode still has a usable first frame.
    console.warn(
      "Animated GIF re-encode failed; serving its first frame.",
      error
    );
    return { ...(await encodeFirstFrame(image, width)), degraded: true };
  }
};

const fitInside = (image: Sharp, width: number): Sharp =>
  image
    .rotate()
    .resize(width, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true });

const encodeFirstFrame = async (
  image: Sharp,
  width: number
): Promise<{ data: Buffer; contentType: string }> => ({
  data: await fitInside(image, width).png({ quality: 100 }).toBuffer(),
  contentType: PNG_CONTENT_TYPE,
});

const ensureAllowedImageDimensions = (metadata: Metadata): void => {
  const width = metadata.width;
  const height = metadata.pageHeight ?? metadata.height;
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > MAX_INPUT_DIMENSION ||
    height > MAX_INPUT_DIMENSION ||
    width * height > MAX_INPUT_PIXELS
  ) {
    throw new Error("Image dimensions exceeded supported limits.");
  }
};

const parseImageUrl = (value: string | null): URL => {
  const parsed = parsePublicUrl(value, { allowedProtocols: ["https:"] });
  ensureDefaultHttpsPort(parsed);
  return parsed;
};

const isMp4 = (buffer: Buffer): boolean =>
  buffer.byteLength >= 12 && buffer.toString("latin1", 4, 8) === "ftyp";

const fetchGiphyVideo = async (url: URL): Promise<Buffer> => {
  const response = await fetchPublicUrl(
    url,
    { headers: { accept: MP4_CONTENT_TYPE } },
    GIPHY_VIDEO_FETCH_OPTIONS
  );
  const contentLength = getContentLength(response);
  if (
    !response.ok ||
    getResponseContentType(response) !== MP4_CONTENT_TYPE ||
    (contentLength !== null && contentLength > VIDEO_PASSTHROUGH_MAX_BYTES)
  ) {
    await cancelResponseBody(response);
    throw new Error(
      `Video request did not return a bounded MP4: ${response.status}`
    );
  }

  const buffer = await readImageResponseBuffer(
    response,
    VIDEO_PASSTHROUGH_MAX_BYTES
  );
  if (!isMp4(buffer)) {
    throw new Error("Video response is not an MP4.");
  }
  return buffer;
};

const mediaResult = (
  data: Buffer,
  contentType: string,
  degraded = false
): CacheableResult<ProxyResult> => ({
  value: {
    kind: "media",
    data,
    contentType,
    cacheControl: degraded ? DEGRADED_CACHE_CONTROL : CACHE_CONTROL,
  },
  bytes: data.byteLength,
  ttlMs: degraded ? DEGRADED_RESULT_TTL_MS : RESULT_TTL_MS,
});

// Runs one admitted job. Busy or abandoned admissions propagate uncached; any
// other failure becomes a briefly cached error answer.
const runAdmittedJob = async (
  admission: AdmissionQueue,
  signal: AbortSignal,
  job: () => Promise<CacheableResult<ProxyResult>>
): Promise<CacheableResult<ProxyResult>> => {
  const releaseAdmission = await admission.acquire(signal);
  try {
    return await job();
  } catch (error) {
    console.error("Unable to normalize OG metadata image.", error);
    return {
      value: { kind: "error", ...describeFailure(error) },
      bytes: 0,
      ttlMs: FAILURE_TTL_MS,
    };
  } finally {
    releaseAdmission();
  }
};

// Copies only the bytes served; the cached buffer stays untouched.
const toResponseBody = (data: Buffer): Uint8Array<ArrayBuffer> =>
  new Uint8Array(data);

/** One `bytes=` range; null serves the whole body, as RFC 9110 permits. */
const parseByteRange = (
  header: string | null,
  size: number
): ByteRange | null | "unsatisfiable" => {
  const match = header ? /^bytes=(\d*)-(\d*)$/.exec(header.trim()) : null;
  const startText = match?.[1] ?? "";
  const endText = match?.[2] ?? "";
  if (!startText && !endText) {
    return null;
  }
  if (!startText) {
    const suffixLength = Number(endText);
    return suffixLength > 0
      ? { start: Math.max(0, size - suffixLength), end: size - 1 }
      : "unsatisfiable";
  }
  const start = Number(startText);
  const end = endText ? Number(endText) : Number.POSITIVE_INFINITY;
  if (end < start) {
    return null;
  }
  return start < size
    ? { start, end: Math.min(end, size - 1) }
    : "unsatisfiable";
};

// Media elements, Safari's in particular, fetch video by byte range.
const videoResponse = (
  data: Buffer,
  cacheControl: string,
  rangeHeader: string | null
): NextResponse => {
  const size = data.byteLength;
  const range = parseByteRange(rangeHeader, size);
  const headers = {
    "Accept-Ranges": "bytes",
    "Content-Type": MP4_CONTENT_TYPE,
  };
  if (range === "unsatisfiable") {
    return new NextResponse(null, {
      status: 416,
      headers: { ...headers, "Content-Range": `bytes */${size}` },
    });
  }
  const { start, end } = range ?? { start: 0, end: size - 1 };
  return new NextResponse(toResponseBody(data.subarray(start, end + 1)), {
    status: range ? 206 : 200,
    headers: {
      ...headers,
      "Cache-Control": cacheControl,
      "Content-Length": String(end - start + 1),
      ...(range ? { "Content-Range": `bytes ${start}-${end}/${size}` } : {}),
    },
  });
};

const cacheKey = (mode: string, url: URL): string => {
  const keyUrl = new URL(url.href);
  keyUrl.hash = "";
  return `${mode}:${keyUrl.href}`;
};

const serveGiphyVideo = async (
  request: NextRequest,
  videoUrl: URL
): Promise<NextResponse> => {
  if (!isGiphyVideoRenditionUrl(videoUrl)) {
    return jsonError("Unsupported video url", 400);
  }
  const result = await proxyResults.load(
    cacheKey("mp4", videoUrl),
    (signal) =>
      runAdmittedJob(videoAdmission, signal, async () =>
        mediaResult(await fetchGiphyVideo(videoUrl), MP4_CONTENT_TYPE)
      ),
    request.signal
  );
  return result.kind === "media"
    ? videoResponse(
        result.data,
        result.cacheControl,
        request.headers.get("range")
      )
    : jsonError(result.error, result.status);
};

const serveImage = async (
  request: NextRequest,
  imageUrl: URL
): Promise<NextResponse> => {
  const width = parseWidth(request.nextUrl.searchParams.get("w"));
  const animated = request.nextUrl.searchParams.get("animated") === "1";
  const result = await proxyResults.load(
    cacheKey(`${animated ? "animated" : "still"}:${width}`, imageUrl),
    (signal) =>
      runAdmittedJob(imageAdmission, signal, async () => {
        const { buffer, complete } = await fetchImageBuffer(imageUrl);
        const { data, contentType, degraded } = await normalizeImage({
          buffer,
          width,
          allowAnimation: complete && animated,
        });
        return mediaResult(data, contentType, degraded);
      }),
    request.signal
  );
  if (result.kind === "error") {
    return jsonError(result.error, result.status);
  }
  return new NextResponse(toResponseBody(result.data), {
    headers: {
      "Cache-Control": result.cacheControl,
      "Content-Type": result.contentType,
    },
  });
};

export async function GET(request: NextRequest) {
  try {
    const sourceUrl = parseImageUrl(request.nextUrl.searchParams.get("url"));
    return request.nextUrl.searchParams.get("format") === "mp4"
      ? await serveGiphyVideo(request, sourceUrl)
      : await serveImage(request, sourceUrl);
  } catch (error) {
    // A caller that left while queued keeps the existing busy answer.
    const failure = request.signal.aborted
      ? new AdmissionQueueError("aborted")
      : error;
    if (!(failure instanceof AdmissionQueueError)) {
      console.error("Unable to normalize OG metadata image.", failure);
    }
    return mapErrorToResponse(failure);
  }
}
