import { render, screen } from "@testing-library/react";
import React from "react";

import { createManifoldHandler } from "@/components/drops/view/part/dropPartMarkdown/handlers/manifold";

const mockManifoldPreview = jest.fn(({ href }: any) => (
  <div data-testid="manifold-preview" data-href={href} />
));

jest.mock("@/components/waves/ManifoldPreview", () => ({
  __esModule: true,
  default: (props: any) => mockManifoldPreview(props),
}));

describe("createManifoldHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("matches only manifold listing URLs", () => {
    const handler = createManifoldHandler();

    expect(
      handler.match("https://manifold.xyz/@andrew-hooker/id/4098474224")
    ).toBe(true);
    expect(
      handler.match("https://www.manifold.xyz/@artist-name/id/123456")
    ).toBe(true);

    expect(handler.match("https://manifold.xyz/@andrew-hooker")).toBe(false);
    expect(handler.match("https://manifold.xyz/gallery")).toBe(false);
    expect(
      handler.match("https://fake-manifold.xyz/@andrew-hooker/id/4098474224")
    ).toBe(false);
  });

  it("renders ManifoldPreview for matched URLs", () => {
    const handler = createManifoldHandler();
    const element = handler.render(
      "https://manifold.xyz/@andrew-hooker/id/4098474224"
    );

    render(<>{element}</>);

    expect(mockManifoldPreview).toHaveBeenCalledWith({
      href: "https://manifold.xyz/@andrew-hooker/id/4098474224",
    });
    expect(screen.getByTestId("manifold-preview")).toHaveAttribute(
      "data-href",
      "https://manifold.xyz/@andrew-hooker/id/4098474224"
    );
  });
});
