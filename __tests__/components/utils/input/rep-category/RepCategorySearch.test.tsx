import React from "react";
import { render, fireEvent, act } from "@testing-library/react";
import RepCategorySearch from "@/components/utils/input/rep-category/RepCategorySearch";
import { useQuery } from "@tanstack/react-query";

jest.mock("@tanstack/react-query");
jest.mock(
  "@/components/utils/input/rep-category/RepCategorySearchDropdown",
  () => (props: any) => {
    dropdownProps = props;
    return <button data-testid="dropdown" type="button" />;
  }
);

jest.mock("react-use", () => ({
  useDebounce: jest.fn((fn: Function, delay: number, deps: any[]) => {
    React.useEffect(() => {
      fn();
    }, deps);
  }),
  useClickAway: jest.fn(),
  useKeyPressEvent: jest.fn(),
}));

let dropdownProps: any = null;

(useQuery as jest.Mock).mockReturnValue({ data: ["Art"] });

describe("RepCategorySearch", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("passes categories to dropdown", () => {
    const setCategory = jest.fn();
    jest.useFakeTimers();
    const { getByRole } = render(
      <RepCategorySearch category={null} setCategory={setCategory} />
    );
    fireEvent.change(getByRole("textbox"), { target: { value: "art" } });
    act(() => {
      jest.runAllTimers();
    });
    expect(dropdownProps.categories).toEqual(["art", "Art"]);
  });

  it("filters the reserved Help6529 Credits category", () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: ["Help6529 Credits", "Art"],
    });
    const setCategory = jest.fn();
    jest.useFakeTimers();
    const { getByRole } = render(
      <RepCategorySearch category={null} setCategory={setCategory} />
    );
    fireEvent.change(getByRole("textbox"), {
      target: { value: "Help6529 Credits" },
    });
    act(() => {
      jest.runAllTimers();
    });
    expect(dropdownProps.categories).toEqual([]);
  });

  it("closes after focus leaves the whole search control", () => {
    const setCategory = jest.fn();
    const { getByRole, getByTestId } = render(
      <>
        <RepCategorySearch category={null} setCategory={setCategory} />
        <button type="button">Outside</button>
      </>
    );
    const input = getByRole("textbox");
    const dropdown = getByTestId("dropdown");

    fireEvent.focus(input);
    expect(dropdownProps.open).toBe(true);

    fireEvent.blur(input, { relatedTarget: dropdown });
    expect(dropdownProps.open).toBe(true);

    fireEvent.blur(dropdown, {
      relatedTarget: getByRole("button", { name: "Outside" }),
    });
    expect(dropdownProps.open).toBe(false);
  });
});
