import { renderHook } from "@testing-library/react";
import useBodyScrollLock from "@/hooks/useBodyScrollLock";

const setViewport = ({
  clientWidth,
  innerWidth,
}: {
  readonly clientWidth: number;
  readonly innerWidth: number;
}) => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: innerWidth,
  });
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    value: clientWidth,
  });
};

describe("useBodyScrollLock", () => {
  it("releases the body lock after its owner unmounts", () => {
    const lock = renderHook(() => useBodyScrollLock());

    expect(document.body.dataset.seizeBodyScrollLocked).toBe("true");

    lock.unmount();

    expect(document.body.dataset.seizeBodyScrollLocked).toBeUndefined();
  });

  it("keeps a nested scrollbar gap until its last owner unmounts", () => {
    setViewport({ clientWidth: 980, innerWidth: 1000 });
    const firstLock = renderHook(() =>
      useBodyScrollLock({ reserveScrollbarGap: true })
    );

    expect(
      document.body.style.getPropertyValue("--seize-body-scrollbar-gap")
    ).toBe("20px");

    setViewport({ clientWidth: 1000, innerWidth: 1000 });
    const secondLock = renderHook(() =>
      useBodyScrollLock({ reserveScrollbarGap: true })
    );

    firstLock.unmount();

    expect(document.body.dataset.seizeBodyScrollLocked).toBe("true");
    expect(document.body.dataset.seizeBodyScrollbarGap).toBe("true");
    expect(
      document.body.style.getPropertyValue("--seize-body-scrollbar-gap")
    ).toBe("20px");

    secondLock.unmount();

    expect(document.body.dataset.seizeBodyScrollLocked).toBeUndefined();
    expect(document.body.dataset.seizeBodyScrollbarGap).toBeUndefined();
    expect(
      document.body.style.getPropertyValue("--seize-body-scrollbar-gap")
    ).toBe("");
  });

  it("tracks the body lock independently from scrollbar-gap ownership", () => {
    setViewport({ clientWidth: 980, innerWidth: 1000 });
    const bodyLock = renderHook(() => useBodyScrollLock());
    const gapLock = renderHook(() =>
      useBodyScrollLock({ reserveScrollbarGap: true })
    );

    gapLock.unmount();

    expect(document.body.dataset.seizeBodyScrollLocked).toBe("true");
    expect(document.body.dataset.seizeBodyScrollbarGap).toBeUndefined();

    bodyLock.unmount();

    expect(document.body.dataset.seizeBodyScrollLocked).toBeUndefined();
  });
});
