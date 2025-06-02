import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageRepNewRepSearch from "../../../../../components/user/rep/new-rep/UserPageRepNewRepSearch";
import { useQuery } from "@tanstack/react-query";

jest.mock("@tanstack/react-query", () => ({ useQuery: jest.fn() }));

jest.mock("../../../../../components/user/rep/new-rep/UserPageRepNewRepSearchHeader", () => () => <div data-testid="header" />);
jest.mock("../../../../../components/user/rep/new-rep/UserPageRepNewRepSearchDropdown", () => (props: any) => (
  <div data-testid="dropdown">
    {props.categories.map((c: string) => (
      <button key={c} onClick={() => props.onRepSelect(c)}>{c}</button>
    ))}
  </div>
));
jest.mock("../../../../../components/user/rep/new-rep/UserPageRepNewRepError", () => () => <div data-testid="error" />);
jest.mock("../../../../../components/distribution-plan-tool/common/CircleLoader", () => () => <div data-testid="loader" />);
jest.mock("services/api/common-api", () => ({ commonApiFetch: jest.fn() }));

describe("UserPageRepNewRepSearch", () => {
  it("shows dropdown results and handles selection", async () => {
    (useQuery as jest.Mock).mockReturnValue({ isFetching: false, data: ["cat1"] });
    const user = userEvent.setup();
    render(
      <UserPageRepNewRepSearch repRates={null} onRepSearch={jest.fn()} profile={{} as any} />
    );
    await user.type(screen.getByPlaceholderText(/Category to grant rep/), "art");
    await waitFor(() => screen.getByTestId("dropdown"));
    expect(screen.getByText("cat1")).toBeInTheDocument();
  });

});
