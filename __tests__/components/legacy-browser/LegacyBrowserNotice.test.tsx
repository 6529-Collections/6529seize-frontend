import { render, screen } from "@testing-library/react";
import LegacyBrowserNotice from "@/components/legacy-browser/LegacyBrowserNotice";
import { LEGACY_BROWSER_NOTICE_ID } from "@/components/legacy-browser/legacyBrowserGate";

describe("LegacyBrowserNotice", () => {
  it("renders the iOS and the browser notice, each a labelled section with a heading", () => {
    const { container } = render(<LegacyBrowserNotice />);
    const notice = container.querySelector(`#${LEGACY_BROWSER_NOTICE_ID}`);
    expect(notice).not.toBeNull();

    const ios = container.querySelector('[data-legacy-variant="ios"]')!;
    expect(ios).toHaveTextContent("6529 needs iOS 16.4 or later");
    expect(ios).toHaveTextContent(
      "Update in Settings > General > Software Update, then open 6529 again."
    );

    const other = container.querySelector('[data-legacy-variant="other"]')!;
    expect(other).toHaveTextContent("6529 needs a newer browser");

    expect(
      screen.getByRole("region", { name: "6529 needs iOS 16.4 or later" })
    ).toBe(ios);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "6529 needs a newer browser",
      })
    ).toBeInTheDocument();
  });
});
