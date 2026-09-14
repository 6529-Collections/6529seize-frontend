/** @jest-environment node */
import { sha256 } from "js-sha256";
import { ApiDropMediaStatus } from "@/generated/models/ApiDropMediaStatus";
import { commonApiFetch } from "@/services/api/common-api";
import { multipartUploadCore } from "@/services/uploads/multipartUploadCore";
import {
  CMS_STUDIO_IMAGE_MAX_BYTES,
  uploadCmsStudioImage,
  type CmsStudioImageUploadOptions,
} from "@/lib/profile-cms/studio/image-upload";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/services/uploads/multipartUploadCore", () => ({
  multipartUploadCore: jest.fn(),
  getContentType: (file: File) => file.type,
}));

const url =
  "https://d3lqz0a4bldqgf.cloudfront.net/drops/author_test/id/image.png";
const completion = {
  media_url: url,
  media_upload_id: "upload-id",
  media_status: ApiDropMediaStatus.Ready,
};
const finalBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 42]);
const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
let decodedBlob: Blob | undefined;
let imageWidth = 640;
let imageHeight = 480;
let decodeFails = false;

class TestImage {
  naturalWidth = imageWidth;
  naturalHeight = imageHeight;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(value: string) {
    if (value)
      queueMicrotask(() => (decodeFails ? this.onerror?.() : this.onload?.()));
  }
}

function options(
  extra: Partial<CmsStudioImageUploadOptions> = {}
): CmsStudioImageUploadOptions {
  return {
    assetId: "asset-image",
    file: new File(["original private input"], "photo.png", {
      type: "image/png",
    }),
    altText: "A quiet landscape",
    rights: "Artist credit",
    signal: new AbortController().signal,
    ...extra,
  };
}

function response(
  bytes: Uint8Array<ArrayBuffer> = finalBytes,
  type = "image/png"
) {
  return new Response(bytes, {
    status: 200,
    headers: { "content-type": type },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  decodedBlob = undefined;
  imageWidth = 640;
  imageHeight = 480;
  decodeFails = false;
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    writable: true,
    value: fetchMock,
  });
  Object.defineProperty(globalThis, "Image", {
    configurable: true,
    writable: true,
    value: TestImage,
  });
  jest.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
    if (blob instanceof Blob) decodedBlob = blob;
    return "blob:verified";
  });
  jest.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  jest.mocked(multipartUploadCore).mockResolvedValue(completion);
  fetchMock.mockResolvedValue(response());
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

it("hashes and decodes the identical processed bytes, never original file bytes", async () => {
  const input = options();
  const asset = await uploadCmsStudioImage(input);
  expect(asset).toMatchObject({
    uri: url,
    width: 640,
    height: 480,
    content_hash: `sha256:${sha256(finalBytes)}`,
    file_size_bytes: finalBytes.length,
    mime_type: "image/png",
    alt_text: "A quiet landscape",
    rights: "Artist credit",
  });
  expect(new Uint8Array(await decodedBlob!.arrayBuffer())).toEqual(finalBytes);
  expect(asset.content_hash).not.toBe(
    `sha256:${sha256("original private input")}`
  );
  expect(fetchMock).toHaveBeenCalledWith(
    url,
    expect.objectContaining({
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
    })
  );
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:verified");
  expect(jest.mocked(multipartUploadCore).mock.calls[0]![0].waitForReady).toBe(
    false
  );
});

it("retains the completed upload on verification failure and retries without uploading again", async () => {
  fetchMock.mockRejectedValueOnce(new Error("private upstream detail"));
  const input = options();
  const error = await uploadCmsStudioImage(input).catch(
    (error: unknown) => error
  );
  expect(error).toMatchObject({
    code: "verification_failed",
    reference: { assetId: input.assetId, completion },
  });
  expect(String(error)).not.toContain("private upstream");
  await uploadCmsStudioImage(
    options({ resume: { assetId: input.assetId, completion } })
  );
  expect(multipartUploadCore).toHaveBeenCalledTimes(1);
});

