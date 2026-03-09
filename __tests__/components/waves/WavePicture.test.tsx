import React from "react";
import { render, screen } from "@testing-library/react";
import { AuthContext } from "@/components/auth/Auth";
import WavePicture from "@/components/waves/WavePicture";

describe("WavePicture", () => {
  it("renders picture image when provided", () => {
    render(<WavePicture name="wave" picture="pic.jpg" contributors={[]} />);
    const img = screen.getByRole("img", { name: "wave" });
    expect(img.getAttribute("src")).toContain("pic.jpg");
    expect(img).toHaveAttribute("alt", "wave");
  });

  it("renders gradient when no picture and no contributors", () => {
    const { container } = render(
      <WavePicture name="wave" picture={null} contributors={[]} />
    );
    expect(container.firstChild).toBeInTheDocument();
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
