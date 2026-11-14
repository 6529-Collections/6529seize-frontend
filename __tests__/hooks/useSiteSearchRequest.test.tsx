import { act, renderHook } from "@testing-library/react";
import {
  requestSiteSearch,
  useSiteSearchRequest,
} from "@/hooks/useSiteSearchRequest";

describe("useSiteSearchRequest", () => {
  it("calls the latest handler for each request and stops after unmount", () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender, unmount } = renderHook(
      ({ onRequest }) => useSiteSearchRequest(onRequest),
      { initialProps: { onRequest: first } }
    );

    act(() => requestSiteSearch());
    rerender({ onRequest: second });
    act(() => requestSiteSearch());
    unmount();
    act(() => requestSiteSearch());

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});
