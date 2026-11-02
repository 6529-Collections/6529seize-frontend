import { act, renderHook } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import { useUserPageXtdhGrantedListFilters } from "@/components/user/xtdh/user-page-xtdh-granted-list/hooks/useUserPageXtdhGrantedListFilters";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => "/alice/xtdh",
  useRouter: () => ({ push: mockPush }),
  useSearchParams: jest.fn(),
}));

it("returns to Active in one navigation while preserving shared and sort parameters", () => {
  const params = new URLSearchParams(
    "tab=pending&sub=outgoing&address=0xabc&locale=fr-FR&sort=created_at&dir=asc"
  );
  jest
    .mocked(useSearchParams)
    .mockReturnValue(params as ReturnType<typeof useSearchParams>);
  const { result, rerender } = renderHook(useUserPageXtdhGrantedListFilters);
  act(() => result.current.handleTabChange("ACTIVE"));
  expect(mockPush).toHaveBeenCalledTimes(1);
  expect(mockPush).toHaveBeenCalledWith(
    "/alice/xtdh?tab=granted&address=0xabc&locale=fr-FR&sort=created_at&dir=asc",
    { scroll: false }
  );
  params.set("tab", "granted");
  params.delete("sub");
  jest
    .mocked(useSearchParams)
    .mockReturnValue(
      new URLSearchParams(params) as ReturnType<typeof useSearchParams>
    );
  rerender();
  expect(result.current.activeTab).toBe("ACTIVE");
  expect(mockPush).toHaveBeenCalledTimes(1);
});
