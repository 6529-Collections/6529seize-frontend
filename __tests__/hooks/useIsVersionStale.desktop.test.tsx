import { act, render, screen } from "@testing-library/react";
import { useIsVersionStale } from "@/hooks/useIsVersionStale";

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

function Probe({ force = false }: { readonly force?: boolean }) {
  return (
    <span>{useIsVersionStale(1000, true, force) ? "stale" : "fresh"}</span>
  );
}

describe("useIsVersionStale in 6529 Desktop", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ announced_version: "new", stale: true }),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");
  });

  const installDesktopShell = () => {
    Object.defineProperty(window, "api", {
      configurable: true,
      value: { openExternal: jest.fn() },
    });
    Object.defineProperty(window, "nativeAuth", {
      configurable: true,
      value: { sessionLogin: jest.fn() },
    });
  };

  it("never polls the website's version or reports it stale", async () => {
    installDesktopShell();
    render(<Probe />);

    await act(async () => {
      jest.advanceTimersByTime(5_000);
    });

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(screen.getByText("fresh")).toBeInTheDocument();
  });

  it("ignores the forced web preview too", async () => {
    installDesktopShell();
    render(<Probe force />);

    await act(async () => undefined);

    expect(screen.getByText("fresh")).toBeInTheDocument();
  });

  it("still polls in a browser", async () => {
    render(<Probe />);

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(globalThis.fetch).toHaveBeenCalled();
  });
});
