import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { WaveDropsReverseContainer } from "@/components/waves/drops/WaveDropsReverseContainer";
import { useIntersectionObserver } from "@/hooks/scroll/useIntersectionObserver";
import { editSlice } from "@/store/editSlice";

jest.mock("@/hooks/scroll/useIntersectionObserver");

const mockUseIntersectionObserver = useIntersectionObserver as jest.Mock;

const createTestStore = () =>
  configureStore({
    reducer: {
      edit: editSlice.reducer,
    },
  });

function setup() {
  const onTopIntersection = jest.fn();
  const store = createTestStore();

  const utils = render(
    <Provider store={store}>
      <WaveDropsReverseContainer
        ref={React.createRef()}
        onTopIntersection={onTopIntersection}
        isFetchingNextPage={false}
        hasNextPage={true}
      >
        <div>child</div>
      </WaveDropsReverseContainer>
    </Provider>
  );
  return { ...utils, onTopIntersection };
}

describe("WaveDropsReverseContainer", () => {
  beforeEach(() => {
    mockUseIntersectionObserver.mockImplementation((ref, opts, cb) => {
      cb({ isIntersecting: true } as any);
    });
    jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: any) => {
        cb();
        return 1 as any;
      });
  });

  it("calls onTopIntersection when sentinel visible", () => {
    const { onTopIntersection } = setup();
    expect(onTopIntersection).toHaveBeenCalled();
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
    const store = createTestStore();
    const onTopIntersection = jest.fn();
    const callbackRef = jest.fn();

    const { rerender, unmount } = render(
      <Provider store={store}>
        <WaveDropsReverseContainer
          ref={callbackRef}
          onTopIntersection={onTopIntersection}
          isFetchingNextPage={false}
          hasNextPage={true}
        >
          <div>child</div>
        </WaveDropsReverseContainer>
      </Provider>
    );

    const attachedCalls = () =>
      callbackRef.mock.calls.filter(([instance]) => instance !== null);
    const detachedCalls = () =>
      callbackRef.mock.calls.filter(([instance]) => instance === null);

    expect(attachedCalls()).toHaveLength(1);
    expect(detachedCalls()).toHaveLength(0);

    rerender(
      <Provider store={store}>
        <WaveDropsReverseContainer
          ref={callbackRef}
          onTopIntersection={onTopIntersection}
          isFetchingNextPage={true}
          hasNextPage={true}
        >
          <div>child</div>
        </WaveDropsReverseContainer>
      </Provider>
    );

    rerender(
      <Provider store={store}>
        <WaveDropsReverseContainer
          ref={callbackRef}
          onTopIntersection={onTopIntersection}
          isFetchingNextPage={false}
          hasNextPage={true}
        >
          <div>child</div>
        </WaveDropsReverseContainer>
      </Provider>
    );

    expect(attachedCalls()).toHaveLength(1);
    expect(detachedCalls()).toHaveLength(0);

    unmount();

    expect(detachedCalls()).toHaveLength(1);
  });
});
