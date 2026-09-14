import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NextGenTokenArt from "@/components/nextGen/collections/nextgenToken/NextGenTokenArt";
import type { NextGenCollection, NextGenToken } from "@/entities/INextgen";
import { shareFetchedBlobInNativeApp } from "@/helpers/capacitorBlobDownload.helpers";

jest.mock("@/components/artwork-share/ArtworkShareButton", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => true },
}));

jest.mock("capacitor-secure-storage-plugin", () => ({
  SecureStoragePlugin: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.mock("react-use-downloader", () => ({
  __esModule: true,
  default: () => ({ download: jest.fn(), isInProgress: false, error: null }),
}));

jest.mock("@/helpers/capacitorBlobDownload.helpers", () => ({
  shareFetchedBlobInNativeApp: jest.fn(),
}));

jest.mock("@/hooks/isMobileDevice", () => ({
  __esModule: true,
  default: () => true,
}));

jest.mock("react-tooltip", () => ({ Tooltip: () => null }));

jest.mock(
  "@/components/nextGen/collections/nextgenToken/NextGenTokenImage",
  () => ({ NextGenTokenImage: () => null })
);

jest.mock(
  "@/components/nextGen/collections/nextgenToken/NextGenZoomableImage",
  () => ({ __esModule: true, default: () => null })
);

const token = {
  id: 7,
  name: "Pebble #7",
  image_url: "https://img.test/png/7.png",
  collection_id: 1,
} as NextGenToken;
const collection = { name: "Pebbles" } as NextGenCollection;

const imageResponse = (blob: Blob): Response =>
  ({ ok: true, blob: async () => blob }) as Response;

async function selectDownload() {
  await userEvent.click(
    screen.getByRole("button", { name: "Download token image" })
  );
  const menu = screen.getByRole("list", {
    name: "Download token image options",
  });
  const option = await within(menu).findByRole("button", { name: /^2K/ });
  await waitFor(() => expect(option).toBeEnabled());
  await userEvent.click(option);
}

describe("NextGen native image downloads", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => jest.clearAllMocks());

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("keeps a native download alive after its menu closes", async () => {
    let downloadSignal: AbortSignal | null | undefined;
    let completeDownload!: (response: Response) => void;
    const pendingDownload = new Promise<Response>((resolve) => {
      completeDownload = resolve;
    });
    globalThis.fetch = jest.fn((_input, init?: RequestInit) => {
      if (init?.method === "HEAD") {
        return Promise.resolve({
          ok: true,
          headers: new Headers(),
        } as Response);
      }
      downloadSignal = init?.signal;
      return pendingDownload;
    });
    render(<NextGenTokenArt token={token} collection={collection} />);

    await selectDownload();

    expect(
      screen.queryByRole("list", { name: "Download token image options" })
    ).not.toBeInTheDocument();
    expect(downloadSignal?.aborted).toBe(false);
    expect(
      screen.getByRole("button", { name: "Download token image" })
    ).toBeDisabled();
    expect(shareFetchedBlobInNativeApp).not.toHaveBeenCalled();

    const blob = new Blob(["artwork"], { type: "image/png" });
    await act(async () => completeDownload(imageResponse(blob)));

    await waitFor(() =>
      expect(shareFetchedBlobInNativeApp).toHaveBeenCalledWith(blob, "7_2K.png")
    );
    expect(
      screen.getByRole("button", { name: "Download token image" })
    ).toBeEnabled();
    expect(downloadSignal?.aborted).toBe(false);
  });

  it("shows a failed download after the menu closes and permits another attempt", async () => {
    const download = jest
      .fn()
      .mockRejectedValueOnce(new Error("Image download failed."))
      .mockResolvedValue(imageResponse(new Blob(["artwork"])));
    globalThis.fetch = jest.fn((_input, init?: RequestInit) =>
      init?.method === "HEAD"
        ? Promise.resolve({ ok: true, headers: new Headers() } as Response)
        : download()
    );
    render(<NextGenTokenArt token={token} collection={collection} />);

    await selectDownload();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The image could not be downloaded. Please try again."
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent(
      "Image download failed."
    );
    expect(shareFetchedBlobInNativeApp).not.toHaveBeenCalled();

    await selectDownload();
    await waitFor(() =>
      expect(shareFetchedBlobInNativeApp).toHaveBeenCalledTimes(1)
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not show an error when the native share sheet is canceled", async () => {
    jest
      .mocked(shareFetchedBlobInNativeApp)
      .mockRejectedValueOnce(new Error("Share canceled"));
    globalThis.fetch = jest.fn((_input, init?: RequestInit) =>
      Promise.resolve(
        init?.method === "HEAD"
          ? ({ ok: true, headers: new Headers() } as Response)
          : imageResponse(new Blob(["artwork"]))
      )
    );
    render(<NextGenTokenArt token={token} collection={collection} />);

    await selectDownload();

    expect(shareFetchedBlobInNativeApp).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Download token image" })
      ).toBeEnabled()
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
