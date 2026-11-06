import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
import WebSidebarHeader from "@/components/layout/sidebar/WebSidebarHeader";

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

  it.each([false, true])(
    "replaces the configured host's badge after hydration (logo overlay: %s)",
    async (logoOverlay) => {
      // A local server started on another port than the build's BASE_ENDPOINT.
      mockPublicEnv.BASE_ENDPOINT = "http://localhost:3001";
      mockBrowserOrigin = "http://localhost:3005";
      const container = document.createElement("div");
      container.innerHTML = renderToString(
        <EnvironmentBadge logoOverlay={logoOverlay} />
      );
      document.body.appendChild(container);
      expect(
        within(container).getByLabelText(
          "Environment: LCL:3001 (localhost:3001)"
        )
      ).toBeInTheDocument();

      const errors: unknown[] = [];
      let root: ReturnType<typeof hydrateRoot> | undefined;
      try {
        await act(async () => {
          root = hydrateRoot(
            container,
            <EnvironmentBadge logoOverlay={logoOverlay} />,
            {
              onRecoverableError: (error) => errors.push(error),
            }
          );
        });

        const hydratedBadge = within(container).getByLabelText(
          "Environment: LCL:3005 (localhost:3005)"
        );
        if (logoOverlay) {
          expect(
            Array.from(hydratedBadge.children, (line) => line.textContent)
          ).toEqual(["LCL", "3005"]);
        } else {
          expect(hydratedBadge).toHaveTextContent("LCL:3005");
        }
        expect(errors).toEqual([]);
      } finally {
        act(() => root?.unmount());
        container.remove();
      }
    }
  );
});

describe("desktop logo overlay", () => {
  it.each([
    ["https://staging.6529.io", "STG", "staging.6529.io", ["STG"]],
    ["http://localhost:4567", "LCL:4567", "localhost:4567", ["LCL", "4567"]],
    ["http://127.0.0.1:9876", "LCL:9876", "127.0.0.1:9876", ["LCL", "9876"]],
    ["http://localhost", "LCL", "localhost", ["LCL"]],
    [
      "https://alicestaging.6529.io",
      "ALICESTG",
      "alicestaging.6529.io",
      ["ALICESTG"],
    ],
    ["https://preview.6529.io", "PREVIEW", "preview.6529.io", ["PREVIEW"]],
    ["http://local.test:4567", "LOCAL", "local.test:4567", ["LOCAL"]],
  ])("renders %s as one centered badge", (origin, label, host, lines) => {
    mockBrowserOrigin = origin;
    render(<EnvironmentBadge logoOverlay />);

    const badge = screen.getByRole("img", {
      name: `Environment: ${label} (${host})`,
    });
    expect(Array.from(badge.children, (line) => line.textContent)).toEqual(
      lines
    );
    expect(badge).toHaveClass(
      "tw-absolute",
      "tw-left-1/2",
      "tw-top-1/2",
      "-tw-translate-x-1/2",
      "-tw-translate-y-1/2",
      "tw-flex-col",
      "tw-pointer-events-none"
    );
    expect(badge).not.toHaveAttribute("tabindex");
    expect(badge).not.toHaveAttribute("data-tooltip-id");
  });

  it.each([true, false])(
    "preserves the logo link and toggle (collapsed: %s)",
    async (collapsed) => {
      mockBrowserOrigin = "http://localhost:4567";
      const onToggle = jest.fn();
      const user = userEvent.setup();
      const { container, rerender } = render(
        <WebSidebarHeader collapsed={collapsed} onToggle={onToggle} />
      );
      const link = screen.getByRole("link", {
        name: "6529Seize Environment: LCL:4567 (localhost:4567)",
      });
      const logo = screen.getByRole("img", { name: "6529Seize" });
      const badge = screen.getByLabelText(
        "Environment: LCL:4567 (localhost:4567)"
      );
      expect(link).toContainElement(badge);
      expect(link).toHaveAttribute("href", "/");
      expect(link).toHaveClass(
        "tw-relative",
        "tw-size-10",
        "tw-ml-5",
        "focus-visible:tw-ring-2"
      );
      expect(logo).toHaveAttribute("width", "40");
      expect(logo).toHaveAttribute("height", "40");
      expect(logo).toHaveClass(
        "desktop-hover:group-hover/sidebar-logo:tw-shadow-[0_0_20px_10px_rgba(255,215,215,0.35)]"
      );
      const toggle = screen.getByRole("button", {
        name: "Toggle right sidebar",
      });
      expect(toggle).toHaveAttribute("aria-expanded", String(!collapsed));
      await user.tab();
      expect(link).toHaveFocus();
      await user.tab();
      expect(toggle).toHaveFocus();
      fireEvent.click(toggle);
      expect(onToggle).toHaveBeenCalledTimes(1);

      const header = container.firstElementChild;
      // Production and non-production have the same header children: logo row and toggle.
      expect(header?.children).toHaveLength(2);
      const logoRowClass = link.parentElement?.className;
      mockBrowserOrigin = "https://6529.io";
      rerender(<WebSidebarHeader collapsed={collapsed} onToggle={onToggle} />);
      expect(screen.queryByLabelText(/^Environment:/)).not.toBeInTheDocument();
      expect(header?.children).toHaveLength(2);
      expect(link.parentElement?.className).toBe(logoRowClass);
      expect(link).toHaveAccessibleName("6529Seize");
    }
  );
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
