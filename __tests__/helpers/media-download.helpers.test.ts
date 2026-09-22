import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { downloadMediaUrl } from "@/helpers/media-download.helpers";

jest.mock("@capacitor/filesystem", () => ({
  Directory: { Cache: "CACHE" },
  Filesystem: {
    downloadFile: jest.fn(),
    getUri: jest.fn(),
    deleteFile: jest.fn(),
  },
}));
jest.mock("@capacitor/share", () => ({ Share: { share: jest.fn() } }));

beforeEach(() => {
  jest.resetAllMocks();
  jest
    .mocked(Filesystem.downloadFile)
    .mockResolvedValue({ path: "native-file" });
  jest
    .mocked(Filesystem.getUri)
    .mockResolvedValue({ uri: "file://native-file" });
  jest.mocked(Filesystem.deleteFile).mockResolvedValue();
  jest.mocked(Share.share).mockResolvedValue({});
});

const options = {
  url: "https://example.com/huge.jpg",
  fileName: "huge.jpg",
  isCapacitor: true,
};
it("downloads native originals directly to disk and removes them after sharing", async () => {
  const fetchSpy = jest.spyOn(globalThis, "fetch");
  await downloadMediaUrl(options);
  expect(fetchSpy).not.toHaveBeenCalled();
  expect(Filesystem.downloadFile).toHaveBeenCalledWith(
    expect.objectContaining({ url: options.url, directory: Directory.Cache })
  );
  expect(Share.share).toHaveBeenCalledWith(
    expect.objectContaining({ url: "file://native-file" })
  );
  expect(Filesystem.deleteFile).toHaveBeenCalledWith(
    expect.objectContaining({ directory: Directory.Cache })
  );
  fetchSpy.mockRestore();
});

it.each(["download", "share"])(
  "cleans up after a %s failure without opening an original in the WebView",
  async (step) => {
    const error = new Error("Denied");
    if (step === "download")
      jest.mocked(Filesystem.downloadFile).mockRejectedValue(error);
    else jest.mocked(Share.share).mockRejectedValue(error);
    await expect(downloadMediaUrl(options)).rejects.toThrow("Denied");
    expect(Filesystem.deleteFile).toHaveBeenCalledTimes(1);
    if (step === "download") expect(Share.share).not.toHaveBeenCalled();
  }
);
