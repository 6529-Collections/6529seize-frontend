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

  it("lets only one listener handle a request", () => {
    const first = jest.fn(() => true);
    const second = jest.fn(() => true);
    renderHook(() => useSiteSearchRequest(first));
    renderHook(() => useSiteSearchRequest(second));

    act(() => requestSiteSearch());

    expect(first.mock.calls.length + second.mock.calls.length).toBe(1);
  });

  it("passes a request on when a listener cannot open search", () => {
    const unavailable = jest.fn(() => false);
    const available = jest.fn(() => true);
    renderHook(() => useSiteSearchRequest(unavailable));
    renderHook(() => useSiteSearchRequest(available));

    act(() => requestSiteSearch());

    expect(unavailable).toHaveBeenCalledTimes(1);
    expect(available).toHaveBeenCalledTimes(1);
  });
});
