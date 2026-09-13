import ContentModerationAccessError from "@/components/content-moderation/ContentModerationAccessError";
import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

it.each(SUPPORTED_LOCALES)(
  "announces an access-check failure and supports keyboard retry in %s",
  async (locale) => {
    const retry = jest.fn();
    render(
      <ContentModerationAccessError
        locale={locale}
        retrying={false}
        onRetryAction={retry}
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't check your WatchTower access. Try again."
    );
    await userEvent.tab();
    expect(
      screen.getByRole("button", { name: "Retry permission check" })
    ).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(retry).toHaveBeenCalledTimes(1);
  }
);

it("announces a pending retry and prevents repeated requests", async () => {
  const retry = jest.fn();
  render(
    <ContentModerationAccessError
      locale="en-US"
      retrying
      onRetryAction={retry}
    />
  );
  const button = screen.getByRole("button", { name: "Retry permission check" });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");
  expect(screen.getByRole("status")).toHaveTextContent("Checking permissions…");
  await userEvent.click(button);
  expect(retry).not.toHaveBeenCalled();
});
