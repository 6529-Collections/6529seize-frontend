import {
  getApiMediaUploadMimeType,
  getContentType,
  multipartUploadCore,
  toApiMediaUploadMimeType,
} from "@/services/uploads/multipartUploadCore";
import { captureVideoPoster } from "@/services/uploads/captureVideoPoster";
jest.mock("@/services/uploads/captureVideoPoster", () => ({
  captureVideoPoster: jest.fn().mockResolvedValue(undefined),
}));
import { toApiAttachmentUploadMimeType } from "@/services/uploads/attachmentUploadMimeType";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import axios, { CanceledError } from "axios";
import { ApiDropMediaStatus } from "@/generated/models/ApiDropMediaStatus";
import { ApiMediaUploadPurpose } from "@/generated/models/ApiMediaUploadPurpose";
import { loadLocaleMessages } from "@/i18n/messages";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));

jest.mock("axios", () => {
  const actual = jest.requireActual("axios");
  return {
    ...actual,
    __esModule: true,
    default: { ...actual.default, put: jest.fn() },
  };
});

const commonApiPostMock = commonApiPost as jest.Mock;
const commonApiFetchMock = commonApiFetch as jest.Mock;
const axiosPutMock = axios.put as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  commonApiPostMock.mockReset();
  commonApiFetchMock.mockReset();
  axiosPutMock.mockReset();
  jest.mocked(captureVideoPoster).mockReset().mockResolvedValue(undefined);
});

it.each([ApiDropMediaStatus.Failed, ApiDropMediaStatus.Processing])(
  "uses the active locale for image failure at %s",
  async (status) => {
    await loadLocaleMessages("fr-FR");
    commonApiPostMock
      .mockResolvedValueOnce({ upload_id: "upload-1", key: "drops/img.jpg" })
      .mockResolvedValueOnce({ upload_url: "https://s3.example/upload" })
      .mockResolvedValueOnce({
        media_url: "https://cdn.example/drops/img.jpg",
        media_upload_id: "media-upload-1",
        media_status: status,
      });
    commonApiFetchMock.mockResolvedValue({
      media_url: "https://cdn.example/drops/img.jpg",
      media_upload_id: "media-upload-1",
      media_status: ApiDropMediaStatus.Failed,
    });
    axiosPutMock.mockResolvedValue({ headers: { etag: '"part-etag"' } });
    await expect(
      multipartUploadCore({
        file: new File(["image"], "img.jpg", { type: "image/jpeg" }),
        endpoints: {
          start: "drop-media/multipart-upload",
          part: "drop-media/multipart-upload/part",
          complete: "drop-media/multipart-upload/completion",
        },
        waitForReady: true,
        locale: "fr-FR",
      })
    ).rejects.toThrow("Le traitement de l'image a echoue.");
  }
);

describe("device video poster upload", () => {
  const endpoints = {
    start: "drop-media/multipart-upload",
    part: "drop-media/multipart-upload/part",
    complete: "drop-media/multipart-upload/completion",
  };
  beforeEach(() => {
    jest.mocked(captureVideoPoster).mockReset().mockResolvedValue(undefined);
    commonApiPostMock
      .mockResolvedValueOnce({
        upload_id: "upload-1",
        key: "drops/owner/clip.mp4",
      })
      .mockResolvedValueOnce({ upload_url: "https://s3.example/upload" })
      .mockResolvedValueOnce({
        media_url: "https://cdn.example/drops/owner/clip.mp4",
      });
    axiosPutMock.mockResolvedValue({ headers: { etag: '"etag"' } });
  });
  it("uploads video parts concurrently with capture, then includes the JPEG in completion", async () => {
    let completeCapture: ((value: string | undefined) => void) | undefined;
    jest.mocked(captureVideoPoster).mockImplementation(
      () =>
        new Promise((resolve) => {
          completeCapture = resolve;
        })
    );
    const result = multipartUploadCore({
      file: new File(["video"], "clip.mp4", { type: "video/mp4" }),
      endpoints,
    });
    // Wait for the actual part transfer; the pending capture must not block it.
    for (let index = 0; index < 10; index += 1) await Promise.resolve();
    expect(axiosPutMock).toHaveBeenCalledTimes(1);
    expect(commonApiPostMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: endpoints.complete })
    );
    completeCapture?.("cG9zdGVy");
    await result;
    expect(commonApiPostMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        endpoint: endpoints.complete,
        body: expect.objectContaining({ video_poster_base64: "cG9zdGVy" }),
      })
    );
    const captureSignal = jest.mocked(captureVideoPoster).mock.calls[0]?.[1];
    expect(captureSignal?.aborted).toBe(true);
  });
  it("completes normally without a poster when local capture fails", async () => {
    await multipartUploadCore({
      file: new File(["video"], "clip.mp4", { type: "video/mp4" }),
      endpoints,
    });
    expect(commonApiPostMock.mock.calls.at(-1)?.[0].body).not.toHaveProperty(
      "video_poster_base64"
    );
  });
  it("does not decode image uploads", async () => {
    await multipartUploadCore({
      file: new File(["image"], "clip.jpg", { type: "image/jpeg" }),
      endpoints,
    });
    expect(captureVideoPoster).not.toHaveBeenCalled();
  });
  it("aborts local capture when video upload fails", async () => {
    axiosPutMock.mockRejectedValue(new CanceledError("aborted"));
    let captureSignal: AbortSignal | undefined;
    jest.mocked(captureVideoPoster).mockImplementation((_file, signal) => {
      captureSignal = signal;
      return new Promise((resolve) =>
        signal.addEventListener("abort", () => resolve(undefined), {
          once: true,
        })
      );
    });
    await expect(
      multipartUploadCore({
        file: new File(["video"], "clip.mp4", { type: "video/mp4" }),
        endpoints,
      })
    ).rejects.toThrow();
    expect(captureSignal?.aborted).toBe(true);
    expect(commonApiPostMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: endpoints.complete })
    );
  });
});

