import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import useIsMdViewportOrUnknown from "@/hooks/useIsMdViewportOrUnknown";

// The hook keeps one media query list for the page, so the list's answer is
// what changes between cases.
let viewportMatches = false;
const mediaQueryList = {
  get matches() {
    return viewportMatches;
  },
  media: "(min-width: 768px)",
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

describe("useIsMdViewportOrUnknown", () => {
  const originalMatchMedia = globalThis.matchMedia;
  beforeAll(() => {
    globalThis.matchMedia = jest.fn(
      () => mediaQueryList
    ) as unknown as typeof globalThis.matchMedia;
  });
  afterAll(() => {
    globalThis.matchMedia = originalMatchMedia;
  });
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it.each([true, false])(
    "is unknown on the server and during hydration, then %s",
    async (matches) => {
      viewportMatches = matches;
      const seen: (boolean | null)[] = [];
      function Probe() {
        const value = useIsMdViewportOrUnknown();
        seen.push(value);
        return <span>{String(value)}</span>;
      }

      // Server markup, and the hydration render, use the unknown value even
      // though the browser could already answer.
      const html = renderToString(<Probe />);
      expect(html).toContain("null");
      seen.length = 0;

      const container = document.createElement("div");
      container.innerHTML = html;
      document.body.appendChild(container);
      const errors = jest.spyOn(console, "error").mockImplementation(() => {});
      const recoverable: unknown[] = [];
      await act(async () => {
        hydrateRoot(container, <Probe />, {
          onRecoverableError: (error) => recoverable.push(error),
        });
      });

      expect(seen[0]).toBeNull();
      expect(seen.at(-1)).toBe(matches);
      expect(container.textContent).toBe(String(matches));
      // No hydration mismatch: the first client render matched the server.
      expect(recoverable).toEqual([]);
      expect(errors).not.toHaveBeenCalled();
      errors.mockRestore();
    }
  );
});
