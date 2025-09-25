import {
  SeizeSettingsProvider,
  useSeizeSettings,
} from "@/contexts/SeizeSettingsContext";
import { render, screen, waitFor } from "@testing-library/react";

jest.mock("@/services/6529api", () => ({ fetchUrl: jest.fn() }));
const { fetchUrl } = jest.requireMock("@/services/6529api");

test("provides settings and helper", async () => {
  fetchUrl.mockResolvedValue({
    rememes_submission_tdh_threshold: 1,
    all_drops_notifications_subscribers_limit: 2,
    memes_wave_id: "orig",
  });

  function Consumer() {
    const { seizeSettings, isMemesWave } = useSeizeSettings();
    return (
      <div>{`${seizeSettings.memes_wave_id}-${isMemesWave(
        "test-memes-wave-id"
      )}`}</div>
    );
  }

  render(
    <SeizeSettingsProvider>
      <Consumer />
    </SeizeSettingsProvider>
  );

  await waitFor(() =>
    expect(screen.getByText("test-memes-wave-id-true")).toBeInTheDocument()
  );
  expect(fetchUrl).toHaveBeenCalledWith(
    "https://api.test.6529.io/api/settings"
  );
});

test("hook outside provider throws", () => {
  function CallHook() {
    useSeizeSettings();
    return null;
  }
  expect(() => render(<CallHook />)).toThrow();
});
