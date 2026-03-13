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
});
