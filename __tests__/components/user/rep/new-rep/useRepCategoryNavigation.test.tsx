import {
  createEvent,
  fireEvent,
  render,
  renderHook,
} from "@testing-library/react";
import useRepCategoryNavigation from "@/components/user/rep/new-rep/useRepCategoryNavigation";

function renderNavigation() {
  const onSelect = jest.fn();
  const { result, rerender } = renderHook(
    ({ categories }) =>
      useRepCategoryNavigation({ categories, enabled: true, onSelect }),
    { initialProps: { categories: ["Art", "Music", "Photography"] } }
  );
  const { getByRole } = render(
    <input
      aria-label="Category search"
      onKeyDown={(event) => result.current.handleSearchKeyDown(event)}
    />
  );
  const input = getByRole("textbox", { name: "Category search" });
  return {
    result,
    rerender,
    onSelect,
    keyDown: (key: string) => {
      const event = createEvent.keyDown(input, {
        key,
        bubbles: true,
        cancelable: true,
      });
      fireEvent(input, event);
      return event;
    },
  };
}

describe("useRepCategoryNavigation", () => {
  it("preserves the highlighted category when results reorder", () => {
    const { result, rerender, onSelect, keyDown } = renderNavigation();
    keyDown("ArrowDown");
    expect(result.current.activeSuggestionIndex).toBe(1);

    rerender({ categories: ["Photography", "Art", "Music"] });

    expect(result.current.activeSuggestionIndex).toBe(2);
    expect(result.current.activeSuggestionId).toBe(
      `${result.current.optionIdPrefix}2`
    );
    keyDown("Enter");
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("Music");
  });

  it.each([
    { key: "ArrowDown", index: 0, category: "Art" },
    { key: "ArrowUp", index: 1, category: "Photography" },
  ])(
    "leaves a disappeared highlight unselected until $key chooses $category",
    ({ key, index, category }) => {
      const { result, rerender, onSelect, keyDown } = renderNavigation();
      keyDown("ArrowDown");
      expect(result.current.activeSuggestionIndex).toBe(1);

      rerender({ categories: ["Art", "Photography"] });

      expect(result.current.activeSuggestionIndex).toBe(-1);
      expect(result.current.activeSuggestionId).toBeUndefined();
      const enter = keyDown("Enter");
      expect(enter.defaultPrevented).toBe(true);
      expect(onSelect).not.toHaveBeenCalled();

      keyDown(key);

      expect(result.current.activeSuggestionIndex).toBe(index);
      expect(result.current.activeSuggestionId).toBe(
        `${result.current.optionIdPrefix}${index}`
      );
      keyDown("Enter");
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(category);
    }
  );
});
