import { act, render } from "@testing-library/react";
import React from "react";
import BrainLeftSidebarWaveDropTime from "@/components/brain/left-sidebar/waves/BrainLeftSidebarWaveDropTime";
import { getTimeAgoShort } from "@/helpers/Helpers";
import { ReadonlyURLSearchParams } from "next/navigation";
import { PhoneNavigationScreenContext } from "@/contexts/PhoneNavigationScreenContext";

jest.mock("@/helpers/Helpers");

describe("BrainLeftSidebarWaveDropTime", () => {
  const setDocumentVisibilityState = (state: DocumentVisibilityState) => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: state,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setDocumentVisibilityState("visible");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("renders time using helper and sets interval", () => {
    (getTimeAgoShort as jest.Mock).mockReturnValue("1m");
    const setSpy = jest.spyOn(globalThis, "setInterval");
    const clearSpy = jest.spyOn(globalThis, "clearInterval");
    const { unmount, getByText } = render(
      <BrainLeftSidebarWaveDropTime time={10} />
    );
    expect(getByText("1m")).toBeInTheDocument();
    expect(setSpy).toHaveBeenCalledWith(expect.any(Function), 60000);
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });

  it("refreshes immediately when the tab becomes visible again or gains focus", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-07T10:00:00.000Z"));
    (getTimeAgoShort as jest.Mock).mockImplementation(
      (_time: number, now?: number) => `${now}`
    );

    render(<BrainLeftSidebarWaveDropTime time={10} />);
    expect(getTimeAgoShort).toHaveBeenLastCalledWith(
      10,
      new Date("2026-04-07T10:00:00.000Z").getTime()
    );

    jest.setSystemTime(new Date("2026-04-07T10:01:00.000Z"));
    act(() => {
      setDocumentVisibilityState("visible");
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(getTimeAgoShort).toHaveBeenLastCalledWith(
      10,
      new Date("2026-04-07T10:01:00.000Z").getTime()
    );

    jest.setSystemTime(new Date("2026-04-07T10:02:00.000Z"));
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(getTimeAgoShort).toHaveBeenLastCalledWith(
      10,
      new Date("2026-04-07T10:02:00.000Z").getTime()
    );

    jest.useRealTimers();
  });

  it("freezes a retained list's timestamps and catches up immediately on return", () => {
    jest.useFakeTimers();
    jest.setSystemTime(100_000);
    (getTimeAgoShort as jest.Mock).mockImplementation(
      (_time: number, now?: number) => `${now}`
    );
    const screen = {
      pathname: "/messages",
      searchParams: new ReadonlyURLSearchParams(""),
    };
    const view = (active: boolean) => (
      <PhoneNavigationScreenContext.Provider value={{ ...screen, active }}>
        <BrainLeftSidebarWaveDropTime time={10} />
      </PhoneNavigationScreenContext.Provider>
    );
    const { rerender, getByText } = render(view(true));
    act(() => jest.advanceTimersByTime(60_000));
    expect(getByText("160000")).toBeInTheDocument();

    rerender(view(false));
    const callsBeforePause = jest.mocked(getTimeAgoShort).mock.calls.length;
    act(() => {
      jest.advanceTimersByTime(180_000);
      window.dispatchEvent(new Event("focus"));
    });
    expect(jest.mocked(getTimeAgoShort).mock.calls).toHaveLength(
      callsBeforePause
    );
    expect(getByText("160000")).toBeInTheDocument();

    rerender(view(true));
    expect(getByText("340000")).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(60_000));
    expect(getByText("400000")).toBeInTheDocument();
  });
});
