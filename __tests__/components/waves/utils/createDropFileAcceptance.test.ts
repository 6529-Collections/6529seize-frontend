import { getAcceptedCreateDropFiles } from "@/components/waves/utils/createDropFileAcceptance";

const file = (name: string, type: string): File =>
  new File([""], name, { type });

describe("getAcceptedCreateDropFiles", () => {
  it("rejects CSV files in drop mode and keeps non-CSV files", () => {
    const image = file("art.png", "image/png");
    const csvByMime = file("wallets.txt", "text/csv");
    const csvByExtension = file("wallets.csv", "application/octet-stream");

    const result = getAcceptedCreateDropFiles({
      files: [image, csvByMime, csvByExtension],
      isDropMode: true,
    });

    expect(result.acceptedFiles).toEqual([image]);
    expect(result.rejectedCsvFiles).toEqual([csvByMime, csvByExtension]);
  });

  it("keeps CSV files in chat mode", () => {
    const csv = file("wallets.csv", "text/csv");

    const result = getAcceptedCreateDropFiles({
      files: [csv],
      isDropMode: false,
    });

    expect(result.acceptedFiles).toEqual([csv]);
    expect(result.rejectedCsvFiles).toEqual([]);
  });
});
