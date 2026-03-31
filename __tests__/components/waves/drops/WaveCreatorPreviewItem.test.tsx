import { render, screen } from "@testing-library/react";
import { WaveCreatorPreviewItem } from "@/components/waves/drops/WaveCreatorPreviewItem";

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
  default: ({ alt, ...props }: any) => <img alt={alt ?? ""} {...props} />,
}));

describe("WaveCreatorPreviewItem", () => {
  it("shows the wave icon fallback when picture is missing", () => {
    const { container } = render(
      <WaveCreatorPreviewItem
        wave={
          {
            id: "wave-1",
            name: "TDH Name Vote",
            picture: null,
            contributors_overview: [],
            chat: { scope: { group: { is_direct_message: false } } },
            metrics: {
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
