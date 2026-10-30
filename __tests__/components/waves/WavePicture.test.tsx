import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { AuthContext } from "@/components/auth/Auth";
import WavePicture from "@/components/waves/WavePicture";
import { ImageScale } from "@/helpers/image.helpers";
import {
  CDN_AVATAR_URL,
  getRequestedImageSrc,
  scaledAvatarPath,
} from "@/__tests__/utils/avatarSrc";

describe("WavePicture", () => {
  it("renders picture image when provided", () => {
    render(<WavePicture name="wave" picture="pic.jpg" contributors={[]} />);
    const img = screen.getByRole("img", { name: "wave" });
    expect(img.getAttribute("src")).toContain("pic.jpg");
    expect(img).toHaveAttribute("alt", "wave");
  });

  it("requests the 200x200 derivative of a CDN wave picture and falls back to the original", () => {
    render(
      <WavePicture name="wave" picture={CDN_AVATAR_URL} contributors={[]} />
    );
    const img = screen.getByRole("img", { name: "wave" });
    expect(img).toHaveAttribute(
      "src",
      `https://d3lqz0a4bldqgf.cloudfront.net${scaledAvatarPath(ImageScale.W_200_H_200)}`
    );

    fireEvent.error(img);
    expect(screen.getByRole("img", { name: "wave" })).toHaveAttribute(
      "src",
      CDN_AVATAR_URL
    );
  });

  it("requests the 200x200 derivative for contributor avatars", () => {
    render(
      <WavePicture
        name="wave"
        picture={null}
        contributors={[{ pfp: CDN_AVATAR_URL }]}
      />
    );
    expect(getRequestedImageSrc(screen.getByRole("img"))).toContain(
      scaledAvatarPath(ImageScale.W_200_H_200)
    );
  });

  it("renders default wave icon fallback when no picture and no contributors", () => {
    const { container } = render(
      <WavePicture name="wave" picture={null} contributors={[]} />
    );
    expect(container.firstChild).toBeInTheDocument();
    const icon = screen.getByTestId("wave-fallback-icon");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("tw-text-white/60");
    expect(icon.parentElement).toHaveClass("tw-bg-white/10");
  });

  it("renders contributor images sliced", () => {
    const contributors = [{ pfp: "a.png" }, { pfp: "b.png" }, { pfp: "c.png" }];
    render(
      <WavePicture name="wave" picture={null} contributors={contributors} />
    );
    expect(screen.getAllByRole("img").length).toBe(3);
  });

  it("excludes authenticated user contributor from collage when identity matches", () => {
    const contributors = [
      { pfp: "mine.png", identity: "id-0xabc" },
      { pfp: "a.png", identity: "alice" },
      { pfp: "b.png", identity: "bob" },
    ];

    render(
      <AuthContext.Provider
        value={
          {
            connectedProfile: {
              id: "user-id",
              handle: "me",
              normalised_handle: "me",
              primary_wallet: "0xabc",
              query: "id-0xabc",
              wallets: [{ wallet: "0xabc" }],
            },
            activeProfileProxy: null,
          } as any
        }
      >
        <WavePicture name="wave" picture={null} contributors={contributors} />
      </AuthContext.Provider>
    );

    expect(screen.getAllByRole("img")).toHaveLength(2);
  });
});
