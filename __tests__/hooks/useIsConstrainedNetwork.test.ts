import { act, renderHook } from "@testing-library/react";
import useIsConstrainedNetwork from "@/hooks/useIsConstrainedNetwork";

type FakeConnection = EventTarget & {
  saveData?: boolean;
  type?: string;
  effectiveType?: string;
};

const setConnection = (connection: FakeConnection | undefined) => {
  Object.defineProperty(globalThis.navigator, "connection", {
    configurable: true,
    value: connection,
  });
};

const makeConnection = (values: Partial<FakeConnection>): FakeConnection =>
  Object.assign(new EventTarget(), values);

describe("useIsConstrainedNetwork", () => {
  afterEach(() => setConnection(undefined));

  it("is false when the browser has no Network Information API", () => {
    setConnection(undefined);
    const { result } = renderHook(() => useIsConstrainedNetwork());
    expect(result.current).toBe(false);
  });

  it.each([
    [{ saveData: true, type: "wifi", effectiveType: "4g" }, true],
    [{ type: "cellular", effectiveType: "4g" }, true],
    [{ type: "wifi", effectiveType: "slow-2g" }, true],
    [{ type: "wifi", effectiveType: "3g" }, true],
    [{ type: "wifi", effectiveType: "4g", saveData: false }, false],
    [{ type: "ethernet" }, false],
  ])("classifies %o as %s", (values, expected) => {
    setConnection(makeConnection(values));
    const { result } = renderHook(() => useIsConstrainedNetwork());
    expect(result.current).toBe(expected);
  });

  it("updates when the connection changes", () => {
    const connection = makeConnection({ type: "wifi", effectiveType: "4g" });
    setConnection(connection);
    const { result } = renderHook(() => useIsConstrainedNetwork());
    expect(result.current).toBe(false);

    act(() => {
      connection.type = "cellular";
      connection.dispatchEvent(new Event("change"));
    });

    expect(result.current).toBe(true);
  });
});
