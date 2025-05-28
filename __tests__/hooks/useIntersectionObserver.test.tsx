import { render } from "@testing-library/react";
import React from "react";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";
import { act } from "react-dom/test-utils";

// mock IntersectionObserver
let observe: jest.Mock;
let disconnect: jest.Mock;
let trigger: (entries: any) => void;

beforeEach(() => {
  observe = jest.fn();
  disconnect = jest.fn();
  (global as any).IntersectionObserver = class {
    constructor(cb: any) {
      trigger = cb;
    }
    observe = observe;
    disconnect = disconnect;
  } as any;
});

test("calls onIntersection when element appears", () => {
  const onIntersection = jest.fn();
  function Test() {
    const ref = useIntersectionObserver(onIntersection);
    return <div ref={ref}></div>;
  }
  const { unmount } = render(<Test />);
  expect(observe).toHaveBeenCalled();
  act(() => {
    trigger([{ isIntersecting: true }]);
  });
  expect(onIntersection).toHaveBeenCalledWith(true);
  expect(disconnect).toHaveBeenCalled();
  unmount();
  expect(disconnect).toHaveBeenCalled();
});
