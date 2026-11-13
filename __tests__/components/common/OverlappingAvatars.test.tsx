import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import OverlappingAvatars from "@/components/common/OverlappingAvatars";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    unoptimized,
    alt,
    ...props
  }: {
    unoptimized?: boolean;
    alt?: string;
    [key: string]: unknown;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt ?? ""}
      data-unoptimized={unoptimized ? "true" : "false"}
      {...props}
    />
  ),
}));

jest.mock("react-tooltip", () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: () => false,
}));

jest.mock("@/components/nft-image/utils/gateway-fallback", () => ({
  getMediaGatewayFallbackUrls: (url: string) =>
    url === "ipfs://gpebbles"
      ? ["https://media.6529.io/ipfs/gpebbles", "https://ipfs.io/ipfs/gpebbles"]
      : [url],
}));

describe("OverlappingAvatars", () => {
  it.each([0, 1, 2, 3, 4, 5, 6])(
    "shows at most five avatars without padding a list of %i reactors",
    (count) => {
      render(
        <OverlappingAvatars
          items={Array.from({ length: count }, (_, index) => ({
            key: `reactor-${index}`,
            pfpUrl: "https://example.com/shared-avatar.png",
            ariaLabel: `Reactor ${index}`,
          }))}
        />
      );

      expect(screen.queryAllByRole("img")).toHaveLength(Math.min(count, 5));
      for (let index = 0; index < Math.min(count, 5); index += 1) {
        expect(
          screen.getAllByRole("img", { name: `Reactor ${index}` })
        ).toHaveLength(1);
      }
    }
  );

  it("portals tooltips outside paint-contained avatar rows", () => {
    const { container } = render(
      <OverlappingAvatars
        items={[
          {
            key: "gpebbles",
            pfpUrl: "https://cdn.warpcast.com/avatars/gpebbles.png",
            ariaLabel: "View @gpebbles",
            fallback: "GP",
            title: "gpebbles",
          },
        ]}
      />
    );

    const tooltip = screen.getByText("gpebbles");
    expect(tooltip.closest("body")).toBe(document.body);
    expect(container.contains(tooltip)).toBe(false);
  });

  it("retries an optimized avatar load with unoptimized mode before showing fallback", () => {
    render(
      <OverlappingAvatars
        items={[
          {
            key: "gpebbles",
            pfpUrl: "https://cdn.warpcast.com/avatars/gpebbles.png",
            ariaLabel: "View @gpebbles",
            fallback: "GP",
          },
        ]}
      />
    );

    const firstAttempt = screen.getByRole("img", { name: "View @gpebbles" });
    expect(firstAttempt).toHaveAttribute("data-unoptimized", "false");

    fireEvent.error(firstAttempt);

    const retryAttempt = screen.getByRole("img", { name: "View @gpebbles" });
    expect(retryAttempt).toHaveAttribute("data-unoptimized", "true");

    fireEvent.error(retryAttempt);

    expect(screen.getByText("GP")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "View @gpebbles" })
    ).not.toHaveAttribute("src");
  });

  it("falls back from the 6529 resolver to ipfs.io", () => {
    render(
      <OverlappingAvatars
        items={[
          {
            key: "gpebbles",
            pfpUrl: "ipfs://gpebbles",
            ariaLabel: "View @gpebbles",
            fallback: "GP",
          },
        ]}
      />
    );

    const firstAttempt = screen.getByRole("img", { name: "View @gpebbles" });
    expect(firstAttempt).toHaveAttribute(
      "src",
      "https://media.6529.io/ipfs/gpebbles"
    );
    expect(firstAttempt).toHaveAttribute("data-unoptimized", "false");

    fireEvent.error(firstAttempt);

    const secondAttempt = screen.getByRole("img", { name: "View @gpebbles" });
    expect(secondAttempt).toHaveAttribute(
      "src",
      "https://media.6529.io/ipfs/gpebbles"
    );
    expect(secondAttempt).toHaveAttribute("data-unoptimized", "true");

    fireEvent.error(secondAttempt);

    const thirdAttempt = screen.getByRole("img", { name: "View @gpebbles" });
    expect(thirdAttempt).toHaveAttribute(
      "src",
      "https://ipfs.io/ipfs/gpebbles"
    );
    expect(thirdAttempt).toHaveAttribute("data-unoptimized", "false");
  });
});
