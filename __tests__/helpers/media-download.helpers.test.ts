import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { render } from "@testing-library/react";
import { createElement } from "react";
import { createPortal } from "react-dom";
import {
  downloadMediaUrl,
  getDownloadFilenameFromUrl,
  triggerDirectDownload,
} from "@/helpers/media-download.helpers";

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

it("names native downloads from the served format, not the remote name", async () => {
  await downloadMediaUrl({
    ...options,
    url: "https://example.com/art/animation.html",
    fileName: "animation.html",
  });
  const htmlPath = jest.mocked(Filesystem.downloadFile).mock.calls[0]?.[0].path;
  expect(htmlPath).toMatch(/-animation\.bin$/);

  await downloadMediaUrl({
    ...options,
    url: "https://example.com/videos/clip",
    fileName: "clip",
    mimeType: "video/mp4",
  });
  const videoPath = jest.mocked(Filesystem.downloadFile).mock.calls[1]?.[0]
    .path;
  expect(videoPath).toMatch(/-clip\.mp4$/);
});

describe("browser downloads", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  let savedBlobs: Blob[];
  let savedNames: string[];

  beforeEach(() => {
    savedBlobs = [];
    savedNames = [];
    URL.createObjectURL = jest.fn((blob: Blob) => {
      savedBlobs.push(blob);
      return "blob:http://localhost/saved";
    });
    URL.revokeObjectURL = jest.fn();
    jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        savedNames.push(this.download);
      });
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    jest.restoreAllMocks();
  });

  const serve = (body: BlobPart, type: string) =>
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      blob: async () => new Blob([body], { type }),
    } as Response);

  it("saves served HTML as an opaque file", async () => {
    serve("<html><script>alert(1)</script></html>", "text/html");
    await downloadMediaUrl({
      url: "https://example.com/page.html",
      fileName: "page.html",
      isCapacitor: false,
    });
    expect(savedNames).toEqual(["page.bin"]);
    expect(savedBlobs[0]?.type).toBe("application/octet-stream");
  });

  it("keeps an image's name and type", async () => {
    serve(
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      "image/png"
    );
    await downloadMediaUrl({
      url: "https://example.com/photo.png",
      fileName: "photo.png",
      isCapacitor: false,
    });
    expect(savedNames).toEqual(["photo.png"]);
    expect(savedBlobs[0]?.type).toBe("image/png");
  });
});

it("keeps the original filename for a local decrypted object URL", () => {
  expect(
    getDownloadFilenameFromUrl("blob:https://6529.io/generated-id", "photo.png")
  ).toBe("photo.png");
});

describe("triggerDirectDownload", () => {
  /** Like a modal's focus trap: clicks outside the dialog are cancelled. */
  const trapClicksOutside = (dialog: HTMLElement) => {
    const trap = (event: MouseEvent) => {
      if (!dialog.contains(event.target as Node)) event.preventDefault();
    };
    document.addEventListener("click", trap, true);
    return () => document.removeEventListener("click", trap, true);
  };

  /**
   * Records each download click right after the trap has seen it: a capture
   * listener on `document` registered after the trap's. The link's own click
   * no longer bubbles, so a bubbling listener would never see it.
   */
  const recordDownloadClicks = () => {
    const clicks: { parent: Element | null; cancelled: boolean }[] = [];
    const listener = (event: MouseEvent) => {
      const anchor = event.target as HTMLAnchorElement;
      if (anchor.download) {
        clicks.push({
          parent: anchor.parentElement,
          cancelled: event.defaultPrevented,
        });
      }
    };
    document.addEventListener("click", listener, true);
    return {
      clicks,
      stop: () => document.removeEventListener("click", listener, true),
    };
  };

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("clicks the link inside the focused dialog, where its focus trap allows it", async () => {
    const dialog = document.createElement("dialog");
    dialog.setAttribute("open", "");
    const downloadButton = document.createElement("button");
    dialog.append(downloadButton);
    // A dialog opened later doesn't take the link from the focused one.
    const laterDialog = document.createElement("dialog");
    laterDialog.setAttribute("open", "");
    document.body.append(dialog, laterDialog);
    downloadButton.focus();
    const untrap = trapClicksOutside(dialog);
    const recorder = recordDownloadClicks();
    try {
      triggerDirectDownload("blob:http://localhost/image", "pixel.png");
      await Promise.resolve();
    } finally {
      untrap();
      recorder.stop();
    }
    expect(recorder.clicks).toEqual([{ parent: dialog, cancelled: false }]);
    expect(dialog.querySelector("a")).toBeNull();
  });

  it("uses the last open dialog without focus and keeps the link's click from reaching what rendered it", async () => {
    const onClick = jest.fn();
    const { unmount } = render(
      createElement(
        "div",
        { onClick },
        createPortal(createElement("dialog", { open: true }), document.body)
      )
    );
    const recorder = recordDownloadClicks();
    try {
      triggerDirectDownload("blob:http://localhost/image", "pixel.png");
      await Promise.resolve();
    } finally {
      recorder.stop();
    }
    expect(recorder.clicks).toEqual([
      { parent: document.querySelector("dialog"), cancelled: false },
    ]);
    expect(onClick).not.toHaveBeenCalled();
    unmount();
  });

  it("uses the page when no dialog is open", async () => {
    const recorder = recordDownloadClicks();
    try {
      triggerDirectDownload("blob:http://localhost/image", "pixel.png");
      await Promise.resolve();
    } finally {
      recorder.stop();
    }
    expect(recorder.clicks).toEqual([
      { parent: document.body, cancelled: false },
    ]);
  });
});
