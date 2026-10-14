import { act, renderHook, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { useNotificationSettingsDialog } from "@/components/waves/specs/wave-notification-settings/useNotificationSettingsDialog";

beforeEach(() => {
  window.history.replaceState({ waveInformation: "about" }, "", "/waves/wave");
});

it("adds one entry and closes it once under Strict Mode", async () => {
  const { result, unmount } = renderHook(
    () => useNotificationSettingsDialog("choices"),
    { wrapper: StrictMode }
  );
  const length = window.history.length;
  act(() => {
    result.current.open();
    result.current.open();
  });
  expect(window.history.length).toBe(length + 1);
  expect(result.current.isOpen).toBe(true);
  act(() => result.current.close());
  unmount();
  await waitFor(() =>
    expect(window.history.state).toEqual({ waveInformation: "about" })
  );
  expect(window.location.pathname).toBe("/waves/wave");
});

it("browser Back dismisses choices and preserves the parent entry", async () => {
  const { result, unmount } = renderHook(() =>
    useNotificationSettingsDialog("choices")
  );
  act(() => result.current.open());
  window.history.back();
  await waitFor(() => expect(result.current.isOpen).toBe(false));
  expect(window.history.state).toEqual({ waveInformation: "about" });
  const back = jest.spyOn(window.history, "back");
  unmount();
  expect(back).not.toHaveBeenCalled();
  back.mockRestore();
});

it("removes the active temporary entry when its layout unmounts", async () => {
  const { result, unmount } = renderHook(() =>
    useNotificationSettingsDialog("choices")
  );
  act(() => result.current.open());
  unmount();
  await waitFor(() =>
    expect(window.history.state).toEqual({ waveInformation: "about" })
  );
  expect(window.location.pathname).toBe("/waves/wave");
});

it.each([
  ["/profiles/creator", { waveNotificationSettings: "choices" }],
  ["/waves/wave", { anotherDialog: "other" }],
])("does not traverse another entry on unmount: %s", (url, state) => {
  const { result, unmount } = renderHook(() =>
    useNotificationSettingsDialog("choices")
  );
  act(() => result.current.open());
  window.history.pushState(state, "", url);
  const back = jest.spyOn(window.history, "back");
  unmount();
  expect(back).not.toHaveBeenCalled();
  expect(window.location.pathname).toBe(url);
  expect(window.history.state).toEqual(state);
  back.mockRestore();
});
