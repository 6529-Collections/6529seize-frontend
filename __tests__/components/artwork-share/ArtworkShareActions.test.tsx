import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ArtworkShareActions from "@/components/artwork-share/ArtworkShareActions";
import type { ArtworkShareDetails } from "@/components/artwork-share/artworkShare";
import { canUseSystemShare } from "@/components/header/share/header-share/shareUtils";
import { t } from "@/i18n/messages";

jest.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: jest.fn() },
}));
jest.mock("@capacitor/share", () => ({ Share: { share: jest.fn() } }));
jest.mock("capacitor-secure-storage-plugin", () => ({
  SecureStoragePlugin: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
}));
jest.mock("@/components/header/share/header-share/shareUtils", () => ({
  canUseSystemShare: jest.fn(),
  buildSocialShareUrls: () => ({
    x: "https://x.test/share",
    farcaster: "https://farcaster.test/share",
  }),
}));

const artwork: ArtworkShareDetails = {
  kind: "memes",
  tokenId: 7,
  title: "Meme #7",
  artist: "Artist",
  collection: "The Memes",
  imageUrl: "https://images.test/7.png",
};
const url = "https://6529.io/the-memes/7";
const webShare = jest.fn();
const writeText = jest.fn();
const nativeShare = jest.mocked(Share.share);
const originalShare = Object.getOwnPropertyDescriptor(navigator, "share");
const originalClipboard = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard"
);

function renderActions() {
  return render(<ArtworkShareActions artwork={artwork} locale="en-US" />);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  jest.mocked(canUseSystemShare).mockReturnValue(true);
  webShare.mockResolvedValue(undefined);
  nativeShare.mockResolvedValue({});
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: webShare,
  });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
});

afterAll(() => {
  if (originalShare) Object.defineProperty(navigator, "share", originalShare);
  else Reflect.deleteProperty(navigator, "share");
  if (originalClipboard)
    Object.defineProperty(navigator, "clipboard", originalClipboard);
  else Reflect.deleteProperty(navigator, "clipboard");
});

it("starts browser link sharing within the click and prevents duplicate requests", async () => {
  let finishSharing!: () => void;
  webShare.mockReturnValue(
    new Promise<void>((resolve) => {
      finishSharing = resolve;
    })
  );
  renderActions();
  const button = screen.getByRole("button", { name: "More apps" });

  fireEvent.click(button);
  expect(webShare).toHaveBeenCalledWith({ title: artwork.title, url });
  expect(button).toBeDisabled();
  fireEvent.click(button);
  expect(webShare).toHaveBeenCalledTimes(1);
  await act(async () => finishSharing());
  expect(button).toBeEnabled();
});

it("uses native link sharing independently of browser share support", async () => {
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
  jest.mocked(canUseSystemShare).mockReturnValue(false);
  renderActions();

  await userEvent.click(screen.getByRole("button", { name: "More apps" }));

  expect(nativeShare).toHaveBeenCalledWith({ title: artwork.title, url });
  expect(webShare).not.toHaveBeenCalled();
});

it("copies the canonical artwork link from the always visible URL field", async () => {
  renderActions();

  expect(
    screen.getByRole("textbox", {
      name: t("en-US", "artworkShare.artworkLink"),
    })
  ).toHaveValue(url);
  await userEvent.click(screen.getByRole("button", { name: "Copy link" }));
  expect(writeText).toHaveBeenLastCalledWith(url);
});

it("keeps direct destinations and copying when system sharing is unavailable", () => {
  jest.mocked(canUseSystemShare).mockReturnValue(false);
  renderActions();

  expect(
    screen.queryByRole("button", { name: "More apps" })
  ).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Share on X" })).toHaveAttribute(
    "href",
    "https://x.test/share"
  );
  expect(screen.getByRole("link", { name: "Facebook" })).toHaveAttribute(
    "href",
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  );
  expect(screen.getByRole("button", { name: "Copy link" })).toBeEnabled();
});

it.each([false, true])(
  "silently handles share cancellation (native: %s)",
  async (native) => {
    jest.mocked(Capacitor.isNativePlatform).mockReturnValue(native);
    const share = native ? nativeShare : webShare;
    share.mockRejectedValue(
      native
        ? new Error("Share canceled")
        : new DOMException("Canceled", "AbortError")
    );
    renderActions();
    const button = screen.getByRole("button", { name: "More apps" });

    await userEvent.click(button);

    await waitFor(() => expect(button).toBeEnabled());
    expect(share).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  }
);

it.each([false, true])(
  "offers copying after a real share failure (native: %s)",
  async (native) => {
    jest.mocked(Capacitor.isNativePlatform).mockReturnValue(native);
    const share = native ? nativeShare : webShare;
    share.mockRejectedValueOnce(new Error("Sharing unavailable"));
    renderActions();

    await userEvent.click(screen.getByRole("button", { name: "More apps" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Sharing is unavailable. Copy the link or caption instead."
    );
    expect(screen.getByRole("button", { name: "Copy link" })).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "More apps" }));
    expect(share).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  }
);
