import { render, screen, waitFor } from "@testing-library/react";
import {
  SeizeSettingsProvider,
  useSeizeSettings,
} from "../../contexts/SeizeSettingsContext";

jest.mock("../../services/6529api", () => ({ fetchUrl: jest.fn() }));
const { fetchUrl } = jest.requireMock("../../services/6529api");

test("provides settings and helper", async () => {
  process.env.API_ENDPOINT = "https://test.6529.io";
  process.env.DEV_MODE_MEMES_WAVE_ID = "123";
  fetchUrl.mockResolvedValue({
    rememes_submission_tdh_threshold: 1,
    all_drops_notifications_subscribers_limit: 2,
    memes_wave_id: "orig",
  });

  function Consumer() {
    const { seizeSettings, isMemesWave } = useSeizeSettings();
    return <div>{`${seizeSettings.memes_wave_id}-${isMemesWave("123")}`}</div>;
  }

  render(
    <SeizeSettingsProvider>
      <Consumer />
    </SeizeSettingsProvider>
  );

  await waitFor(() => expect(screen.getByText("123-true")).toBeInTheDocument());
  expect(fetchUrl).toHaveBeenCalledWith("https://test.6529.io/api/settings");
});

test("hook outside provider throws", () => {
  function CallHook() {
    useSeizeSettings();
    return null;
  }
  expect(() => render(<CallHook />)).toThrow();
});
