import { render, screen } from "@testing-library/react";
import GifAnimatedPreviewNotice from "@/components/waves/memes/file-upload/components/GifAnimatedPreviewNotice";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

const u16 = (value: number) => [value & 0xff, (value >> 8) & 0xff];

const gifFile = (width: number, height: number, frames: number): File => {
  const bytes: number[] = [
    ...Array.from("GIF89a", (char) => char.charCodeAt(0)),
    ...u16(width),
    ...u16(height),
    0,
    0,
    0,
  ];
  for (let frame = 0; frame < frames; frame += 1) {
    bytes.push(0x2c, ...u16(0), ...u16(0), ...u16(width), ...u16(height), 0);
    bytes.push(2, 2, 0x4c, 0x01, 0);
  }
  bytes.push(0x3b);
  const data = Uint8Array.from(bytes);
  const file = new File([data], "art.gif", { type: "image/gif" });
  if (typeof file.arrayBuffer !== "function") {
    Object.defineProperty(file, "arrayBuffer", {
      value: async () => data.slice().buffer,
    });
  }
  return file;
};

describe("GifAnimatedPreviewNotice", () => {
  it("shows the size guide before a file is selected", () => {
    render(<GifAnimatedPreviewNotice file={null} />);

    expect(
      screen.getByText(
        "GIFs get an animated preview in Waves and the leaderboard when each frame has at most 8,388,608 pixels (for example 2,048 × 4,096), at most 120 frames, and at most 268,435,456 pixels across all frames."
      )
    ).toBeInTheDocument();
  });

  it("warns when a selected GIF has frames that are too large", async () => {
    render(<GifAnimatedPreviewNotice file={gifFile(3000, 4500, 2)} />);

    const warning = await screen.findByRole("status");
    expect(warning).toHaveTextContent(
      "This GIF is 3,000 × 4,500 (13,500,000 pixels per frame). Animated previews need at most 8,388,608 pixels per frame"
    );
    expect(warning).toHaveTextContent("You can still submit it");
  });

  it("warns when a selected GIF has too many frames", async () => {
    render(<GifAnimatedPreviewNotice file={gifFile(100, 100, 121)} />);

    expect(await screen.findByRole("status")).toHaveTextContent(
      "This GIF has 121 frames. Animated previews need at most 120 frames"
    );
  });

  it("keeps the guide for a GIF inside the limits", async () => {
    const file = gifFile(2048, 4096, 3);
    const { rerender } = render(<GifAnimatedPreviewNotice file={file} />);
    rerender(<GifAnimatedPreviewNotice file={file} />);

    expect(
      await screen.findByText(/GIFs get an animated preview/)
    ).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("drops the warning as soon as the file is cleared", async () => {
    const { rerender } = render(
      <GifAnimatedPreviewNotice file={gifFile(3000, 4500, 2)} />
    );
    expect(await screen.findByRole("status")).toBeInTheDocument();

    rerender(<GifAnimatedPreviewNotice file={null} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText(/GIFs get an animated preview/)).toBeVisible();
  });
});
