import { getContentType } from "@/services/uploads/multipartUploadCore";

describe("getContentType", () => {
  it("normalizes csv files to text/csv", () => {
    const file = new File(["a,b"], "data.csv", {
      type: "application/vnd.ms-excel",
    });

    expect(getContentType(file)).toBe("text/csv");
  });

  it("keeps non-csv mime types unchanged", () => {
    const file = new File(["x"], "image.png", {
      type: "image/png",
    });

    expect(getContentType(file)).toBe("image/png");
  });
});
