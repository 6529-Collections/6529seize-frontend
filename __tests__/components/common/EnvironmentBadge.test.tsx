import { render, screen } from "@testing-library/react";
import EnvironmentBadge from "@/components/common/EnvironmentBadge";
import { publicEnv } from "@/config/env";

describe("EnvironmentBadge", () => {
  const originalBaseEndpoint = publicEnv.BASE_ENDPOINT;

  afterEach(() => {
    publicEnv.BASE_ENDPOINT = originalBaseEndpoint;
  });

  it("does not render in production", () => {
    publicEnv.BASE_ENDPOINT = "https://6529.io";

    const { container } = render(<EnvironmentBadge />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the derived personal staging badge", () => {
    publicEnv.BASE_ENDPOINT = "https://alicestaging.6529.io";

    render(<EnvironmentBadge compact />);

    const badge = screen.getByLabelText(
      "Environment: ALICESTG (alicestaging.6529.io)"
    );
    expect(badge).toHaveTextContent("ALICESTG");
    expect(badge).toHaveAttribute("data-tooltip-id");
    expect(badge).toHaveAttribute(
      "data-tooltip-content",
      "Environment: alicestaging.6529.io"
    );
  });

  it("includes the local port", () => {
    publicEnv.BASE_ENDPOINT = "http://localhost:3001";

    render(<EnvironmentBadge />);

    const badge = screen.getByLabelText(
      "Environment: LCL:3001 (localhost:3001)"
    );
    expect(badge).toHaveTextContent("LCL:3001");
    expect(badge).toHaveAttribute("data-tooltip-id");
    expect(badge).toHaveAttribute(
      "data-tooltip-content",
      "Environment: localhost:3001"
    );
  });
});
