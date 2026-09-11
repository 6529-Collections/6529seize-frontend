import { Capacitor } from "@capacitor/core";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ArtworkShareExport from "@/components/artwork-share/ArtworkShareExport";
import type { ArtworkShareDetails } from "@/components/artwork-share/artworkShare";
import { useArtworkExport } from "@/components/artwork-share/useArtworkExport";
import { canUseSystemShare } from "@/components/header/share/header-share/shareUtils";
import { shareFetchedBlobInNativeApp } from "@/helpers/capacitorBlobDownload.helpers";

jest.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: jest.fn() },
}));
jest.mock("capacitor-secure-storage-plugin", () => ({
  SecureStoragePlugin: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
}));
jest.mock("@/components/artwork-share/useArtworkExport", () => ({
  useArtworkExport: jest.fn(),
}));
jest.mock("@/components/header/share/header-share/shareUtils", () => ({
  canUseSystemShare: jest.fn(),
}));
jest.mock("@/helpers/capacitorBlobDownload.helpers", () => ({
  shareFetchedBlobInNativeApp: jest.fn(),
}));

const artwork: ArtworkShareDetails = {
  kind: "nextgen",
  tokenId: 7,
  title: "Pebble #7",
  artist: "6529er",
  collection: "Pebbles",
  imageUrl: "https://images.test/7.png",
};
const file = new File(["artwork"], "6529-nextgen-7-portrait.png", {
  type: "image/png",
});
const webShare = jest.fn();
const retry = jest.fn();
const nativeShare = jest.mocked(shareFetchedBlobInNativeApp);
const originalShare = Object.getOwnPropertyDescriptor(navigator, "share");
const originalCanShare = Object.getOwnPropertyDescriptor(navigator, "canShare");

function renderExport() {
  return render(
    <ArtworkShareExport artwork={artwork} format="portrait" locale="en-US" />
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  jest.mocked(canUseSystemShare).mockReturnValue(true);
  jest.mocked(useArtworkExport).mockReturnValue({
    state: { status: "ready", file, previewUrl: "blob:artwork-preview" },
    retry,
  });
  webShare.mockResolvedValue(undefined);
  nativeShare.mockResolvedValue(undefined);
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: webShare,
  });
  Object.defineProperty(navigator, "canShare", {
    configurable: true,
    value: jest.fn(() => true),
  });
});

afterAll(() => {
  if (originalShare) Object.defineProperty(navigator, "share", originalShare);
  else Reflect.deleteProperty(navigator, "share");
  if (originalCanShare)
    Object.defineProperty(navigator, "canShare", originalCanShare);
  else Reflect.deleteProperty(navigator, "canShare");
});

it("calls browser sharing synchronously with the prepared file and prevents duplicates", async () => {
  let finishSharing!: () => void;
  webShare.mockReturnValue(
    new Promise<void>((resolve) => {
      finishSharing = resolve;
    })
  );
  renderExport();

  const button = screen.getByRole("button", { name: "Share image" });
  fireEvent.click(button);
  // Assert before yielding: delaying this call would lose transient user activation.
  expect(webShare).toHaveBeenCalledWith({ files: [file] });
  expect(button).toBeDisabled();
  fireEvent.click(button);
  expect(webShare).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("link", { name: "Download image" })).toHaveAttribute(
    "download",
    "6529-nextgen-7-portrait.png"
  );

  await act(async () => finishSharing());
  expect(button).toBeEnabled();
  expect(nativeShare).not.toHaveBeenCalled();
});

it("uses the prepared PNG with the native save/share helper", async () => {
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
  renderExport();

  await userEvent.click(
    screen.getByRole("button", { name: "Save or share image" })
  );

  expect(nativeShare).toHaveBeenCalledWith(
    file,
    "6529-nextgen-7-portrait.png",
    {
      dialogTitle: "Save or share image",
    }
  );
  expect(webShare).not.toHaveBeenCalled();
  expect(
    screen.queryByRole("link", { name: "Download image" })
  ).not.toBeInTheDocument();
});

it("keeps a download available when the browser cannot share files", () => {
  jest.mocked(canUseSystemShare).mockReturnValue(false);
  renderExport();

  expect(screen.getByRole("link", { name: "Download image" })).toHaveAttribute(
    "href",
    "blob:artwork-preview"
  );
  expect(
    screen.queryByRole("button", { name: "Share image" })
  ).not.toBeInTheDocument();
});

it("offers retry without sharing controls when export preparation fails", async () => {
  jest
    .mocked(useArtworkExport)
    .mockReturnValue({ state: { status: "error" }, retry });
  renderExport();

  expect(screen.getByRole("alert")).toHaveTextContent(
    "The image could not be prepared."
  );
  expect(
    screen.queryByRole("button", { name: "Share image" })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Download image" })
  ).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(retry).toHaveBeenCalledTimes(1);
});

it.each([false, true])(
  "does not report user cancellation as an error (native: %s)",
  async (native) => {
    jest.mocked(Capacitor.isNativePlatform).mockReturnValue(native);
    const share = native ? nativeShare : webShare;
    share.mockRejectedValue(
      native
        ? new Error("Share canceled")
        : new DOMException("Canceled", "AbortError")
    );
    renderExport();
    const button = screen.getByRole("button", {
      name: native ? "Save or share image" : "Share image",
    });

    await userEvent.click(button);

    await waitFor(() => expect(button).toBeEnabled());
    expect(share).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  }
);

it.each([false, true])(
  "reports real share failures and allows retry (native: %s)",
  async (native) => {
    jest.mocked(Capacitor.isNativePlatform).mockReturnValue(native);
    const share = native ? nativeShare : webShare;
    share.mockRejectedValueOnce(new Error("Share unavailable"));
    renderExport();
    const button = screen.getByRole("button", {
      name: native ? "Save or share image" : "Share image",
    });

    await userEvent.click(button);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      native
        ? "The image could not be shared."
        : "Image sharing is unavailable."
    );
    await userEvent.click(button);

    expect(share).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  }
);
