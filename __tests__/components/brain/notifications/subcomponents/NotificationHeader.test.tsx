import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import NotificationHeader from "@/components/brain/notifications/subcomponents/NotificationHeader";

type MockNextImageProps = ComponentProps<"img"> & {
  readonly fill?: boolean | undefined;
  readonly unoptimized?: boolean | undefined;
};

type MockNextLinkProps = ComponentProps<"a"> & {
  readonly prefetch?: boolean | undefined;
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
  default: ({ href, children, prefetch, ...props }: MockNextLinkProps) => (
    <a href={href} data-prefetch={String(prefetch)} {...props}>
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
  it("renders an unlinked fallback for historical notifications without a profile target", () => {
    render(
      <NotificationHeader
        author={
          { id: "missing" } as ComponentProps<
            typeof NotificationHeader
          >["author"]
        }
      >
        <span>posted</span>
      </NotificationHeader>
    );
    expect(screen.getByText("Unknown profile")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
  it("keeps anonymous notification authors unlinked and hides profile actions", () => {
    const author = {
      id: "anonymous-entry-author",
      handle: "Anonymous",
      pfp: "ipfs://gelato",
      is_anonymous: true,
    } as ComponentProps<typeof NotificationHeader>["author"];
    render(
      <NotificationHeader author={author} actions={<button>Follow</button>}>
        <span>posted</span>
      </NotificationHeader>
    );
    expect(screen.getByText("Anonymous")).toBeInTheDocument();
    expect(screen.getByText("posted")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Follow" })
    ).not.toBeInTheDocument();
  });
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
    expect(screen.getByRole("link", { name: "GelatoGenesis" })).toHaveAttribute(
      "data-prefetch",
      "false"
    );
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
