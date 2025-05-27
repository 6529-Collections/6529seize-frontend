import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import UserPageRepNewRepSearchDropdown from "../../../../../components/user/rep/new-rep/UserPageRepNewRepSearchDropdown";
import { RepSearchState } from "../../../../../components/user/rep/new-rep/UserPageRepNewRepSearch";

describe("UserPageRepNewRepSearchDropdown", () => {
  it("renders categories and handles selection", async () => {
    const onSelect = jest.fn();
    render(
      <UserPageRepNewRepSearchDropdown
        categories={["Art", "NFT"]}
        onRepSelect={onSelect}
        state={RepSearchState.HAVE_RESULTS}
        minSearchLength={3}
        maxSearchLength={100}
      />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    await userEvent.click(buttons[1]);
    expect(onSelect).toHaveBeenCalledWith("NFT");
  });

  it("shows error messages for min and max length", () => {
    const { rerender } = render(
      <UserPageRepNewRepSearchDropdown
        categories={[]}
        onRepSelect={() => {}}
        state={RepSearchState.MIN_LENGTH_ERROR}
        minSearchLength={3}
        maxSearchLength={10}
      />
    );
    expect(screen.getByText("Type at least 3 characters")).toBeInTheDocument();

    rerender(
      <UserPageRepNewRepSearchDropdown
        categories={[]}
        onRepSelect={() => {}}
        state={RepSearchState.MAX_LENGTH_ERROR}
        minSearchLength={3}
        maxSearchLength={10}
      />
    );
    expect(screen.getByText("Type at most 10 characters")).toBeInTheDocument();
  });
});
