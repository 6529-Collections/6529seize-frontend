import { act, render } from "@testing-library/react";
import {
  __resetDesktopBusyForTests,
  useDropComposerDesktopBusy,
} from "@/services/desktop/desktopBusy";

const setBusy = jest.fn((_busy: boolean, _reason?: string) =>
  Promise.resolve()
);

function Composer({
  uploading,
  sending,
}: {
  readonly uploading: boolean;
  readonly sending: boolean;
}) {
  useDropComposerDesktopBusy(uploading, sending);
  return null;
}

const install = (withSetBusy = true) => {
  Object.defineProperty(window, "api", {
    configurable: true,
    value: { openExternal: jest.fn() },
  });
  Object.defineProperty(window, "nativeAuth", {
    configurable: true,
    value: { sessionLogin: jest.fn() },
  });
  Object.defineProperty(window, "updater", {
    configurable: true,
    value: withSetBusy ? { setBusy } : {},
  });
};

describe("useDropComposerDesktopBusy", () => {
  beforeEach(() => {
    setBusy.mockClear();
    __resetDesktopBusyForTests();
  });
  afterEach(() => {
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");
    Reflect.deleteProperty(window, "updater");
  });

  it("says why while work runs, and clears when it ends", () => {
    install();
    const { rerender } = render(<Composer uploading sending={false} />);
    expect(setBusy).toHaveBeenLastCalledWith(true, "A file is still uploading");
    rerender(<Composer uploading={false} sending />);
    expect(setBusy).toHaveBeenLastCalledWith(
      true,
      "A drop is still being sent"
    );
    rerender(<Composer uploading={false} sending={false} />);
    expect(setBusy).toHaveBeenLastCalledWith(false, undefined);
  });

  it("clears on unmount (navigation) and stays busy while another composer works", () => {
    install();
    const first = render(<Composer uploading sending={false} />);
    const second = render(<Composer uploading={false} sending />);
    expect(setBusy).toHaveBeenCalledTimes(1);
    first.unmount();
    expect(setBusy).toHaveBeenLastCalledWith(
      true,
      "A drop is still being sent"
    );
    second.unmount();
    expect(setBusy).toHaveBeenLastCalledWith(false, undefined);
  });

  it("still clears the app after a refused call (never stays busy by mistake)", async () => {
    install();
    setBusy
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("ipc"));
    const { rerender } = render(<Composer uploading sending />);
    expect(setBusy).toHaveBeenLastCalledWith(true, "A file is still uploading");
    // The upload ends; telling the app about the send is refused.
    rerender(<Composer uploading={false} sending />);
    await act(async () => {
      await Promise.resolve();
    });
    // The send ends: "not busy" is still sent, since what the app holds is
    // unknown after the refusal.
    rerender(<Composer uploading={false} sending={false} />);
    expect(setBusy).toHaveBeenLastCalledWith(false, undefined);
  });

  it("does nothing in builds without setBusy", () => {
    install(false);
    expect(() =>
      render(<Composer uploading sending />).unmount()
    ).not.toThrow();
  });
});
