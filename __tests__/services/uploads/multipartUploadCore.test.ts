import {
  getApiMediaUploadMimeType,
  getContentType,
  multipartUploadCore,
  toApiMediaUploadMimeType,
} from "@/services/uploads/multipartUploadCore";
import { toApiAttachmentUploadMimeType } from "@/services/uploads/attachmentUploadMimeType";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import axios from "axios";
import { ApiDropMediaStatus } from "@/generated/models/ApiDropMediaStatus";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    put: jest.fn(),
  },
}));

const commonApiPostMock = commonApiPost as jest.Mock;
const commonApiFetchMock = commonApiFetch as jest.Mock;
const axiosPutMock = axios.put as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
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

  it("maps extension fallbacks to supported backend MIME types", () => {
    expect(getContentType(new File(["{}"], "scene.gltf"))).toBe(
      "model/gltf-binary"
    );
    expect(getApiMediaUploadMimeType(new File(["{}"], "scene.gltf"))).toBe(
      "model/gltf-binary"
    );
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
    });
    expect(onCompleting).toHaveBeenCalledTimes(1);
    expect(commonApiFetchMock).not.toHaveBeenCalled();
  });
});
