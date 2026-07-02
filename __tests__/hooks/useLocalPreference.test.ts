import { renderHook, act } from "@testing-library/react";
import useLocalPreference from "@/hooks/useLocalPreference";

describe("useLocalPreference", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("uses default value and updates localStorage", () => {
    const { result } = renderHook(() => useLocalPreference("pref", "def"));
    expect(result.current[0]).toBe("def");

    act(() => result.current[1]("new"));
    expect(result.current[0]).toBe("new");
    expect(localStorage.getItem("pref")).toBe(JSON.stringify("new"));
  });

  it("initializes from existing storage", () => {
    localStorage.setItem("pref", JSON.stringify("stored"));
    const { result } = renderHook(() => useLocalPreference("pref", "def"));
    expect(result.current[0]).toBe("stored");
  });

  it("responds to storage events", () => {
    const { result } = renderHook(() => useLocalPreference("pref", "def"));
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "pref",
          newValue: JSON.stringify("other"),
        })
      );
    });
    expect(result.current[0]).toBe("other");
  });

  it("syncs updates between hook instances in the same tab", () => {
    const first = renderHook(() => useLocalPreference("pref", "def"));
    const second = renderHook(() => useLocalPreference("pref", "def"));

    act(() => first.result.current[1]("shared"));

    expect(first.result.current[0]).toBe("shared");
    expect(second.result.current[0]).toBe("shared");
  });
});
