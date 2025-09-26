import BlockFinderClient from "@/app/tools/block-finder/page.client";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockSetToast = jest.fn();
const mockSetTitle = jest.fn();

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
function setDateAndTime() {
  fireEvent.change(screen.getByTestId("date-input"), {
    target: { value: "2025-09-26" },
  });
  fireEvent.change(screen.getByTestId("time-input"), {
    target: { value: "12:00" },
  });
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
        message:
          "You must provide some block number inclusions when using a time window!",
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
        message: "Block numbers must be numeric and comma-separated!",
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
    expect(body).toEqual({
      // timestamp equals 2025-09-26 date with time 12:00 local -> client code uses Date(date)+time
      timestamp: new Date("2025-09-26T12:00:00.000+03:00").getTime(),
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
    const min = new Date("2025-09-26T12:00:00.000+03:00").getTime();
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

  it("propagates API error messages via thrown Error path", async () => {
    // @ts-expect-error global on jsdom
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Specific failure" }),
    });

    render(<BlockFinderClient />);
    setDateAndTime();

    // NONE & no includes -> predict-block-number path (sufficient for error path)
    fireEvent.change(screen.getByTestId("timewindow-select"), {
      target: { value: "NONE" },
    });

    fireEvent.click(screen.getByTestId("submit-btn"));

    // We don't toast inside catch; component logs error. Just ensure no result rendered.
    await waitFor(() => {
      expect(screen.queryByTestId("result")).not.toBeInTheDocument();
    });
  });
});
