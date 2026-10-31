import { downloadCsvFile } from "@/components/mapping-tools/mappingToolDownload";

describe("downloadCsvFile", () => {
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;
  let createObjectUrl: jest.Mock;
  let revokeObjectUrl: jest.Mock;
  let clickSpy: jest.SpyInstance;

  beforeEach(() => {
    createObjectUrl = jest.fn(() => "blob:https://6529.io/csv-1");
    revokeObjectUrl = jest.fn();
    URL.createObjectURL = createObjectUrl;
    URL.revokeObjectURL = revokeObjectUrl;
    clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    clickSpy.mockRestore();
  });

  it("downloads the CSV through a temporary link and releases the object URL", () => {
    let linkDuringClick: HTMLAnchorElement | undefined;
    clickSpy.mockImplementation(function (this: HTMLAnchorElement) {
      linkDuringClick = this;
      expect(document.body.contains(this)).toBe(true);
      expect(revokeObjectUrl).not.toHaveBeenCalled();
    });

    downloadCsvFile("a,b\n1,2", "output.csv");

    const blob = createObjectUrl.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("text/csv;charset=utf-8;");
    expect(linkDuringClick?.getAttribute("href")).toBe(
      "blob:https://6529.io/csv-1"
    );
    expect(linkDuringClick?.getAttribute("download")).toBe("output.csv");
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:https://6529.io/csv-1");
    expect(document.querySelector("a[download]")).toBeNull();
  });

  it("releases the object URL even when the download cannot start", () => {
    clickSpy.mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => downloadCsvFile("a", "output.csv")).toThrow("blocked");

    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:https://6529.io/csv-1");
    expect(document.querySelector("a[download]")).toBeNull();
  });
});
