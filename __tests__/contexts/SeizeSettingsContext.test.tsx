import {
  SeizeSettingsProvider,
  useSeizeSettings,
} from "@/contexts/SeizeSettingsContext";
import { SeizeSettingsMode } from "@/types/enums";
import { render, screen, waitFor } from "@testing-library/react";

jest.mock("@/services/6529api", () => ({ fetchUrl: jest.fn() }));
const { fetchUrl } = jest.requireMock("@/services/6529api");

beforeEach(() => {
  fetchUrl.mockReset();
});

test("provides settings and helper", async () => {
  fetchUrl.mockResolvedValue({
    rememes_submission_tdh_threshold: 1,
    all_drops_notifications_subscribers_limit: 2,
    memes_wave_id: "orig",
    curation_wave_id: "orig-curation",
  });

  function Consumer() {
    const { seizeSettings, isMemesWave, isCurationWave } = useSeizeSettings();
    return (
      <div>{`${seizeSettings.memes_wave_id}-${isMemesWave(
        "test-memes-wave-id"
      )}-${seizeSettings.curation_wave_id}-${isCurationWave(
        "test-curation-wave-id"
      )}`}</div>
    );
  }

  render(
    <SeizeSettingsProvider>
      <Consumer />
    </SeizeSettingsProvider>
  );

  await waitFor(() =>
    expect(
      screen.getByText("test-memes-wave-id-true-test-curation-wave-id-true")
    ).toBeInTheDocument()
  );
  expect(fetchUrl).toHaveBeenCalledWith(
    "https://api.test.6529.io/api/settings"
  );
});

test("captures initial load failures without leaking an unhandled rejection", async () => {
  const expectedError = new Error("network down");
  const onUnhandledRejection = jest.fn();
  const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
    event.preventDefault();
    onUnhandledRejection(event);
  };
  const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});

  fetchUrl.mockRejectedValueOnce(expectedError);

  function Consumer() {
    const { isLoaded, loadError } = useSeizeSettings();
    return <div>{`${isLoaded}-${loadError?.message ?? "no-error"}`}</div>;
  }

  globalThis.addEventListener("unhandledrejection", unhandledRejectionHandler);

  try {
    render(
      <SeizeSettingsProvider>
        <Consumer />
      </SeizeSettingsProvider>
    );

    await waitFor(() =>
      expect(screen.getByText("false-network down")).toBeInTheDocument()
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to fetch seize settings",
      expectedError
    );
    expect(onUnhandledRejection).not.toHaveBeenCalled();
  } finally {
    globalThis.removeEventListener(
      "unhandledrejection",
      unhandledRejectionHandler
    );
    consoleErrorSpy.mockRestore();
  }
});

test("can skip the initial fetch", async () => {
  function Consumer() {
    const { isLoaded, loadError, seizeSettings } = useSeizeSettings();
    return (
      <div>
        {`${isLoaded}-${loadError === null}-${seizeSettings.memes_wave_id === null}`}
      </div>
    );
  }

  render(
    <SeizeSettingsProvider mode={SeizeSettingsMode.LOCAL}>
      <Consumer />
    </SeizeSettingsProvider>
  );

  await waitFor(() =>
    expect(screen.getByText("true-true-true")).toBeInTheDocument()
  );
  expect(fetchUrl).not.toHaveBeenCalled();
});

test("hook outside provider throws", () => {
  function CallHook() {
    useSeizeSettings();
    return null;
  }
  expect(() => render(<CallHook />)).toThrow();
});
