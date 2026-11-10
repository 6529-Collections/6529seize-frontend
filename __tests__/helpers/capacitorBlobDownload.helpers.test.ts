import { Capacitor } from "@capacitor/core";
import { Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

import {
  downloadAndShareInNativeApp,
  removeStaleSharedFiles,
  shareFetchedBlobInNativeApp,
  shareTextFileInNativeApp,
} from "@/helpers/capacitorBlobDownload.helpers";

jest.mock("@capacitor/core", () => ({
  Capacitor: { getPlatform: jest.fn() },
}));
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

const MINUTE = 60_000;
const ANDROID_RETENTION_MS = 2 * MINUTE;
// Each test runs at a later clock so path timestamps never repeat across tests.
let now = 1_800_000_000_000;

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
  now += 60 * MINUTE;
  jest.spyOn(Date, "now").mockImplementation(() => now);
  jest.mocked(Capacitor.getPlatform).mockReturnValue("ios");
  jest.mocked(Filesystem.writeFile).mockResolvedValue({ uri: "file://x" });
  jest.mocked(Filesystem.downloadFile).mockResolvedValue({ path: "x" });
  jest.mocked(Filesystem.getUri).mockResolvedValue({ uri: "file://shared" });
  jest.mocked(Filesystem.deleteFile).mockResolvedValue();
  jest.mocked(Filesystem.mkdir).mockResolvedValue();
  jest.mocked(Filesystem.readdir).mockResolvedValue({ files: [] });
  jest.mocked(Share.share).mockResolvedValue({});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("shareFetchedBlobInNativeApp", () => {
  const blob = new Blob(["decrypted bytes"], { type: "text/plain" });
  const expectedPath = () => `share-temp/${now}-my_file.txt`;

  it("shares from the dedicated cache folder and removes the file afterwards", async () => {
    await shareFetchedBlobInNativeApp(blob, "my file.txt");

    expect(Filesystem.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({ directory: "CACHE", path: expectedPath() })
    );
    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({ url: "file://shared", title: "my file.txt" })
    );
    expect(deletedPaths()).toEqual([
      { directory: "CACHE", path: expectedPath() },
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
      { directory: "CACHE", path: expectedPath() },
    ]);
  });

  it("keeps the file on Android until the receiving app has had time to read it", async () => {
    jest.mocked(Capacitor.getPlatform).mockReturnValue("android");
    jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] });
    jest.spyOn(Date, "now").mockImplementation(() => now);

    await shareFetchedBlobInNativeApp(blob, "my file.txt");

    expect(Share.share).toHaveBeenCalledTimes(1);
    expect(Filesystem.deleteFile).not.toHaveBeenCalled();
    jest.advanceTimersByTime(ANDROID_RETENTION_MS - 1);
    expect(Filesystem.deleteFile).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(deletedPaths()).toEqual([
      { directory: "CACHE", path: expectedPath() },
    ]);
  });

  it("removes stale files in its folder and leaves recent ones alone", async () => {
    jest.mocked(Filesystem.readdir).mockResolvedValue({
      files: [
        entry("old-by-mtime.bin", now - 30 * MINUTE),
        entry("recent.bin", now - MINUTE),
        entry(`${now - 60 * MINUTE}-old-by-name.bin`, undefined),
        entry("no-age.bin", undefined),
        entry("nested", now - 60 * MINUTE, "directory"),
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
          path: `share-temp/${now - 60 * MINUTE}-old-by-name.bin`,
        },
        { directory: "CACHE", path: expectedPath() },
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

describe("removeStaleSharedFiles", () => {
  it("reads a modification time given in seconds as seconds", async () => {
    const nowSeconds = Math.floor(now / 1000);
    jest.mocked(Filesystem.readdir).mockResolvedValue({
      files: [
        entry("old-seconds.bin", nowSeconds - 30 * 60),
        entry("recent-seconds.bin", nowSeconds - 60),
      ],
    });

    await removeStaleSharedFiles();

    expect(deletedPaths()).toEqual([
      { directory: "CACHE", path: "share-temp/old-seconds.bin" },
    ]);
  });
});

describe("shareTextFileInNativeApp", () => {
  const share = { title: "Title", text: "Text", dialogTitle: "Dialog" };

  it("writes UTF-8 text to the cache folder and removes it after sharing", async () => {
    await shareTextFileInNativeApp("content", "Wallet-0x1-export.txt", share);

    const path = `share-temp/${now}-Wallet-0x1-export.txt`;
    expect(Filesystem.writeFile).toHaveBeenCalledWith({
      path,
      data: "content",
      directory: "CACHE",
      encoding: "utf8",
      recursive: true,
    });
    expect(Share.share).toHaveBeenCalledWith({ ...share, url: "file://x" });
    expect(deletedPaths()).toEqual([{ directory: "CACHE", path }]);
  });

  it("removes the file when sharing fails", async () => {
    jest.mocked(Share.share).mockRejectedValue(new Error("Error sharing item"));

    await expect(
      shareTextFileInNativeApp("content", "a/b.txt", share)
    ).rejects.toThrow("Error sharing item");
    expect(deletedPaths()).toEqual([
      { directory: "CACHE", path: `share-temp/${now}-a_b.txt` },
    ]);
  });

  it("gives two exports of the same name in flight separate files", async () => {
    let finishFirst: () => void = () => undefined;
    jest
      .mocked(Share.share)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishFirst = () => resolve({});
          })
      )
      .mockResolvedValueOnce({});

    const first = shareTextFileInNativeApp("one", "Same.txt", share);
    await waitForCalls(Share.share as jest.Mock, 1);
    await shareTextFileInNativeApp("two", "Same.txt", share);

    const written = jest
      .mocked(Filesystem.writeFile)
      .mock.calls.map(([options]) => options.path);
    expect(written).toHaveLength(2);
    expect(new Set(written).size).toBe(2);
    // Finishing the second export removed only its own file.
    expect(deletedPaths()).toEqual([{ directory: "CACHE", path: written[1] }]);

    finishFirst();
    await first;
    expect(deletedPaths()).toEqual([
      { directory: "CACHE", path: written[1] },
      { directory: "CACHE", path: written[0] },
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
        path: `share-temp/${now}-a.jpg`,
        recursive: true,
      })
    );
    expect(deletedPaths()).toEqual([
      { directory: "CACHE", path: `share-temp/${now}-a.jpg` },
    ]);
  });
});

async function waitForCalls(mock: jest.Mock, count: number): Promise<void> {
  for (
    let attempt = 0;
    attempt < 50 && mock.mock.calls.length < count;
    attempt++
  ) {
    await Promise.resolve();
  }
  expect(mock.mock.calls).toHaveLength(count);
}
