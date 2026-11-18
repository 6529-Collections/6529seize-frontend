import { renderHook } from "@testing-library/react";

import { useMediaActions } from "@/components/drops/view/item/content/media/useMediaActions";

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));

const renderActions = (url: string) =>
  renderHook(() =>
    useMediaActions({ url, fallbackFileName: "media", mimeType: "image/png" })
  ).result.current;

describe("useMediaActions open action", () => {
  it("opens HTTPS media without an opener or referrer", () => {
    const open = jest.spyOn(globalThis.window, "open").mockReturnValue(null);
    const actions = renderActions(
      "https://d3lqz0a4bldqgf.cloudfront.net/a.png"
    );

    actions.openMedia?.();

    expect(open).toHaveBeenCalledWith(
      "https://d3lqz0a4bldqgf.cloudfront.net/a.png",
      "_blank",
      "noopener,noreferrer"
    );
    open.mockRestore();
  });

  it.each(["javascript:alert(1)", "data:text/html,<p>x</p>"])(
    "offers no open action for %s",
    (url) => {
      const actions = renderActions(url);
      expect(actions.openMedia).toBeUndefined();
      expect(actions.openLabel).toBeUndefined();
    }
  );
});