describe("start request purpose", () => {
  const endpoints = {
    start: "drop-media/multipart-upload",
    part: "drop-media/multipart-upload/part",
    complete: "drop-media/multipart-upload/completion",
  };
  const photo = () =>
    new File(["jpeg"], "IMG_0001.jpg", { type: "image/jpeg" });
  beforeEach(() => {
    commonApiPostMock
      .mockResolvedValueOnce({ upload_id: "upload-1", key: "drops/a/photo" })
      .mockResolvedValueOnce({ upload_url: "https://s3.example/upload" })
      .mockResolvedValueOnce({ media_url: "https://cdn.example/photo.jpg" });
    axiosPutMock.mockResolvedValue({ headers: { etag: '"etag"' } });
  });

  it("sends decision_entry so the original file is kept", async () => {
    await multipartUploadCore({
      file: photo(),
      endpoints,
      purpose: ApiMediaUploadPurpose.DecisionEntry,
    });
    expect(commonApiPostMock).toHaveBeenNthCalledWith(1, {
      endpoint: endpoints.start,
      body: {
        file_name: "IMG_0001.jpg",
        content_type: "image/jpeg",
        purpose: "decision_entry",
      },
      errorMode: "structured",
    });
  });

  it.each([undefined, ApiMediaUploadPurpose.Chat])(
    "leaves the purpose out for chat (%s), the API default",
    async (purpose) => {
      await multipartUploadCore({ file: photo(), endpoints, purpose });
      expect(commonApiPostMock).toHaveBeenNthCalledWith(1, {
        endpoint: endpoints.start,
        body: { file_name: "IMG_0001.jpg", content_type: "image/jpeg" },
        errorMode: "structured",
      });
    }
  );
});

