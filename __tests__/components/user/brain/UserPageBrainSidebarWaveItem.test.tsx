import { render, screen } from "@testing-library/react";
import UserPageBrainSidebarWaveItem from "@/components/user/brain/UserPageBrainSidebarWaveItem";

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

describe("UserPageBrainSidebarWaveItem", () => {
  beforeEach(() => {
    mockedWavePicture.mockClear();
  });

  it("passes shared wave avatar data to WavePicture when picture is missing", () => {
    render(
      <UserPageBrainSidebarWaveItem
        wave={
          {
            id: "wave-1",
            name: "TDH Name Vote",
            picture: null,
            author: {
              handle: "creator",
              banner1_color: "#112233",
              banner2_color: "#445566",
            },
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
            visibility: {
              scope: {
                group: null,
              },
            },
            chat: { scope: { group: { is_direct_message: false } } },
            metrics: {
              drops_count: 12,
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
