import { render, screen } from "@testing-library/react";
import React from "react";

import { createEnsHandler } from "@/components/drops/view/part/dropPartMarkdown/handlers/ens";

const mockEnsLinkPreview = jest.fn(({ href }: any) => (
  <div data-testid="ens-link-preview" data-href={href} />
));

jest.mock("@/components/waves/ens/EnsLinkPreview", () => ({
  __esModule: true,
  default: (props: any) => mockEnsLinkPreview(props),
}));

describe("createEnsHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("matches ENS names and addresses", () => {
    const handler = createEnsHandler();

    expect(handler.match("vitalik.eth")).toBe(true);
    expect(
      handler.match("https://app.ens.domains/name/alice.eth")
    ).toBe(true);
    expect(
      handler.match(
        "https://etherscan.io/address/0x0000000000000000000000000000000000000001"
      )
    ).toBe(true);
    expect(handler.match("https://example.com")).toBe(false);
  });

  it("renders EnsLinkPreview", () => {
    const handler = createEnsHandler();
    const element = handler.render("vitalik.eth");

    render(<>{element}</>);

    expect(mockEnsLinkPreview).toHaveBeenCalledWith({ href: "vitalik.eth" });
    expect(screen.getByTestId("ens-link-preview")).toHaveAttribute(
      "data-href",
      "vitalik.eth"
    );
  });
});
