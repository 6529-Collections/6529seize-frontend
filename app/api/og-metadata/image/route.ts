import {
  fetchPublicUrl,
  parsePublicUrl,
  UrlGuardError,
  type FetchPublicUrlOptions,
} from "@/lib/security/urlGuard";
import { OG_IMAGE_PROXY_MAX_BYTES } from "@/app/api/og-metadata/_lib/imageProxyPolicy";
import {
  AdmissionQueue,
  AdmissionQueueError,
} from "@/lib/fetch/admissionQueue";
import { NextResponse, type NextRequest } from "next/server";
import sharp, { type Metadata } from "sharp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_WIDTH = 1200;
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 12000;
const MAX_INPUT_PIXELS = 512_000_000;
const MAX_INPUT_DIMENSION = 65_536;
// Admit before fetching to bound both compressed buffers and native image work.
// Ordinary multi-image cards can wait briefly without allocating image buffers.
const imageAdmission = new AdmissionQueue({ maxPending: 32, waitMs: 15_000 });
const OVERSIZED_GIF_PREVIEW_MAX_BYTES = 8 * 1024 * 1024;
const MAX_ANIMATED_WORK_BYTES = 512 * 1024 * 1024;
const PNG_CONTENT_TYPE = "image/png";
const GIF_CONTENT_TYPE = "image/gif";
const CACHE_CONTROL =
  "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=2592000";
const IMAGE_ACCEPT_HEADER =
  "image/png,image/jpeg,image/gif,image/webp,image/svg+xml,*/*;q=0.5";
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
  if (error instanceof UrlGuardError) {
    switch (error.kind) {
      case "missing-url":
      case "invalid-url":
      case "unsupported-protocol":
        return jsonError("Invalid image url", 400);
      case "host-not-allowed":
      case "dns-lookup-failed":
      case "ip-not-allowed":
        return jsonError("Unsupported image host", 400);
      case "timeout":
        return jsonError("Upstream timeout", 504);
      default:
        return jsonError("Failed to fetch image", 502);
    }
  }

  return jsonError("Failed to normalize image", 502);
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

const detectContentType = (buffer: Buffer): string | null => {
  const signature = IMAGE_TYPE_SIGNATURES.find(({ matches }) =>
    matches(buffer)
  );
  if (signature) {
    return signature.contentType;
  }

  const prefix = buffer.subarray(0, 256).toString("utf8").trimStart();
  if (prefix.startsWith("<svg") || prefix.startsWith("<?xml")) {
    return "image/svg+xml";
  }

  return null;
};

const normalizeImage = async ({
  buffer,
  width,
  allowAnimation,
}: {
  readonly buffer: Buffer;
  readonly width: number;
  readonly allowAnimation: boolean;
}): Promise<{ data: Buffer; contentType: string }> => {
  const detectedContentType = detectContentType(buffer);
  if (!detectedContentType?.startsWith("image/")) {
    throw new Error("Upstream response is not an image.");
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
  const output = (
    animated
      ? sharp(buffer, {
          animated: true,
          limitInputPixels: MAX_ANIMATED_WORK_BYTES / 16,
        }).timeout({ seconds: 7 })
      : image
  )
    .rotate()
    .resize(width, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true });
  if (animated)
    return {
      data: await output.gif().toBuffer(),
      contentType: GIF_CONTENT_TYPE,
    };
  return {
    data: await output.png({ quality: 100 }).toBuffer(),
    contentType: PNG_CONTENT_TYPE,
  };
};

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

export async function GET(request: NextRequest) {
  let releaseAdmission: (() => void) | undefined;
  try {
    const imageUrl = parseImageUrl(request.nextUrl.searchParams.get("url"));
    const width = parseWidth(request.nextUrl.searchParams.get("w"));
    releaseAdmission = await imageAdmission.acquire(request.signal);
    const { buffer, complete } = await fetchImageBuffer(imageUrl);
    const { data, contentType } = await normalizeImage({
      buffer,
      width,
      allowAnimation:
        complete && request.nextUrl.searchParams.get("animated") === "1",
    });

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Cache-Control": CACHE_CONTROL,
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    if (!(error instanceof AdmissionQueueError)) {
      console.error("Unable to normalize OG metadata image.", error);
    }
    return mapErrorToResponse(error);
  } finally {
    releaseAdmission?.();
  }
}
