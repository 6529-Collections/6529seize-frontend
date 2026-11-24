import { act, renderHook } from "@testing-library/react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import useRepCategoryNavigation from "@/components/user/rep/new-rep/useRepCategoryNavigation";

function keyDown(key: string): ReactKeyboardEvent<HTMLInputElement> {
  return {
    key,
    nativeEvent: new KeyboardEvent("keydown", { key }),
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    preventDefault: jest.fn(),
  } as ReactKeyboardEvent<HTMLInputElement>;
}

describe("useRepCategoryNavigation", () => {
  it("preserves the highlighted category when results reorder", () => {
    const onSelect = jest.fn();
    const { result, rerender } = renderHook(
      ({ categories }) =>
        useRepCategoryNavigation({ categories, enabled: true, onSelect }),
      { initialProps: { categories: ["Art", "Music", "Photography"] } }
    );
    act(() => result.current.handleSearchKeyDown(keyDown("ArrowDown")));
    expect(result.current.activeSuggestionIndex).toBe(1);

    rerender({ categories: ["Photography", "Art", "Music"] });

    expect(result.current.activeSuggestionIndex).toBe(2);
    expect(result.current.activeSuggestionId).toBe(
      `${result.current.optionIdPrefix}2`
    );
    act(() => result.current.handleSearchKeyDown(keyDown("Enter")));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("Music");
  });

  it.each([
    { key: "ArrowDown", index: 0, category: "Art" },
    { key: "ArrowUp", index: 1, category: "Photography" },
  ])(
    "leaves a disappeared highlight unselected until $key chooses $category",
    ({ key, index, category }) => {
      const onSelect = jest.fn();
      const { result, rerender } = renderHook(
        ({ categories }) =>
          useRepCategoryNavigation({ categories, enabled: true, onSelect }),
        { initialProps: { categories: ["Art", "Music", "Photography"] } }
      );
      act(() => result.current.handleSearchKeyDown(keyDown("ArrowDown")));
      expect(result.current.activeSuggestionIndex).toBe(1);

      rerender({ categories: ["Art", "Photography"] });

      expect(result.current.activeSuggestionIndex).toBe(-1);
      expect(result.current.activeSuggestionId).toBeUndefined();
      const enter = keyDown("Enter");
      act(() => result.current.handleSearchKeyDown(enter));
      expect(enter.preventDefault).toHaveBeenCalledTimes(1);
      expect(onSelect).not.toHaveBeenCalled();

      act(() => result.current.handleSearchKeyDown(keyDown(key)));

      expect(result.current.activeSuggestionIndex).toBe(index);
      expect(result.current.activeSuggestionId).toBe(
        `${result.current.optionIdPrefix}${index}`
      );
      act(() => result.current.handleSearchKeyDown(keyDown("Enter")));
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(category);
    }
  );
});
