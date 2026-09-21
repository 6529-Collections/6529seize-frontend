import { act, render, screen, within } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

let mockBrowserOrigin = "https://6529.io";

jest.mock("@/config/appEnvironment", () => {
  const actual = jest.requireActual("@/config/appEnvironment");
  return {
    ...actual,
    getBrowserOrigin: () => mockBrowserOrigin,
  };
});

import EnvironmentOriginProvider from "@/components/common/EnvironmentOriginContext";

import EnvironmentBadge from "@/components/common/EnvironmentBadge";

describe("EnvironmentBadge", () => {
  afterEach(() => {
    mockBrowserOrigin = "https://6529.io";
  });

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

  it("hydrates from a production-safe empty badge before revealing the browser environment", async () => {
    mockBrowserOrigin = "https://staging.6529.io";
    const container = document.createElement("div");
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    container.innerHTML = renderToString(<EnvironmentBadge />);
    document.body.appendChild(container);
    expect(container).toBeEmptyDOMElement();

    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, <EnvironmentBadge />);
      });

      expect(
        within(container).getByLabelText("Environment: STG (staging.6529.io)")
      ).toHaveTextContent("STG");
      expect(consoleError.mock.calls.flat().join(" ")).not.toMatch(
        /hydration|did not match/i
      );
    } finally {
      act(() => root?.unmount());
      container.remove();
      consoleError.mockRestore();
    }
  });
});

it.each([
  ["http://localhost:3001", "LCL:3001", "localhost:3001"],
  ["https://staging.6529.io", "STG", "staging.6529.io"],
  ["https://prxtstaging.6529.io", "PRXTSTG", "prxtstaging.6529.io"],
])(
  "renders %s in server HTML and preserves its node through hydration",
  async (origin, badge, host) => {
    mockBrowserOrigin = origin;
    const ui = (
      <EnvironmentOriginProvider origin={origin}>
        <EnvironmentBadge compact />
      </EnvironmentOriginProvider>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(ui);
    document.body.appendChild(container);
    const initialBadge = within(container).getByLabelText(
      `Environment: ${badge} (${host})`
    );
    expect(initialBadge).toHaveTextContent(badge);
    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, ui, {
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
      mockBrowserOrigin = "https://6529.io";
    }
  }
);

it.each(["https://6529.io", "https://www.6529.io"])(
  "omits the production badge from server HTML for %s",
  (origin) => {
    expect(
      renderToString(
        <EnvironmentOriginProvider origin={origin}>
          <EnvironmentBadge />
        </EnvironmentOriginProvider>
      )
    ).toBe("");
  }
);
