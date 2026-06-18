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
      screen.queryByRole("img", { name: "View @gpebbles" })
    ).not.toBeInTheDocument();
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