it("waits for owner status to become ready before requesting public bytes", async () => {
  jest.useFakeTimers();
  jest.mocked(multipartUploadCore).mockResolvedValue({
    ...completion,
    media_status: ApiDropMediaStatus.Processing,
  });
  jest.mocked(commonApiFetch).mockResolvedValue(completion);
  const pending = uploadCmsStudioImage(options());
  expect(fetchMock).not.toHaveBeenCalled();
  await jest.advanceTimersByTimeAsync(1500);
  await expect(pending).resolves.toHaveProperty("width", 640);
  expect(commonApiFetch).toHaveBeenCalledWith(
    expect.objectContaining({ endpoint: "drop-media/uploads/upload-id" })
  );
});

it.each([
  "https://evil.example/drops/author_test/id/image.png",
  "https://d3lqz0a4bldqgf.cloudfront.net@evil.example/drops/author_test/image.png",
  "https://d3lqz0a4bldqgf.cloudfront.net/drops/author_test/image.png?token=secret",
  "https://d3lqz0a4bldqgf.cloudfront.net/other/image.png",
])(
  "refuses unexpected download target %s without making a public fetch",
  async (media_url) => {
    jest
      .mocked(multipartUploadCore)
      .mockResolvedValue({ ...completion, media_url });
    await expect(uploadCmsStudioImage(options())).rejects.toMatchObject({
      code: "invalid_response",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  }
);

it.each([202, 206, 302])(
  "rejects HTTP %s as incomplete final bytes",
  async (status) => {
    fetchMock.mockResolvedValue(new Response(finalBytes, { status }));
    await expect(uploadCmsStudioImage(options())).rejects.toMatchObject({
      code: "verification_failed",
    });
  }
);

it("bounds streamed bytes without trusting Content-Length", async () => {
  const cancel = jest.fn();
  fetchMock.mockResolvedValue(
    new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(CMS_STUDIO_IMAGE_MAX_BYTES));
          controller.enqueue(new Uint8Array([1]));
        },
        cancel,
      }),
      { headers: { "content-type": "image/png" } }
    )
  );
  await expect(uploadCmsStudioImage(options())).rejects.toMatchObject({
    code: "too_large",
  });
  expect(cancel).toHaveBeenCalled();
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});

it.each(["image/svg+xml", "text/html"])(
  "rejects final MIME %s",
  async (mime) => {
    fetchMock.mockResolvedValue(response(finalBytes, mime));
    await expect(uploadCmsStudioImage(options())).rejects.toMatchObject({
      code: "verification_failed",
    });
  }
);

it("rejects HTML mislabeled as a supported image", async () => {
  fetchMock.mockResolvedValue(
    response(new TextEncoder().encode("<html>error</html>"))
  );
  await expect(uploadCmsStudioImage(options())).rejects.toMatchObject({
    code: "verification_failed",
  });
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});

it("does not fabricate dimensions when decoding fails", async () => {
  decodeFails = true;
  await expect(uploadCmsStudioImage(options())).rejects.toMatchObject({
    code: "verification_failed",
  });
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:verified");
});

it("enforces the download deadline even for an unresponsive fetch", async () => {
  jest.useFakeTimers();
  fetchMock.mockImplementation(() => new Promise(() => undefined));
  const pending = uploadCmsStudioImage(options());
  const assertion = expect(pending).rejects.toMatchObject({
    code: "timed_out",
    reference: { completion },
  });
  await jest.advanceTimersByTimeAsync(30_000);
  await assertion;
  expect(fetchMock.mock.calls[0]![1]!.signal!.aborted).toBe(true);
});

it("aborts before an upload and rejects invalid files without network calls", async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(
    uploadCmsStudioImage(options({ signal: controller.signal }))
  ).rejects.toMatchObject({ code: "cancelled" });
  await expect(
    uploadCmsStudioImage(
      options({
        file: new File(["svg"], "file.svg", { type: "image/svg+xml" }),
      })
    )
  ).rejects.toMatchObject({ code: "invalid_file" });
  expect(multipartUploadCore).not.toHaveBeenCalled();
});
