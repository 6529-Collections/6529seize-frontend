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

    expect(screen.getByLabelText("Environment: ALICESTG")).toHaveTextContent(
      "ALICESTG"
    );
  });

  it("includes the local port", () => {
    publicEnv.BASE_ENDPOINT = "http://localhost:3001";

    render(<EnvironmentBadge />);

    expect(screen.getByLabelText("Environment: LOCAL:3001")).toHaveTextContent(
      "LOCAL:3001"
    );
  });
});