describe("multipartUploadCore MIME helpers", () => {
  it("uses the browser MIME when it is API-supported", () => {
    expect(
      getContentType(
        new File(["data"], "report.csv", { type: "text/csv; charset=utf-8" })
      )
    ).toBe("text/csv");
  });

  it("falls back to the filename extension when the browser MIME is not API-supported", () => {
    const file = new File(["data"], "report.csv", {
      type: "application/custom",
    });

    expect(getContentType(file)).toBe("text/csv");
  });

  it("falls back to PDF, CSV, and WebP extensions", () => {
    expect(getContentType(new File(["data"], "paper.pdf"))).toBe(
      "application/pdf"
    );
    expect(getContentType(new File(["data"], "data.csv"))).toBe("text/csv");
    expect(getContentType(new File(["data"], "image.webp"))).toBe("image/webp");
  });

  it("maps supported MIME types through the backend enum", () => {
    expect(toApiMediaUploadMimeType("image/jpg")).toBe("image/jpg");
    expect(toApiMediaUploadMimeType("text/csv; charset=utf-8")).toBeNull();
    expect(toApiAttachmentUploadMimeType("text/csv; charset=utf-8")).toBe(
      "text/csv"
    );
    expect(toApiMediaUploadMimeType("model/gltf+json")).toBeNull();
    expect(toApiMediaUploadMimeType("application/octet-stream")).toBeNull();
  });

  it("maps GLB but rejects JSON GLTF uploads", () => {
    expect(getContentType(new File(["data"], "scene.glb"))).toBe(
      "model/gltf-binary"
    );
    expect(getApiMediaUploadMimeType(new File(["data"], "scene.glb"))).toBe(
      "model/gltf-binary"
    );
    expect(() =>
      getApiMediaUploadMimeType(
        new File(["{}"], "scene.gltf", { type: "model/gltf+json" })
      )
    ).toThrow("Unsupported file type for upload: scene.gltf");
  });

  it("rejects uploads that are not supported by the backend enum", () => {
    expect(() =>
      getApiMediaUploadMimeType(new File(["data"], "notes.txt"))
    ).toThrow("Unsupported file type for upload: notes.txt");
  });

  it("calls start, part, and completion endpoints and returns completion metadata", async () => {
    const onCompleting = jest.fn();
    commonApiPostMock
      .mockResolvedValueOnce({ upload_id: "upload-1", key: "drops/img.jpg" })
      .mockResolvedValueOnce({ upload_url: "https://s3.example/upload" })
      .mockResolvedValueOnce({
        media_url: "https://cdn.example/drops/img.jpg",
        media_upload_id: "media-upload-1",
        media_status: ApiDropMediaStatus.Processing,
      });
    axiosPutMock.mockResolvedValue({ headers: { etag: '"part-etag"' } });

    const response = await multipartUploadCore({
      file: new File(["image"], "img.jpg", { type: "image/jpeg" }),
      endpoints: {
        start: "drop-media/multipart-upload",
        part: "drop-media/multipart-upload/part",
        complete: "drop-media/multipart-upload/completion",
      },
      onCompleting,
    });

    expect(response).toEqual({
      media_url: "https://cdn.example/drops/img.jpg",
      media_upload_id: "media-upload-1",
      media_status: ApiDropMediaStatus.Processing,
    });
    expect(commonApiPostMock.mock.calls.map(([call]) => call.endpoint)).toEqual(
      [
        "drop-media/multipart-upload",
        "drop-media/multipart-upload/part",
        "drop-media/multipart-upload/completion",
      ]
    );
    expect(commonApiPostMock).toHaveBeenLastCalledWith({
      endpoint: "drop-media/multipart-upload/completion",
      body: {
        upload_id: "upload-1",
        key: "drops/img.jpg",
        parts: [{ part_no: 1, etag: "part-etag" }],
      },
      errorMode: "structured",
    });
    expect(onCompleting).toHaveBeenCalledTimes(1);
    expect(commonApiFetchMock).not.toHaveBeenCalled();
  });

  it("rejects failed image processing even when not waiting for ready", async () => {
    commonApiPostMock
      .mockResolvedValueOnce({ upload_id: "upload-1", key: "drops/img.jpg" })
      .mockResolvedValueOnce({ upload_url: "https://s3.example/upload" })
      .mockResolvedValueOnce({
        media_url: "https://cdn.example/drops/img.jpg",
        media_upload_id: "media-upload-1",
        media_status: ApiDropMediaStatus.Failed,
      });
    axiosPutMock.mockResolvedValue({ headers: { etag: '"part-etag"' } });

    await expect(
      multipartUploadCore({
        file: new File(["image"], "img.jpg", { type: "image/jpeg" }),
        endpoints: {
          start: "drop-media/multipart-upload",
          part: "drop-media/multipart-upload/part",
          complete: "drop-media/multipart-upload/completion",
        },
      })
    ).rejects.toThrow("Image processing failed.");
  });

  it("continues polling after a transient media status fetch failure", async () => {
    commonApiPostMock
      .mockResolvedValueOnce({ upload_id: "upload-1", key: "drops/img.jpg" })
      .mockResolvedValueOnce({ upload_url: "https://s3.example/upload" })
      .mockResolvedValueOnce({
        media_url: "https://cdn.example/drops/img.jpg",
        media_upload_id: "media upload/1",
        media_status: ApiDropMediaStatus.Processing,
      });
    commonApiFetchMock
      .mockRejectedValueOnce(new Error("temporary status failure"))
      .mockResolvedValueOnce({
        media_url: "https://cdn.example/drops/img.jpg",
        media_upload_id: "media upload/1",
        media_status: ApiDropMediaStatus.Ready,
      });
    axiosPutMock.mockResolvedValue({ headers: { etag: '"part-etag"' } });

    const response = await multipartUploadCore({
      file: new File(["image"], "img.jpg", { type: "image/jpeg" }),
      endpoints: {
        start: "drop-media/multipart-upload",
        part: "drop-media/multipart-upload/part",
        complete: "drop-media/multipart-upload/completion",
      },
      waitForReady: true,
    });

    expect(response.media_status).toBe(ApiDropMediaStatus.Ready);
    expect(commonApiFetchMock).toHaveBeenCalledTimes(2);
    expect(commonApiFetchMock).toHaveBeenNthCalledWith(1, {
      endpoint: "drop-media/uploads/media%20upload%2F1",
    });
  });
});
