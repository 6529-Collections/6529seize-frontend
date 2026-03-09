import { render } from "@testing-library/react";

jest.mock("@google/model-viewer", () => {});
import NFTModel from "@/components/nft-image/NFTModel";

const nft = {
  id: 1,
  name: "Cool",
  scaled: "scaled.png",
  animation: "top-level.glb",
  metadata: {
    animation: "anim.glb",
    animation_url: "anim2.glb",
  },
} as any;

describe("NFTModel", () => {
  it("renders model-viewer with defaults", () => {
    const { container } = render(<NFTModel nft={nft} />);
    const el = container.querySelector("model-viewer") as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.getAttribute("id")).toBe("iframe-1");
    expect(el.getAttribute("src")).toBe("top-level.glb");
    expect(el.getAttribute("alt")).toBe("Cool");
    expect(el.getAttribute("poster")).toBe("scaled.png");
  });

  it("uses provided id and falls back to metadata.animation", () => {
    const modified = {
      ...nft,
      animation: "",
      metadata: { animation: "anim.glb", animation_url: "url.glb" },
    };
    const { container } = render(<NFTModel nft={modified} id="custom" />);
    const el = container.querySelector("model-viewer") as HTMLElement;
    expect(el.getAttribute("id")).toBe("custom");
    expect(el.getAttribute("src")).toBe("anim.glb");
  });

  it("falls back to metadata.animation_url when earlier sources are empty", () => {
    const modified = {
      ...nft,
      animation: "   ",
      metadata: { animation: "", animation_url: "url.glb" },
    };
    const { container } = render(<NFTModel nft={modified} id="custom" />);
    const el = container.querySelector("model-viewer") as HTMLElement;
    expect(el.getAttribute("src")).toBe("url.glb");
  });
});
