import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import NotificationHeader from "@/components/brain/notifications/subcomponents/NotificationHeader";

type MockNextImageProps = ComponentProps<"img"> & {
  readonly fill?: boolean | undefined;
  readonly unoptimized?: boolean | undefined;
};

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    fill: _fill,
    unoptimized,
    alt,
    ...props
  }: MockNextImageProps) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt ?? ""}
      data-unoptimized={unoptimized ? "true" : "false"}
      {...props}
    />
  ),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/components/utils/tooltip/UserProfileTooltipWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/nft-image/utils/gateway-fallback", () => ({
  getMediaGatewayFallbackUrls: (url: string) =>
    url === "ipfs://gelato"
      ? ["https://media.6529.io/ipfs/gelato", "https://ipfs.io/ipfs/gelato"]
      : [url],
}));

describe("NotificationHeader", () => {
  it("prefers the 6529 resolver and falls back to ipfs.io on failure", () => {
    render(
      <NotificationHeader
        author={
          {
            id: "gelato-id",
            handle: "GelatoGenesis",
            pfp: "ipfs://gelato",
          } as any
        }
      >
        <span>posted</span>
      </NotificationHeader>
    );

    const firstAttempt = screen.getByRole("img", {
      name: "GelatoGenesis",
    });
    expect(firstAttempt).toHaveAttribute(
      "src",
      "https://media.6529.io/ipfs/gelato"
    );
    expect(firstAttempt).toHaveAttribute("data-unoptimized", "false");

    fireEvent.error(firstAttempt);

    const secondAttempt = screen.getByRole("img", {
      name: "GelatoGenesis",
    });
    expect(secondAttempt).toHaveAttribute(
      "src",
      "https://media.6529.io/ipfs/gelato"
    );
    expect(secondAttempt).toHaveAttribute("data-unoptimized", "true");

    fireEvent.error(secondAttempt);

    const thirdAttempt = screen.getByRole("img", {
      name: "GelatoGenesis",
    });
    expect(thirdAttempt).toHaveAttribute("src", "https://ipfs.io/ipfs/gelato");
    expect(thirdAttempt).toHaveAttribute("data-unoptimized", "false");
  });
});
