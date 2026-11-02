import QueryClientSetup from "@/components/providers/QueryClientSetup";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import {
  focusManager,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { act, render } from "@testing-library/react";

jest.mock("@capacitor/core", () => ({
  ...jest.requireActual("@capacitor/core"),
  Capacitor: { isNativePlatform: jest.fn(() => true) },
}));
jest.mock("@capacitor/app", () => ({
  App: { addListener: jest.fn(), getState: jest.fn() },
}));

const mockAddListener = App.addListener as jest.Mock;
const request = jest.fn().mockResolvedValue("data");
let sendState: (state: { isActive: boolean }) => void;
let client: QueryClient | undefined;

function PollingQuery() {
  client = useQueryClient();
  useQuery({
    queryKey: ["native-poll"],
    queryFn: request,
    refetchInterval: 1000,
  });
  return null;
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
  jest.mocked(App.getState).mockResolvedValue({ isActive: true });
  mockAddListener.mockImplementation(
    (_event: string, callback: typeof sendState) => {
      sendState = callback;
      return Promise.resolve({
        remove: jest.fn().mockResolvedValue(undefined),
      });
    }
  );
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
});

afterEach(() => {
  client?.clear();
  focusManager.setFocused(undefined);
  jest.useRealTimers();
});

it("pauses interval requests using the native lifecycle even when the document stays visible", async () => {
  const { unmount } = render(
    <QueryClientSetup>
      <PollingQuery />
    </QueryClientSetup>
  );
  await act(async () => {
    await Promise.resolve();
  });
  expect(request).toHaveBeenCalledTimes(1);
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(request).toHaveBeenCalledTimes(2);
  act(() => sendState({ isActive: false }));
  expect(document.visibilityState).toBe("visible");
  expect(focusManager.isFocused()).toBe(false);
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });
  expect(request).toHaveBeenCalledTimes(2);
  act(() => sendState({ isActive: true }));
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(request).toHaveBeenCalledTimes(3);
  unmount();
  expect(focusManager.isFocused()).toBe(true);
});

it("leaves browser focus management unchanged", () => {
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  render(
    <QueryClientSetup>
      <span>Browser</span>
    </QueryClientSetup>
  );
  expect(App.addListener).not.toHaveBeenCalled();
});
