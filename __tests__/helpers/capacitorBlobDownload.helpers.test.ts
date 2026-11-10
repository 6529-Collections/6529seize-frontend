import { Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

import {
  downloadAndShareInNativeApp,
  shareFetchedBlobInNativeApp,
  shareTextFileInNativeApp,
} from "@/helpers/capacitorBlobDownload.helpers";

jest.mock("@capacitor/filesystem", () => ({
  Directory: { Cache: "CACHE", Documents: "DOCUMENTS" },
  Encoding: { UTF8: "utf8" },
  Filesystem: {
    writeFile: jest.fn(),
    downloadFile: jest.fn(),
    getUri: jest.fn(),
    deleteFile: jest.fn(),
    mkdir: jest.fn(),
    readdir: jest.fn(),
  },
}));
jest.mock("@capacitor/share", () => ({ Share: { share: jest.fn() } }));

const NOW = 1_800_000_000_000;
const MINUTE = 60_000;

const entry = (
  name: string,
  mtime: number | undefined,
  type: "file" | "directory" = "file"
) => ({
  name,
  type,
  size: 1,
  // Some platforms omit the modification time; the helper then reads the
  // timestamp prefix of the file name instead.
  mtime: mtime as number,
  uri: `file:///cache/share-temp/${name}`,
});

const deletedPaths = () =>
  jest.mocked(Filesystem.deleteFile).mock.calls.map(([options]) => options);

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(Date, "now").mockReturnValue(NOW);
  jest.mocked(Filesystem.writeFile).mockResolvedValue({ uri: "file://x" });
  jest.mocked(Filesystem.downloadFile).mockResolvedValue({ path: "x" });
  jest.mocked(Filesystem.getUri).mockResolvedValue({ uri: "file://shared" });
  jest.mocked(Filesystem.deleteFile).mockResolvedValue();
  jest.mocked(Filesystem.mkdir).mockResolvedValue();
  jest.mocked(Filesystem.readdir).mockResolvedValue({ files: [] });
  jest.mocked(Share.share).mockResolvedValue({});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("shareFetchedBlobInNativeApp", () => {
  const blob = new Blob(["decrypted bytes"], { type: "text/plain" });
  const expectedPath = `share-temp/${NOW}-my_file.txt`;

  it("shares from the dedicated cache folder and removes the file afterwards", async () => {
    await shareFetchedBlobInNativeApp(blob, "my file.txt");

    expect(Filesystem.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({ directory: "CACHE", path: expectedPath })
    );
    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({ url: "file://shared", title: "my file.txt" })
    );
    expect(deletedPaths()).toEqual([
      { directory: "CACHE", path: expectedPath },
    ]);
    // Removal happens only once the share sheet has finished.
    expect(
      jest.mocked(Filesystem.deleteFile).mock.invocationCallOrder[0]
    ).toBeGreaterThan(jest.mocked(Share.share).mock.invocationCallOrder[0]!);
  });

  it("removes the file when sharing is cancelled", async () => {
    jest.mocked(Share.share).mockRejectedValue(new Error("Share canceled"));

    await expect(
      shareFetchedBlobInNativeApp(blob, "my file.txt")
    ).rejects.toThrow("Share canceled");
    expect(deletedPaths()).toEqual([
      { directory: "CACHE", path: expectedPath },
    ]);
  });

  it("removes stale files in its folder and leaves recent ones alone", async () => {
    jest.mocked(Filesystem.readdir).mockResolvedValue({
      files: [
        entry("old-by-mtime.bin", NOW - 30 * MINUTE),
        entry("recent.bin", NOW - MINUTE),
        entry(`${NOW - 60 * MINUTE}-old-by-name.bin`, undefined),
        entry("no-age.bin", undefined),
        entry("nested", NOW - 60 * MINUTE, "directory"),
      ],
    });

    await shareFetchedBlobInNativeApp(blob, "my file.txt");

    expect(Filesystem.readdir).toHaveBeenCalledTimes(1);
    expect(Filesystem.readdir).toHaveBeenCalledWith({
      directory: "CACHE",
      path: "share-temp",
    });
    expect(deletedPaths()).toEqual(
      expect.arrayContaining([
        { directory: "CACHE", path: "share-temp/old-by-mtime.bin" },
        {
          directory: "CACHE",
          path: `share-temp/${NOW - 60 * MINUTE}-old-by-name.bin`,
        },
        { directory: "CACHE", path: expectedPath },
      ])
    );
    expect(deletedPaths()).toHaveLength(3);
    for (const { path } of deletedPaths()) {
      expect(path.startsWith("share-temp/")).toBe(true);
    }
  });

  it("still shares when the folder cannot be prepared or listed", async () => {
    jest.mocked(Filesystem.mkdir).mockRejectedValue(new Error("exists"));
    jest.mocked(Filesystem.readdir).mockRejectedValue(new Error("unsupported"));

    await shareFetchedBlobInNativeApp(blob, "my file.txt");

    expect(Share.share).toHaveBeenCalledTimes(1);
    expect(Filesystem.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({ recursive: true })
    );
  });
});

describe("shareTextFileInNativeApp", () => {
  const share = { title: "Title", text: "Text", dialogTitle: "Dialog" };

  it("writes UTF-8 text to the cache folder and removes it after sharing", async () => {
    await shareTextFileInNativeApp("content", "Wallet-0x1-export.txt", share);

    expect(Filesystem.writeFile).toHaveBeenCalledWith({
      path: "share-temp/Wallet-0x1-export.txt",
      data: "content",
      directory: "CACHE",
      encoding: "utf8",
      recursive: true,
    });
    expect(Share.share).toHaveBeenCalledWith({ ...share, url: "file://x" });
    expect(deletedPaths()).toEqual([
      { directory: "CACHE", path: "share-temp/Wallet-0x1-export.txt" },
    ]);
  });

  it("removes the file when sharing fails", async () => {
    jest.mocked(Share.share).mockRejectedValue(new Error("Error sharing item"));

    await expect(
      shareTextFileInNativeApp("content", "a/b.txt", share)
    ).rejects.toThrow("Error sharing item");
    expect(deletedPaths()).toEqual([
      { directory: "CACHE", path: "share-temp/a_b.txt" },
    ]);
  });
});

describe("downloadAndShareInNativeApp", () => {
  it("downloads into the dedicated cache folder", async () => {
    await downloadAndShareInNativeApp(
      "https://example.com/a.jpg",
      "a.jpg",
      "Save"
    );

    expect(Filesystem.downloadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        directory: "CACHE",
        path: `share-temp/${NOW}-a.jpg`,
        recursive: true,
      })
    );
    expect(deletedPaths()).toEqual([
      { directory: "CACHE", path: `share-temp/${NOW}-a.jpg` },
    ]);
  });
});
