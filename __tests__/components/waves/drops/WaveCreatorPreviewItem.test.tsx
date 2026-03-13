import { render, screen } from "@testing-library/react";
import { WaveCreatorPreviewItem } from "@/components/waves/drops/WaveCreatorPreviewItem";

const mockedWavePicture = jest.fn(() => <div data-testid="wave-picture" />);

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, prefetch, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/components/waves/WavePicture", () => ({
  __esModule: true,
  default: (props: any) => mockedWavePicture(props),
}));

describe("WaveCreatorPreviewItem", () => {
  beforeEach(() => {
    mockedWavePicture.mockClear();
  });

  it("uses WavePicture with contributor overview when picture is missing", () => {
    render(
      <WaveCreatorPreviewItem
        wave={
          {
            id: "wave-1",
            name: "TDH Name Vote",
            picture: null,
            contributors_overview: [
              {
                contributor_identity: "alice",
                contributor_pfp: "alice.png",
              },
              {
                contributor_identity: "bob",
                contributor_pfp: "bob.png",
              },
            ],
            chat: { scope: { group: { is_direct_message: false } } },
            metrics: {
              latest_drop_timestamp: Date.now(),
            },
          } as any
        }
      />
    );

    expect(screen.getByTestId("wave-picture")).toBeInTheDocument();
    expect(mockedWavePicture).toHaveBeenCalledWith({
      name: "TDH Name Vote",
      picture: null,
      contributors: [
        { pfp: "alice.png", identity: "alice" },
        { pfp: "bob.png", identity: "bob" },
      ],
    });
  });
});
