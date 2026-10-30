import { screen, fireEvent, waitFor } from "@testing-library/react";
import UserPageRepModifyModal from "@/components/user/rep/modify-rep/UserPageRepModifyModal";
import { renderWithAuth } from "../utils/testContexts";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  const data = { rep_rates_left_for_rater: 0, rating_stats: [] };
  return {
    ...actual,
    // Input editing starts after allowance loading completes.
    useQuery: jest.fn(() => ({
      data,
      isError: false,
      isFetching: false,
    })),
    useMutation: jest.fn(() => ({ mutate: jest.fn(), reset: jest.fn() })),
  };
});

describe("UserPageRepModifyModal", () => {
  const onClose = jest.fn();
  const profile = { query: "alice" } as any;
  const category = "general";

  function renderModal() {
    return renderWithAuth(
      <ReactQueryWrapperContext.Provider value={{ onProfileRepModify: jest.fn() } as any}>
        <UserPageRepModifyModal onClose={onClose} profile={profile} category={category} />
      </ReactQueryWrapperContext.Provider>
    );
  }

  it("sanitizes leading zeros", async () => {
    renderModal();
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "012" } });
    await waitFor(() => expect(input).toHaveValue("12"));
  });

  it("ignores non numeric input", async () => {
    renderModal();
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "abc" } });
    await waitFor(() => expect(input).toHaveValue("0"));
  });

  it("clamps value on blur", async () => {
    renderModal();
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.blur(input);
    await waitFor(() => expect(input).toHaveValue("0"));
  });
});
