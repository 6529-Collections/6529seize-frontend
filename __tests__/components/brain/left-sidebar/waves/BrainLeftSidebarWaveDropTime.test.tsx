import { act, render } from "@testing-library/react";
import React from "react";
import BrainLeftSidebarWaveDropTime from "@/components/brain/left-sidebar/waves/BrainLeftSidebarWaveDropTime";
import { getTimeAgoShort } from "@/helpers/Helpers";

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

  it("renders time using helper and sets interval", () => {
    (getTimeAgoShort as jest.Mock).mockReturnValue("1m");
    const setSpy = jest.spyOn(global, "setInterval");
    const clearSpy = jest.spyOn(global, "clearInterval");
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
});
