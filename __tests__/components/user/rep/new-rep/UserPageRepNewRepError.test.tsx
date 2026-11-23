import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageRepNewRepError from "@/components/user/rep/new-rep/UserPageRepNewRepError";

test("shows title, message and details, and triggers close", async () => {
  const user = userEvent.setup();
  const close = jest.fn();
  render(<UserPageRepNewRepError msg="oops" closeError={close} />);
  expect(
    screen.getByRole("heading", { name: /category name won't work/i })
  ).toBeInTheDocument();
  expect(screen.getByText("oops")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("oops");
  expect(screen.getByText(/AI filter/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Dismiss error" }));
  expect(close).toHaveBeenCalled();
});

test("can hide the abuse-filter details for local validation errors", () => {
  const close = jest.fn();
  render(
    <UserPageRepNewRepError
      msg="Use at least 3 characters."
      showDetails={false}
      closeError={close}
    />
  );

  expect(screen.getByText("Use at least 3 characters.")).toBeInTheDocument();
  expect(screen.queryByText(/AI filter/)).not.toBeInTheDocument();
});
