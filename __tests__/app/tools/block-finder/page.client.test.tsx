import BlockFinderClient from "@/app/tools/block-finder/page.client";
import * as blockFinderHelpers from "@/helpers/block-finder.helpers";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockSetToast = jest.fn();
const mockSetTitle = jest.fn();

const DEFAULT_DATE = "2025-09-26";
const DEFAULT_TIME = "12:00";

const PREDICT_FAILED_TOAST = {
  message: "Couldn’t predict block numbers. Please try again.",
  type: "error",
};

jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({ setTitle: mockSetTitle }),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ setToast: mockSetToast }),
}));

// Public env
jest.mock("@/config/env", () => ({
  publicEnv: {
    ALLOWLIST_API_ENDPOINT: "https://api.example.com",
  },
}));

/**
 * Mock UI building blocks with lightweight, test-friendly controls.
 * Each mock calls the provided setter props exactly as your components would.
 */
jest.mock("@/components/block-picker/BlockPickerDateSelect", () => ({
  __esModule: true,
  default: function MockBlockPickerDateSelect(props: any) {
    return (
      <div>
        <input
          data-testid="date-input"
          type="date"
          value={props.date}
          onChange={(e) => props.setDate(e.target.value)}
        />
        <input
          data-testid="time-input"
          type="time"
          value={props.time}
          onChange={(e) => props.setTime(e.target.value)}
        />
      </div>
    );
  },
}));

jest.mock("@/components/block-picker/BlockPickerTimeWindowSelect", () => ({
  __esModule: true,
  default: function MockBlockPickerTimeWindowSelect(props: any) {
    return (
      <select
        data-testid="timewindow-select"
        value={props.timeWindow}
        onChange={(e) => props.setTimeWindow(e.target.value)}>
        <option value="NONE">NONE</option>
        <option value="ONE_MINUTE">ONE_MINUTE</option>
      </select>
    );
  },
}));

jest.mock("@/components/block-picker/BlockPickerBlockNumberIncludes", () => ({
  __esModule: true,
  default: function MockBlockPickerBlockNumberIncludes(props: any) {
    return (
      <input
        data-testid="includes-input"
        placeholder="comma-separated block numbers"
        disabled={props.disabled}
        value={props.blockNumberIncludes}
        onChange={(e) => props.setBlockNumberIncludes(e.target.value)}
      />
    );
  },
}));

jest.mock("@/components/utils/button/PrimaryButton", () => ({
  __esModule: true,
  default: function MockPrimaryButton(props: any) {
    return (
      <button
        data-testid="submit-btn"
        onClick={props.onClicked}
        disabled={props.disabled}>
        {props.children ?? "Submit"}
      </button>
    );
  },
}));

// Render a small marker that reflects incoming props so we can assert the result.
jest.mock("@/components/block-picker/result/BlockPickerResult", () => ({
  __esModule: true,
  default: function MockBlockPickerResult(props: any) {
    return (
      <div data-testid="result">
        <div data-testid="result-blocknumber">
          {String(props.blocknumber ?? "")}
        </div>
        <div data-testid="result-timestamp">
          {String(props.timestamp ?? "")}
        </div>
        <div data-testid="result-blocks-len">
          {String(props.predictedBlocks?.length ?? 0)}
        </div>
      </div>
    );
  },
}));

/** Utilities */
function setDateAndTime(time = DEFAULT_TIME) {
  fireEvent.change(screen.getByTestId("date-input"), {
    target: { value: DEFAULT_DATE },
  });
  fireEvent.change(screen.getByTestId("time-input"), {
    target: { value: time },
  });
}

// The inputs hold the user's LOCAL wall-clock time, so the expected timestamp is
// the instant of that local date and time in whatever time zone the suite runs in.
function getTimestamp(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes, seconds = 0] = time.split(":").map(Number);
  return new Date(year!, month! - 1, day, hours, minutes, seconds).getTime();
}

