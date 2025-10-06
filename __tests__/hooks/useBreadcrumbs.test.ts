import { renderHook } from "@testing-library/react";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock("@tanstack/react-query", () => ({ useQuery: jest.fn() }));

const mockUsePathname = usePathname as jest.Mock;
const mockUseSearchParams = useSearchParams as jest.Mock;
const mockUseQuery = useQuery as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useBreadcrumbs", () => {
  it("builds static breadcrumbs for a simple path", () => {
    mockUsePathname.mockReturnValue("/about/mission");
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    mockUseQuery.mockReturnValue({ data: null, isLoading: false });

    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current).toEqual([
      { display: "Home", href: "/" },
      { display: "About", href: "/about" },
      { display: "Mission" },
    ]);
  });

  it("builds dynamic breadcrumbs using fetched data", () => {
    mockUsePathname.mockReturnValue("/the-memes/42");
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    mockUseQuery.mockReturnValue({
      data: { name: "Meme 42" },
      isLoading: false,
    });

    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current).toEqual([
      { display: "Home", href: "/" },
      { display: "The Memes", href: "/the-memes" },
      { display: "Meme 42" },
    ]);
  });
});
