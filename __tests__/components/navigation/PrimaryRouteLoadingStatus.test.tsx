import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import PrimaryRouteLoadingStatus from "@/components/navigation/PrimaryRouteLoadingStatus";
import { t } from "@/i18n/messages";

const MESSAGE_KEY = "waves.header.postLabel.inProgress";

describe("PrimaryRouteLoadingStatus", () => {
  it("renders an empty status in server HTML", () => {
    const html = renderToString(
      <PrimaryRouteLoadingStatus messageKey={MESSAGE_KEY} />
    );
    expect(html).toContain('role="status"');
    expect(html).not.toContain(t("en-US", MESSAGE_KEY));
  });

  it("announces the localized message after hydration", () => {
    render(<PrimaryRouteLoadingStatus messageKey={MESSAGE_KEY} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      t("en-US", MESSAGE_KEY)
    );
  });
});
