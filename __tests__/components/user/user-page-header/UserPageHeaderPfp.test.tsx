import { fireEvent, render, screen } from "@testing-library/react";
import { ImageConfigContext } from "next/dist/shared/lib/image-config-context.shared-runtime";
import { imageConfigDefault } from "next/dist/shared/lib/image-config";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { publicEnv } from "@/config/env";
import UserPageHeaderPfp from "@/components/user/user-page-header/pfp/UserPageHeaderPfp";

const cid = "QmZ41GvrNSPUpSs4mfQy4jxUNudcLM6CXUTFwqtVd2m2XP";
const source = `https://media.6529.io/ipfs/${cid}`;

function picture(pfp: string | null) {
  return (
    <ImageConfigContext.Provider
      value={{
        ...imageConfigDefault,
        remotePatterns: [
          { protocol: "https", hostname: "media.6529.io", port: "" },
        ],
      }}
    >
      <UserPageHeaderPfp
        profile={{ pfp } as ApiIdentity}
        profileLabel="Alice"
        defaultBanner1="#000"
        defaultBanner2="#fff"
      />
    </ImageConfigContext.Provider>
  );
}

describe("UserPageHeaderPfp", () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([`ipfs://${cid}`, source])(
    "optimizes supported profile pictures with responsive display sizes: %s",
    (pfp) => {
      render(picture(pfp));
      const image = screen.getByRole("img", {
        name: "Alice's profile picture",
      });
      const url = new URL(image.getAttribute("src")!, "http://localhost");
      expect(url.pathname).toBe("/_next/image");
      expect(url.searchParams.get("url")).toBe(source);
      expect(image).toHaveAttribute("sizes", "(min-width: 640px) 112px, 80px");
      expect(image).toHaveAttribute("width", "144");
      expect(image).toHaveAttribute("height", "144");
    }
  );

  it.each(["https://example.com/avatar.png", `${source}/animated.gif`])(
    "keeps direct delivery for external hosts and GIFs: %s",
    (pfp) => {
      render(picture(pfp));
      expect(screen.getByRole("img")).toHaveAttribute("src", pfp);
      expect(screen.getByRole("img")).not.toHaveAttribute("srcset");
    }
  );

  it("falls back to the original after optimizer failure and optimizes a new source", () => {
    const { rerender } = render(picture(source));
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("img")).toHaveAttribute("src", source);
    expect(screen.getByRole("img")).not.toHaveAttribute("srcset");
    const updatedSource = `${source}/updated.png`;
    rerender(picture(updatedSource));
    const url = new URL(
      screen.getByRole("img").getAttribute("src")!,
      "http://localhost"
    );
    expect(url.pathname).toBe("/_next/image");
    expect(url.searchParams.get("url")).toBe(updatedSource);
  });

  it("keeps direct delivery for a resolver port outside the optimizer allowlist", () => {
    jest.replaceProperty(
      publicEnv,
      "MEDIA_RESOLVER_ENDPOINT",
      "https://media.6529.io:8443"
    );

    render(picture(source));

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      `https://media.6529.io:8443/ipfs/${cid}`
    );
    expect(screen.getByRole("img")).not.toHaveAttribute("srcset");
  });

  it("renders placeholder when no pfp", () => {
    const { container } = render(picture(null));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toHaveClass(
      "tw-h-20",
      "tw-w-20",
      "sm:tw-h-28",
      "sm:tw-w-28"
    );
  });
});