describe("tools/block-finder/page.client.tsx (client)", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2025-09-26T12:00:00+03:00"));
    mockSetToast.mockReset();
    mockSetTitle.mockReset();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("sets the page title via TitleContext on mount", () => {
    render(<BlockFinderClient />);
    expect(mockSetTitle).toHaveBeenCalledWith("Block Finder | Tools");
  });

  it("blocks submission when timeWindow != NONE and no block includes provided", async () => {
    render(<BlockFinderClient />);
    setDateAndTime();

    // Select a non-NONE window
    fireEvent.change(screen.getByTestId("timewindow-select"), {
      target: { value: "ONE_MINUTE" },
    });

    fireEvent.click(screen.getByTestId("submit-btn"));

    await waitFor(() => {
      expect(mockSetToast).toHaveBeenCalledWith({
        message: "Add at least one block number when using a time window.",
        type: "error",
      });
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("validates blockNumberIncludes format (rejects non-numeric tokens)", async () => {
    render(<BlockFinderClient />);
    setDateAndTime();
    // keep time window NONE, but provide invalid includes — still validates
    fireEvent.change(screen.getByTestId("includes-input"), {
      target: { value: "1, a, 3" },
    });

    fireEvent.click(screen.getByTestId("submit-btn"));

    await waitFor(() => {
      expect(mockSetToast).toHaveBeenCalledWith({
        message: "Enter block numbers separated by commas.",
        type: "error",
      });
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("hits /other/predict-block-number when no includes are provided", async () => {
    // @ts-expect-error global on jsdom
    global.fetch.mockResolvedValue({
      ok: true,
      text: async () => "12345678",
    });

    render(<BlockFinderClient />);
    setDateAndTime();

    // Ensure time window is NONE
    fireEvent.change(screen.getByTestId("timewindow-select"), {
      target: { value: "NONE" },
    });

    fireEvent.click(screen.getByTestId("submit-btn"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("https://api.example.com/other/predict-block-number");
    expect(init.method).toBe("POST");

    const body = JSON.parse(init.body as string);
    const expectedTimestamp = getTimestamp(DEFAULT_DATE, DEFAULT_TIME);

    expect(body).toEqual({
      timestamp: expectedTimestamp,
    });

    // Result rendered with returned block number
    await waitFor(() => {
      expect(screen.getByTestId("result")).toBeInTheDocument();
      expect(screen.getByTestId("result-blocknumber")).toHaveTextContent(
        "12345678"
      );
      expect(screen.getByTestId("result-blocks-len")).toHaveTextContent("0");
    });
  });

  it("includes the selected seconds in the local timestamp", async () => {
    // @ts-expect-error global on jsdom
    global.fetch.mockResolvedValue({
      ok: true,
      text: async () => "12345678",
    });

    render(<BlockFinderClient />);
    setDateAndTime("12:34:56");

    fireEvent.click(screen.getByTestId("submit-btn"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Let the submit finish so no async work leaks into the next test.
    await waitFor(() => {
      expect(screen.getByTestId("result")).toBeInTheDocument();
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const { timestamp } = JSON.parse(init.body as string);
    const sent = new Date(timestamp);

    expect(timestamp).toBe(getTimestamp(DEFAULT_DATE, "12:34:56"));
    // Local components round-trip, so this holds in every time zone, including
    // those west of UTC where the previous implementation selected the day before.
    expect([
      sent.getFullYear(),
      sent.getMonth(),
      sent.getDate(),
      sent.getHours(),
      sent.getMinutes(),
      sent.getSeconds(),
    ]).toEqual([2025, 8, 26, 12, 34, 56]);
  });

  it("hits /other/predict-block-numbers when includes are provided and window != NONE", async () => {
    const mockResponse = [
      { blockNumberIncludes: 1, count: 2, blockNumbers: [111, 112] },
      { blockNumberIncludes: 7, count: 1, blockNumbers: [777] },
    ];
    // @ts-expect-error global on jsdom
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    render(<BlockFinderClient />);
    setDateAndTime();

    // Choose a non-NONE window (ONE_MINUTE = +60000ms)
    fireEvent.change(screen.getByTestId("timewindow-select"), {
      target: { value: "ONE_MINUTE" },
    });

    // Provide valid includes
    fireEvent.change(screen.getByTestId("includes-input"), {
      target: { value: "1, 5,7" },
    });

    fireEvent.click(screen.getByTestId("submit-btn"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("https://api.example.com/other/predict-block-numbers");
    expect(init.method).toBe("POST");

    const parsed = JSON.parse(init.body as string);
    const min = getTimestamp(DEFAULT_DATE, DEFAULT_TIME);
    const max = min + 60_000; // ONE_MINUTE

    expect(parsed.minTimestamp).toBe(min);
    expect(parsed.maxTimestamp).toBe(max);
    expect(parsed.blockNumberIncludes).toEqual([1, 5, 7]);

    // Result should reflect the array length
    await waitFor(() => {
      expect(screen.getByTestId("result")).toBeInTheDocument();
      expect(screen.getByTestId("result-blocks-len")).toHaveTextContent(
        String(mockResponse.length)
      );
      // In "numbers mode", blocknumber is undefined/empty string
      expect(screen.getByTestId("result-blocknumber")).toHaveTextContent("");
    });
  });

  it("toasts the API error message and shows no result when the request fails", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    // @ts-expect-error global on jsdom
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Specific failure" }),
    });

    render(<BlockFinderClient />);
    setDateAndTime();

    fireEvent.click(screen.getByTestId("submit-btn"));

    await waitFor(() => {
      expect(mockSetToast).toHaveBeenCalledWith({
        message: "Couldn’t predict block numbers: Specific failure",
        type: "error",
      });
    });
    expect(screen.queryByTestId("result")).not.toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledTimes(1);
  });

  it("toasts a generic message when the error response has no usable message", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    // @ts-expect-error global on jsdom
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    });

    render(<BlockFinderClient />);
    setDateAndTime();

    fireEvent.click(screen.getByTestId("submit-btn"));

    await waitFor(() => {
      expect(mockSetToast).toHaveBeenCalledWith(PREDICT_FAILED_TOAST);
    });
    expect(screen.queryByTestId("result")).not.toBeInTheDocument();
  });

  it("toasts a generic message when the request itself fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    // @ts-expect-error global on jsdom
    global.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

    render(<BlockFinderClient />);
    setDateAndTime();

    fireEvent.click(screen.getByTestId("submit-btn"));

    await waitFor(() => {
      expect(mockSetToast).toHaveBeenCalledWith(PREDICT_FAILED_TOAST);
    });
    expect(screen.queryByTestId("result")).not.toBeInTheDocument();
  });

  it("toasts and skips the request when the date and time cannot be parsed", async () => {
    jest
      .spyOn(blockFinderHelpers, "parseLocalDateTime")
      .mockReturnValueOnce(null);

    render(<BlockFinderClient />);
    setDateAndTime();

    fireEvent.click(screen.getByTestId("submit-btn"));

    await waitFor(() => {
      expect(mockSetToast).toHaveBeenCalledWith({
        message: "Enter a valid date and time.",
        type: "error",
      });
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
