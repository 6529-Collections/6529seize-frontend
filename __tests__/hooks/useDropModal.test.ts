import { act, renderHook } from "@testing-library/react";
import { useDropModal } from "@/hooks/useDropModal";
import { useQuery } from "@tanstack/react-query";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useClosingDropId } from "@/hooks/useClosingDropId";
import { markDropCloseNavigation } from "@/helpers/drop-close-navigation.helpers";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
  keepPreviousData: Symbol("keepPreviousData"),
}));

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock("@/hooks/useClosingDropId", () => ({
  useClosingDropId: jest.fn(),
}));

jest.mock("@/helpers/drop-close-navigation.helpers", () => ({
  markDropCloseNavigation: jest.fn(),
}));

describe("useDropModal", () => {
  const replace = jest.fn();
  const beginClosingDrop = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams("drop=drop-1&foo=bar")
    );
    (usePathname as jest.Mock).mockReturnValue("/alice");
    (useRouter as jest.Mock).mockReturnValue({ replace });
    (useClosingDropId as jest.Mock).mockReturnValue({
      effectiveDropId: "drop-1",
      beginClosingDrop,
    });
  });

  it("opens only when fetched drop id matches effective drop id", () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: { id: "DROP-1" },
      isLoading: false,
    });

    const { result } = renderHook(() => useDropModal());

    expect(result.current.isDropOpen).toBe(true);
    expect(result.current.activeDrop?.id).toBe("DROP-1");
  });

  it("keeps modal closed for stale/mismatched drop payloads", () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: { id: "drop-2" },
      isLoading: false,
    });

    const { result } = renderHook(() => useDropModal());

    expect(result.current.isDropOpen).toBe(false);
    expect(result.current.activeDrop).toBeUndefined();
  });

  it("removes drop param on close and uses router.replace", () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: { id: "drop-1" },
      isLoading: false,
    });

    const { result } = renderHook(() => useDropModal());

    act(() => {
      result.current.onDropClose();
    });

    expect(beginClosingDrop).toHaveBeenCalledWith("drop-1");
    expect(markDropCloseNavigation).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/alice?foo=bar", { scroll: false });
  });
});
