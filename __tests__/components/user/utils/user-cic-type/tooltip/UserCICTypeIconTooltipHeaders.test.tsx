import { render, screen } from "@testing-library/react";
import UserCICTypeIconTooltipHeaders from "@/components/user/utils/user-cic-type/tooltip/UserCICTypeIconTooltipHeaders";
import { SUPPORTED_LOCALES } from "@/i18n/locales";

describe("UserCICTypeIconTooltipHeaders", () => {
  it.each(SUPPORTED_LOCALES)(
    "displays fallback header text for %s",
    (locale) => {
      render(<UserCICTypeIconTooltipHeaders locale={locale} />);
      expect(screen.getByText("Network ID Check")).toBeInTheDocument();
      expect(
        screen.getByText(/Does the community believe this profile/i)
      ).toBeInTheDocument();
    }
  );
});
