import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { WaveDropsReverseContainer } from "@/components/waves/drops/WaveDropsReverseContainer";
import { useIntersectionObserver } from "@/hooks/scroll/useIntersectionObserver";

jest.mock("@/hooks/scroll/useIntersectionObserver");

const mockUseIntersectionObserver =
  useIntersectionObserver as jest.MockedFunction<
    typeof useIntersectionObserver
  >;

function setup({ ref = React.createRef<HTMLDivElement>() } = {}) {
  const onTopIntersection = jest.fn();

  const utils = render(
    <WaveDropsReverseContainer
      ref={ref}
      onTopIntersection={onTopIntersection}
      isFetchingNextPage={false}
      hasNextPage={true}
    >
      <div>child</div>
    </WaveDropsReverseContainer>
  );
  return { ...utils, onTopIntersection };
}

describe("WaveDropsReverseContainer", () => {
  beforeEach(() => {
    mockUseIntersectionObserver.mockReset();
  });

  it("rebinds the observer after the scroll root mounts", () => {
    const { container, onTopIntersection } = setup();

    expect(
      mockUseIntersectionObserver.mock.calls.length
    ).toBeGreaterThanOrEqual(2);

    const [, firstOptions, , firstEnabled] =
      mockUseIntersectionObserver.mock.calls[0]!;
    const [, lastOptions, lastCallback, lastEnabled] =
      mockUseIntersectionObserver.mock.calls.at(-1)!;
    const scrollDiv = container.firstChild as HTMLElement;

    expect(firstOptions.root).toBeNull();
    expect(firstEnabled).toBe(false);
    expect(lastOptions.root).toBe(scrollDiv);
    expect(lastEnabled).toBe(true);

    lastCallback({ isIntersecting: true } as IntersectionObserverEntry);

    expect(onTopIntersection).toHaveBeenCalledTimes(1);
  });

  it("allows scrolling without attaching container-level callbacks", () => {
    const { container } = setup();
    const scrollDiv = container.firstChild as HTMLElement;
    Object.defineProperty(scrollDiv, "scrollTop", {
      value: -10,
      writable: true,
    });
    expect(() => fireEvent.scroll(scrollDiv)).not.toThrow();
  });

  it("keeps callback ref stable across rerenders and only detaches on unmount", () => {
    const onTopIntersection = jest.fn();
    const callbackRef = jest.fn();

    const { rerender, unmount } = render(
      <WaveDropsReverseContainer
        ref={callbackRef}
        onTopIntersection={onTopIntersection}
        isFetchingNextPage={false}
        hasNextPage={true}
      >
        <div>child</div>
      </WaveDropsReverseContainer>
    );

    const attachedCalls = () =>
      callbackRef.mock.calls.filter(([instance]) => instance !== null);
    const detachedCalls = () =>
      callbackRef.mock.calls.filter(([instance]) => instance === null);

    expect(attachedCalls()).toHaveLength(1);
    expect(detachedCalls()).toHaveLength(0);

    rerender(
      <WaveDropsReverseContainer
        ref={callbackRef}
        onTopIntersection={onTopIntersection}
        isFetchingNextPage={true}
        hasNextPage={true}
      >
        <div>child</div>
      </WaveDropsReverseContainer>
    );

    rerender(
      <WaveDropsReverseContainer
        ref={callbackRef}
        onTopIntersection={onTopIntersection}
        isFetchingNextPage={false}
        hasNextPage={true}
      >
        <div>child</div>
      </WaveDropsReverseContainer>
    );

    expect(attachedCalls()).toHaveLength(1);
    expect(detachedCalls()).toHaveLength(0);

    unmount();

    expect(detachedCalls()).toHaveLength(1);
  });
});
