import axios from "axios";
import { commonApiPost } from "@/services/api/common-api";
import {
  getUploadFailureMessage,
  MediaUploadRefusedError,
  toUploadRequestError,
} from "@/services/uploads/MediaUploadRefusedError";
import {
  multipartAttachmentUploadCore,
  multipartUploadCore,
} from "@/services/uploads/multipartUploadCore";

jest.mock("@/services/api/common-api", () => ({
  ...jest.requireActual("@/services/api/common-api"),
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));
jest.mock("@/services/uploads/captureVideoPoster", () => ({
  captureVideoPoster: jest.fn().mockResolvedValue(undefined),
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
const axiosPutMock = axios.put as jest.Mock;

const LIMIT_MESSAGE =
  "You have reached the upload limit for the last 24 hours. Try again later.";
const SIZE_MESSAGE = "Media files must be 500 MB or smaller.";
const SIZE_WITHOUT_LIMIT =
  "This file is larger than the upload limit. Choose a smaller file.";

/** The error `commonApiPost` throws in structured mode. */
function apiError(status: number, body: Record<string, unknown>): Error {
  return rawApiError(status, String(body["error"] ?? ""), JSON.stringify(body));
}

function rawApiError(status: number, message: string, body: string): Error {
  const headers = new Headers();
  return Object.assign(new Error(message), {
    name: "ApiError",
    status,
    headers,
    response: { status, headers, body },
  });
}

const HTML_PAGE = "<html><body><h1>502 Bad Gateway</h1></body></html>";
const GENERIC_MESSAGE = "Error uploading file. Please try again.";

const uploadLimitError = () =>
  apiError(429, {
    limit: "uploads",
    max_uploads: 500,
    window_hours: 24,
    retry_after_seconds: 3600,
    error: "Upload limit reached: at most 500 uploads per 24 hours",
    code: "MEDIA_UPLOAD_BUDGET_EXCEEDED",
  });
const tooLargeError = () =>
  apiError(413, {
    max_bytes: 524288000,
    error: "Media files can be at most 500 MiB",
    code: "MEDIA_TOO_LARGE",
  });

const mediaEndpoints = {
  start: "drop-media/multipart-upload",
  part: "drop-media/multipart-upload/part",
  complete: "drop-media/multipart-upload/completion",
};
const attachmentEndpoints = {
  start: "attachments/multipart-upload",
  part: "attachments/multipart-upload/part",
  complete: "attachments/multipart-upload/completion",
};
const video = () => new File(["video"], "clip.mp4", { type: "video/mp4" });
const pdf = () =>
  new File(["%PDF-1.7"], "doc.pdf", { type: "application/pdf" });

beforeEach(() => {
  commonApiPostMock.mockReset();
  axiosPutMock.mockReset();
  axiosPutMock.mockResolvedValue({ headers: { etag: '"etag"' } });
});

describe("toUploadRequestError", () => {
  it("names the rolling upload limit", () => {
    const mapped = toUploadRequestError(uploadLimitError(), "en-US");
    expect(mapped).toBeInstanceOf(MediaUploadRefusedError);
    expect((mapped as Error).message).toBe(LIMIT_MESSAGE);
  });

  it("names the media size limit", () => {
    const mapped = toUploadRequestError(tooLargeError(), "en-US");
    expect(mapped).toBeInstanceOf(MediaUploadRefusedError);
    expect((mapped as Error).message).toBe(SIZE_MESSAGE);
  });

  it("uses the limit the server sends", () => {
    const mapped = toUploadRequestError(
      apiError(413, { max_bytes: 262144000, code: "MEDIA_TOO_LARGE" }),
      "en-US"
    );
    expect((mapped as Error).message).toBe(
      "Media files must be 250 MB or smaller."
    );
  });

  it.each([undefined, 0, -1, "500", Number.NaN])(
    "names no number when the limit is %p",
    (maxBytes) => {
      const mapped = toUploadRequestError(
        apiError(413, { max_bytes: maxBytes, code: "MEDIA_TOO_LARGE" }),
        "en-US"
      );
      expect(mapped).toBeInstanceOf(MediaUploadRefusedError);
      expect((mapped as Error).message).toBe(SIZE_WITHOUT_LIMIT);
    }
  );

  it("never keeps a body that is not JSON as the message", () => {
    const mapped = toUploadRequestError(
      rawApiError(502, HTML_PAGE, HTML_PAGE),
      "en-US"
    );
    expect(mapped).not.toBeInstanceOf(MediaUploadRefusedError);
    expect((mapped as Error).message).toBe(GENERIC_MESSAGE);
    expect(getUploadFailureMessage(mapped, "Upload failed")).toBe(
      "Upload failed"
    );
  });

  it.each([
    ["a request rate limit", apiError(429, { error: "Rate limit exceeded" })],
    ["a server error", apiError(500, { error: "Something went wrong" })],
    [
      "a code on another status",
      apiError(400, { error: "x", code: "MEDIA_TOO_LARGE" }),
    ],
    ["a legacy string error", "Upload limit reached"],
  ])("returns %s unchanged", (_label, error) => {
    expect(toUploadRequestError(error, "en-US")).toBe(error);
  });
});

describe("upload refusals are shown, not retried", () => {
  it("stops at the start request when the upload limit is reached", async () => {
    commonApiPostMock.mockRejectedValueOnce(uploadLimitError());

    const upload = multipartUploadCore({
      file: video(),
      endpoints: mediaEndpoints,
    });

    await expect(upload).rejects.toBeInstanceOf(MediaUploadRefusedError);
    await expect(upload).rejects.toThrow(LIMIT_MESSAGE);
    expect(commonApiPostMock).toHaveBeenCalledTimes(1);
    expect(axiosPutMock).not.toHaveBeenCalled();
  });

  it("reports the size limit when completion refuses the media", async () => {
    commonApiPostMock
      .mockResolvedValueOnce({ upload_id: "upload-1", key: "drops/clip.mp4" })
      .mockResolvedValueOnce({ upload_url: "https://s3.example/upload" })
      .mockRejectedValueOnce(tooLargeError());

    await expect(
      multipartUploadCore({ file: video(), endpoints: mediaEndpoints })
    ).rejects.toThrow(SIZE_MESSAGE);
    expect(
      commonApiPostMock.mock.calls.filter(
        ([call]) => call.endpoint === mediaEndpoints.complete
      )
    ).toHaveLength(1);
  });

  it("names the upload limit for attachments too", async () => {
    commonApiPostMock.mockRejectedValueOnce(uploadLimitError());

    await expect(
      multipartAttachmentUploadCore({
        file: pdf(),
        endpoints: attachmentEndpoints,
      })
    ).rejects.toThrow(LIMIT_MESSAGE);
    expect(commonApiPostMock).toHaveBeenCalledTimes(1);
    expect(commonApiPostMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: attachmentEndpoints.start,
        errorMode: "structured",
      })
    );
  });

  it("shows the generic upload message for an HTML error page", async () => {
    commonApiPostMock.mockRejectedValueOnce(
      rawApiError(502, HTML_PAGE, HTML_PAGE)
    );

    await expect(
      multipartUploadCore({ file: video(), endpoints: mediaEndpoints })
    ).rejects.toThrow(GENERIC_MESSAGE);
    expect(commonApiPostMock).toHaveBeenCalledTimes(1);
  });

  it("passes other start failures through with their message", async () => {
    commonApiPostMock.mockRejectedValueOnce(
      apiError(400, { error: "Invalid content type" })
    );

    await expect(
      multipartUploadCore({ file: video(), endpoints: mediaEndpoints })
    ).rejects.toThrow("Invalid content type");
  });
});

describe("getUploadFailureMessage", () => {
  it("keeps refusal and local messages and hides API failures", () => {
    expect(
      getUploadFailureMessage(new MediaUploadRefusedError("limit"), "fallback")
    ).toBe("limit");
    expect(
      getUploadFailureMessage(new Error("Empty file uploads"), "fallback")
    ).toBe("Empty file uploads");
    expect(
      getUploadFailureMessage(apiError(500, { error: "x" }), "fallback")
    ).toBe("fallback");
    expect(getUploadFailureMessage("raw", "fallback")).toBe("fallback");
  });
});
