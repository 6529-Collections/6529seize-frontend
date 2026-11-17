import { useNftCollectionSort } from "@/hooks/useNftCollectionSort";
import { useNftPurchasingVisibility } from "@/hooks/useNftPurchasingVisibility";
import { act, renderHook } from "@testing-library/react";

jest.mock("@/hooks/useNftPurchasingVisibility");

it("falls back from market quotes while preserving the selected sort for web", () => {
  const visibility = jest.mocked(useNftPurchasingVisibility);
  visibility.mockReturnValue({
    hideNftPurchasing: true,
    shouldRedirect: false,
    reservesNftPurchasingSpace: true,
  });
  const { result, rerender } = renderHook(() =>
    useNftCollectionSort<"floor" | "age" | "artist">(
      "floor",
      "age",
      (sort) => sort === "floor"
    )
  );
  expect(result.current.sort).toBe("age");

  visibility.mockReturnValue({
    hideNftPurchasing: false,
    shouldRedirect: false,
    reservesNftPurchasingSpace: false,
  });
  rerender();
  expect(result.current.sort).toBe("floor");

  visibility.mockReturnValue({
    hideNftPurchasing: true,
    shouldRedirect: true,
    reservesNftPurchasingSpace: false,
  });
  rerender();
  expect(result.current.sort).toBe("age");

  act(() => result.current.setSort("artist"));
  expect(result.current.sort).toBe("artist");
});
