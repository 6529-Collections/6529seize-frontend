import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ArtBlocksTokenCard from "@/components/waves/ArtBlocksTokenCard";
import {
  fetchArtBlocksMeta,
  type ArtBlocksMeta,
} from "@/services/api/artblocks";

jest.mock("@/services/api/artblocks", () => {
  const actual = jest.requireActual("@/services/api/artblocks");
  return {
    ...actual,
    fetchArtBlocksMeta: jest.fn(),
  };
});

describe("ArtBlocksTokenCard", () => {
  const mockFetchMeta = fetchArtBlocksMeta as jest.MockedFunction<
    typeof fetchArtBlocksMeta
  >;

  beforeEach(() => {
    mockFetchMeta.mockReset();
    (
      window as unknown as {
        awsRum?: { recordEvent?: jest.Mock | undefined } | undefined;
      }
    ).awsRum = {
      recordEvent: jest.fn(),
    };
  });

  it("records a privacy-safe impression again when the token changes", async () => {
    mockFetchMeta.mockResolvedValue(null);
    const { rerender } = render(
      <ArtBlocksTokenCard
        href="https://www.artblocks.io/token/private-1"
        id={{ tokenId: "private-1" }}
      />
    );

    rerender(
      <ArtBlocksTokenCard
        href="https://www.artblocks.io/token/private-2"
        id={{ tokenId: "private-2" }}
      />
    );

    const recordEvent = (
      window as {
        awsRum?: { recordEvent?: jest.Mock | undefined } | undefined;
      }
    ).awsRum?.recordEvent as jest.Mock;
    await waitFor(() => {
      const impressionCalls = recordEvent.mock.calls.filter(
        ([eventName]) => eventName === "ab_card_impression"
      );
      expect(impressionCalls).toEqual([
        ["ab_card_impression", { surface: "wave_artblocks_card" }],
        ["ab_card_impression", { surface: "wave_artblocks_card" }],
      ]);
    });
    expect(JSON.stringify(recordEvent.mock.calls)).not.toContain("private-1");
    expect(JSON.stringify(recordEvent.mock.calls)).not.toContain("private-2");
  });

  it("renders image immediately and enriches with metadata", async () => {
    let resolveMeta: (meta: ArtBlocksMeta | null) => void = () => {};
    mockFetchMeta.mockReturnValue(
      new Promise<ArtBlocksMeta | null>((resolve) => {
        resolveMeta = resolve;
      })
    );

    render(
      <ArtBlocksTokenCard
        href="https://www.artblocks.io/token/123"
        id={{ tokenId: "123" }}
      />
    );

    const image = screen.getByRole("img", {
      name: "Art Blocks #123 by Unknown",
    });
    expect(image).toHaveAttribute("src", "https://media.artblocks.io/123.png");

    resolveMeta({
      projectName: "Chromie Squiggle",
      artistName: "Snowfro",
      tokenNumber: "123",
      features: { Type: "Normal" },
      series: "Curated",
    });

    await waitFor(() =>
      expect(screen.getByText("Chromie Squiggle #123")).toBeInTheDocument()
    );

    expect(screen.getByText("by Snowfro")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Normal")).toBeInTheDocument();
  });

  it("shows a placeholder when the image fails to load", async () => {
    mockFetchMeta.mockResolvedValue(null);

    render(
      <ArtBlocksTokenCard
        href="https://www.artblocks.io/token/321"
        id={{ tokenId: "321" }}
      />
    );

    const image = screen.getByRole("img", {
      name: "Art Blocks #321 by Unknown",
    }) as HTMLImageElement;

    fireEvent.error(image);
    expect(await screen.findByText("Preview unavailable")).toBeInTheDocument();
  });

  it("opens and closes the live modal with proper attributes", async () => {
    mockFetchMeta.mockResolvedValue({
      projectName: "Test Project",
      artistName: "Artist",
      tokenNumber: "7",
      series: "Curated",
      aspectRatio: 1.6,
    });

    const user = userEvent.setup();

    render(
      <ArtBlocksTokenCard
        href="https://www.artblocks.io/token/7"
        id={{ tokenId: "7" }}
      />
    );

    await waitFor(() =>
      expect(screen.getByText("Test Project #7")).toBeInTheDocument()
    );

    const liveButtons = screen.getAllByRole("button", {
      name: "View live render on Art Blocks",
    });
    const openButton = liveButtons[liveButtons.length - 1];
    await user.click(openButton);

    const iframe = await screen.findByTitle("Test Project live render");
    expect(iframe).toHaveAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-pointer-lock"
    );
    expect(iframe).toHaveAttribute(
      "src",
      "https://live.artblocks.io/token/flagship-7"
    );
    expect(iframe).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(iframe).toHaveAttribute("allow", "autoplay; encrypted-media");

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(openButton).toHaveFocus();

    const recordEvent = (
      window as {
        awsRum?: { recordEvent?: jest.Mock | undefined } | undefined;
      }
    ).awsRum?.recordEvent as jest.Mock;
    expect(recordEvent).toHaveBeenCalledWith(
      "ab_card_link_out",
      expect.objectContaining({ target: "viewer" })
    );
    expect(recordEvent).toHaveBeenCalledWith(
      "ab_card_live_open",
      expect.objectContaining({ dwell_bucket: expect.any(String) })
    );
    expect(JSON.stringify(recordEvent.mock.calls)).not.toContain("flagship-7");
    expect(JSON.stringify(recordEvent.mock.calls)).not.toContain(
      "https://www.artblocks.io"
    );
  });

  it("exposes accessible link actions", async () => {
    mockFetchMeta.mockResolvedValue(null);

    render(
      <ArtBlocksTokenCard
        href="https://www.artblocks.io/token/11"
        id={{ tokenId: "11" }}
      />
    );

    const buttons = screen.getAllByRole("button", {
      name: "View live render on Art Blocks",
    });
    expect(buttons.length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "Open this token on Art Blocks" })
    ).toHaveAttribute("href", "https://www.artblocks.io/token/11");
  });
});
