import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageHeaderAboutEditError from "@/components/user/user-page-header/about/UserPageHeaderAboutEditError";

describe("UserPageHeaderAboutEditError", () => {
  it("detects known error types", () => {
    render(
      <UserPageHeaderAboutEditError
        msg="contains personal insults"
        closeError={jest.fn()}
      />
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Personal insult warning")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your About statement was flagged for a possible personal insult. Revise it and try again."
      )
    ).toBeInTheDocument();
    expect(document.getElementById("profile-about-error")).toContainElement(
      screen.getByRole("alert")
    );
  });

  it("handles unknown errors and close click", async () => {
    const close = jest.fn();
    render(<UserPageHeaderAboutEditError msg="something" closeError={close} />);
    expect(screen.getByText("Couldn't save About")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Dismiss About statement error" })
    );
    expect(close).toHaveBeenCalled();
  });
});
