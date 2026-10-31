import { downloadJsonFile } from "@/helpers/json-download.helpers";

describe("downloadJsonFile", () => {
  const originalCreateObjectURL = globalThis.URL.createObjectURL;
  const originalRevokeObjectURL = globalThis.URL.revokeObjectURL;
  let createObjectURL: jest.Mock;
  let revokeObjectURL: jest.Mock;
  let anchor: HTMLAnchorElement;

  beforeEach(() => {
    createObjectURL = jest.fn(() => "blob:json-download");
    revokeObjectURL = jest.fn();
    globalThis.URL.createObjectURL = createObjectURL;
    globalThis.URL.revokeObjectURL = revokeObjectURL;
    const realCreateElement = document.createElement.bind(document);
    jest.spyOn(document, "createElement").mockImplementation(((tag: string) => {
      const element = realCreateElement(tag);
      if (tag === "a") {
        anchor = element as HTMLAnchorElement;
        anchor.click = jest.fn();
      }
      return element;
    }) as typeof document.createElement);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    globalThis.URL.createObjectURL = originalCreateObjectURL;
    globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("downloads the JSON as a named file and revokes the object URL", () => {
    downloadJsonFile('{"a":1}', "results.json");

    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("application/json");
    expect(blob.size).toBe(7);
    expect(anchor.href).toBe("blob:json-download");
    expect(anchor.download).toBe("results.json");
    expect(anchor.click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:json-download");
  });

  it("revokes the object URL even when triggering the download throws", () => {
    jest.mocked(document.createElement).mockImplementation((() => {
      throw new Error("blocked");
    }) as typeof document.createElement);

    expect(() => downloadJsonFile("{}", "results.json")).toThrow("blocked");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:json-download");
  });
});
