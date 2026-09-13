import ContentModerationNoAccess from "@/components/content-moderation/ContentModerationNoAccess";
import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("ContentModerationNoAccess", () => {
  it.each(SUPPORTED_LOCALES)(
    "explains group and direct-profile access with a readable fallback in %s",
    (locale) => {
      render(<ContentModerationNoAccess locale={locale} />);
      expect(
        screen.getByRole("heading", {
          name: "WatchTower requires membership in the 6529 Dev Team group.",
        })
      ).toBeVisible();
      expect(
        screen.getByText(
          "Sign in with a wallet linked to your group member profile. Switch out of proxy mode to use your own profile."
        )
      ).toBeVisible();
      expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute(
        "href",
        "/"
      );
      expect(screen.queryByText(/redirecting/i)).not.toBeInTheDocument();
    }
  );

  it("lets the user choose when to leave using the keyboard", async () => {
    render(<ContentModerationNoAccess locale="en-US" />);
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "Go home" })).toHaveFocus();
  });
});
