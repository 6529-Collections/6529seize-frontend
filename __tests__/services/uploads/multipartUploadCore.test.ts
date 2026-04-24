import {
  getApiMediaUploadMimeType,
  getContentType,
  toApiMediaUploadMimeType,
} from "@/services/uploads/multipartUploadCore";

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
    expect(toApiMediaUploadMimeType("text/csv; charset=utf-8")).toBe(
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
});
