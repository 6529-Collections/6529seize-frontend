import { act, render, screen, within } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

let mockBrowserOrigin = "https://6529.io";
const mockPublicEnv = { BASE_ENDPOINT: "https://6529.io" };

jest.mock("@/config/appEnvironment", () => {
  const actual = jest.requireActual("@/config/appEnvironment");
  return {
    ...actual,
    getBrowserOrigin: () => mockBrowserOrigin,
  };
});
jest.mock("@/config/env", () => ({
  get publicEnv() {
    return mockPublicEnv;
  },
}));

import EnvironmentBadge from "@/components/common/EnvironmentBadge";

afterEach(() => {
  mockBrowserOrigin = "https://6529.io";
  mockPublicEnv.BASE_ENDPOINT = "https://6529.io";
});

describe("EnvironmentBadge", () => {
  it("does not render in production", () => {
    const { container } = render(<EnvironmentBadge />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the derived personal staging badge", () => {
    mockBrowserOrigin = "https://alicestaging.6529.io";

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
    mockBrowserOrigin = "http://localhost:3001";

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

  it("replaces the configured host's badge with the browser host's after hydration", async () => {
    // A local server started on another port than the build's BASE_ENDPOINT.
    mockPublicEnv.BASE_ENDPOINT = "http://localhost:3001";
    mockBrowserOrigin = "http://localhost:3005";
    const container = document.createElement("div");
    container.innerHTML = renderToString(<EnvironmentBadge />);
    document.body.appendChild(container);
    expect(
      within(container).getByLabelText("Environment: LCL:3001 (localhost:3001)")
    ).toBeInTheDocument();

    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, <EnvironmentBadge />, {
          onRecoverableError: (error) => errors.push(error),
        });
      });

      expect(
        within(container).getByLabelText(
          "Environment: LCL:3005 (localhost:3005)"
        )
      ).toHaveTextContent("LCL:3005");
      expect(errors).toEqual([]);
    } finally {
      act(() => root?.unmount());
      container.remove();
    }
  });
});

it.each([
  ["http://localhost:3001", "LCL:3001", "localhost:3001"],
  ["https://staging.6529.io", "STG", "staging.6529.io"],
  ["https://prxtstaging.6529.io", "PRXTSTG", "prxtstaging.6529.io"],
])(
  "renders the configured %s in server HTML and preserves its node through hydration",
  async (origin, badge, host) => {
    mockPublicEnv.BASE_ENDPOINT = `${origin}/waves`;
    mockBrowserOrigin = origin;
    const container = document.createElement("div");
    container.innerHTML = renderToString(<EnvironmentBadge compact />);
    document.body.appendChild(container);
    const initialBadge = within(container).getByLabelText(
      `Environment: ${badge} (${host})`
    );
    expect(initialBadge).toHaveTextContent(badge);
    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, <EnvironmentBadge compact />, {
          onRecoverableError: (error) => errors.push(error),
        });
      });
      expect(
        within(container).getByLabelText(`Environment: ${badge} (${host})`)
      ).toBe(initialBadge);
      expect(errors).toEqual([]);
    } finally {
      act(() => root?.unmount());
      container.remove();
    }
  }
);

it.each(["https://6529.io", "https://www.6529.io", "not a url"])(
  "omits the badge from server HTML for the configured %s",
  (baseEndpoint) => {
    mockPublicEnv.BASE_ENDPOINT = baseEndpoint;
    expect(renderToString(<EnvironmentBadge />)).toBe("");
  }
);
