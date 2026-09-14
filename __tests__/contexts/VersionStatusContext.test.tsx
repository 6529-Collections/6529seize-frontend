import {
  VersionStatusProvider,
  useVersionStatus,
} from "@/contexts/VersionStatusContext";
import { act, render, screen } from "@testing-library/react";

function Consumer({ name }: { readonly name: string }) {
  const stale = useVersionStatus();
  return <span data-testid={name}>{stale ? "update" : "current"}</span>;
}

describe("shared version status", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.history.replaceState(null, "", "/");
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue({ json: async () => ({ stale: true }) });
  });

  afterEach(() => jest.useRealTimers());

  it("shares one poll between consumers and clears the update after versions match", async () => {
    const { unmount } = render(
      <VersionStatusProvider>
        <Consumer name="toast" />
        <Consumer name="pull" />
      </VersionStatusProvider>
    );
    await act(async () => {});
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("toast")).toHaveTextContent("update");
    expect(screen.getByTestId("pull")).toHaveTextContent("update");
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ stale: false }),
    });
    await act(async () => {
      jest.advanceTimersByTime(120_000);
    });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("toast")).toHaveTextContent("current");
    expect(screen.getByTestId("pull")).toHaveTextContent("current");
    unmount();
    act(() => {
      jest.advanceTimersByTime(120_000);
    });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("does not check or offer updates when the provider is disabled", async () => {
    globalThis.history.replaceState(null, "", "/?showNewVersionToast=true");
    render(
      <VersionStatusProvider enabled={false}>
        <Consumer name="pull" />
      </VersionStatusProvider>
    );
    await act(async () => {
      jest.advanceTimersByTime(120_000);
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(screen.getByTestId("pull")).toHaveTextContent("current");
  });
});
