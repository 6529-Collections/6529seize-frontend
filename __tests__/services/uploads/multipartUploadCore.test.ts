import { getContentType } from "@/services/uploads/multipartUploadCore";

describe("getContentType", () => {
  it("uses the browser-provided MIME type when present", () => {
    const file = new File(["data"], "report.csv", {
      type: "application/custom",
    });

    expect(getContentType(file)).toBe("application/custom");
  });

  it("falls back to PDF, CSV, and WebP extensions", () => {
    expect(getContentType(new File(["data"], "paper.pdf"))).toBe(
      "application/pdf"
    );
    expect(getContentType(new File(["data"], "data.csv"))).toBe("text/csv");
    expect(getContentType(new File(["data"], "image.webp"))).toBe("image/webp");
  });
});
