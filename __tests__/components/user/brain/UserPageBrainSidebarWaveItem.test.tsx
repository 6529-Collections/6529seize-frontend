import { render, screen } from "@testing-library/react";
import UserPageBrainSidebarWaveItem from "@/components/user/brain/UserPageBrainSidebarWaveItem";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, prefetch, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, fill, ...props }: any) => <img alt={alt ?? ""} {...props} />,
}));

describe("UserPageBrainSidebarWaveItem", () => {
  it("shows the wave icon fallback when picture is missing", () => {
    const { container } = render(
      <UserPageBrainSidebarWaveItem
        wave={
          {
            id: "wave-1",
            name: "TDH Name Vote",
            picture: null,
            contributors_overview: [],
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

    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("labels created-wave activity as wave-wide", () => {
    render(
      <UserPageBrainSidebarWaveItem
        wave={
          {
            id: "wave-1",
            name: "TDH Name Vote",
            picture: null,
            totalDropsCount: 12,
            isPrivate: false,
            isDirectMessage: false,
            latestDropTimestamp: Date.now() - 2 * 60 * 60 * 1000,
            descriptionDrop: { media: [] },
          } as any
        }
      />
    );

    expect(screen.getByText("Last wave post 2h ago")).toBeInTheDocument();
    expect(screen.getByText("12 drops")).toBeInTheDocument();
  });

  it("attributes recent activity only to the viewed profile", () => {
    render(
      <UserPageBrainSidebarWaveItem
        metadataMode="context"
        profileActivityTimestamp={Date.now() - 2 * 60 * 60 * 1000}
        wave={
          {
            id: "wave-1",
            name: "TDH Name Vote",
            picture: null,
            totalDropsCount: 12,
            isPrivate: false,
            isDirectMessage: false,
            latestDropTimestamp: Date.now(),
            descriptionDrop: { media: [] },
          } as any
        }
      />
    );

    expect(screen.getByText("Last posted 2h ago")).toBeInTheDocument();
  });

  it("does not use wave-wide activity as profile activity", () => {
    render(
      <UserPageBrainSidebarWaveItem
        metadataMode="context"
        profileActivityTimestamp={null}
        wave={
          {
            id: "wave-1",
            name: "TDH Name Vote",
            picture: null,
            totalDropsCount: 12,
            isPrivate: false,
            isDirectMessage: false,
            latestDropTimestamp: Date.now() - 2 * 60 * 60 * 1000,
            descriptionDrop: { media: [] },
          } as any
        }
      />
    );

    expect(screen.queryByText(/Last posted/i)).toBeNull();
  });
});
