import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Pagination from "@/components/pagination/Pagination";

describe("Pagination", () => {
  it("advances to the next page when activated with the Enter key", async () => {
    const setPage = jest.fn();
    const user = userEvent.setup();

    render(<Pagination page={1} pageSize={10} totalResults={30} setPage={setPage} />);

    const nextButton = screen.getByRole("button", { name: /next page/i });
    nextButton.focus();
    expect(nextButton).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(setPage).toHaveBeenCalledTimes(1);
    expect(setPage).toHaveBeenCalledWith(2);
  });

  it("returns to the previous page when activated with the Space key", async () => {
    const setPage = jest.fn();
    const user = userEvent.setup();

    render(<Pagination page={2} pageSize={10} totalResults={30} setPage={setPage} />);

    const previousButton = screen.getByRole("button", { name: /previous page/i });
    previousButton.focus();
    expect(previousButton).toHaveFocus();

    await user.keyboard(" ");

    expect(setPage).toHaveBeenCalledTimes(1);
    expect(setPage).toHaveBeenCalledWith(1);
  });
});
