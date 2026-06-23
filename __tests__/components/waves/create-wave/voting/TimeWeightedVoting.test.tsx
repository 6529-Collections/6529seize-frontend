import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TimeWeightedVoting from "@/components/waves/create-wave/voting/TimeWeightedVoting";

const renderComponent = (
  config: {
    enabled: boolean;
    averagingInterval: number;
    averagingIntervalUnit: "minutes" | "hours";
  },
  onChange = jest.fn(),
  errorMessage?: string
) =>
  render(
    <TimeWeightedVoting
      config={config}
      errorMessage={errorMessage}
      onChange={onChange}
    />
  );

describe("TimeWeightedVoting", () => {
  const baseConfig = {
    enabled: true,
    averagingInterval: 60,
    averagingIntervalUnit: "minutes" as const,
  };

  it("toggles enabled state", async () => {
    const onChange = jest.fn();
    renderComponent(
      {
        ...baseConfig,
        enabled: false,
        averagingIntervalUnit: "minutes" as const,
      },
      onChange
    );
    await userEvent.click(screen.getByTestId("time-weighted-toggle"));
    expect(onChange).toHaveBeenCalledWith({
      averagingInterval: 60,
      enabled: true,
      averagingIntervalUnit: "minutes",
    });
  });

  it("caps interval at maximum value", async () => {
    const onChange = jest.fn();
    renderComponent(
      {
        enabled: true,
        averagingInterval: 1200,
        averagingIntervalUnit: "minutes" as const,
      },
      onChange
    );
    const input = screen.getByTestId(
      "averaging-interval-input"
    ) as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, "2000");
    expect(onChange).toHaveBeenLastCalledWith({
      enabled: true,
      averagingInterval: 1440,
      averagingIntervalUnit: "minutes",
    });
    expect(input.value).toBe("1440");
  });

  it("renders interval controls in a setting card", () => {
    renderComponent(baseConfig);

    const setting = screen.getByTestId("averaging-interval-setting");
    const input = screen.getByLabelText("Averaging Interval");
    const unitSelect = screen.getByLabelText("Averaging interval time unit");

    expect(setting).toContainElement(input);
    expect(setting).toContainElement(unitSelect);
    expect(setting).toHaveTextContent(
      "The time period over which votes are averaged."
    );
  });

  it("keeps the toggle and updates the interval in default mode", async () => {
    const onChange = jest.fn();
    renderComponent(baseConfig, onChange);

    expect(screen.getByTestId("time-weighted-toggle")).toBeInTheDocument();

    const input = screen.getByTestId(
      "averaging-interval-input"
    ) as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, "30");

    expect(onChange).toHaveBeenLastCalledWith({
      enabled: true,
      averagingInterval: 30,
      averagingIntervalUnit: "minutes",
    });
  });

  it("accepts valid whole-number interval values", async () => {
    const onChange = jest.fn();
    renderComponent(baseConfig, onChange);

    const input = screen.getByTestId(
      "averaging-interval-input"
    ) as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, "10");

    expect(input.value).toBe("10");
    expect(onChange).toHaveBeenLastCalledWith({
      enabled: true,
      averagingInterval: 10,
      averagingIntervalUnit: "minutes",
    });
  });

  it("rejects pasted interval text that is not only digits", async () => {
    const onChange = jest.fn();
    renderComponent(baseConfig, onChange);

    const input = screen.getByTestId(
      "averaging-interval-input"
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "" } });
    onChange.mockClear();
    fireEvent.change(input, { target: { value: "10abc" } });

    expect(input.value).toBe("");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps empty interval input editable and restores the minimum on blur", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderComponent(baseConfig, onChange);

    const input = screen.getByTestId(
      "averaging-interval-input"
    ) as HTMLInputElement;
    await user.clear(input);

    expect(input.value).toBe("");
    expect(onChange).not.toHaveBeenCalled();

    await user.tab();

    expect(input.value).toBe("5");
    expect(onChange).toHaveBeenCalledWith({
      enabled: true,
      averagingInterval: 5,
      averagingIntervalUnit: "minutes",
    });
  });

  it("changes unit and converts value", async () => {
    const onChange = jest.fn();
    renderComponent(baseConfig, onChange);
    await userEvent.selectOptions(screen.getByTestId("time-unit-selector"), [
      "hours",
    ]);
    expect(onChange).toHaveBeenCalledWith({
      enabled: true,
      averagingInterval: 1,
      averagingIntervalUnit: "hours",
    });
    expect(
      (screen.getByTestId("averaging-interval-input") as HTMLInputElement).value
    ).toBe("1");
  });

  it("does not render input when disabled", () => {
    renderComponent({
      enabled: false,
      averagingInterval: 60,
      averagingIntervalUnit: "minutes" as const,
    });
    expect(screen.queryByTestId("averaging-interval-input")).toBeNull();
  });

  it("renders interval input without toggle when toggle is hidden", () => {
    render(
      <TimeWeightedVoting
        config={{
          enabled: false,
          averagingInterval: 60,
          averagingIntervalUnit: "minutes" as const,
        }}
        onChange={jest.fn()}
        showToggle={false}
      />
    );

    expect(screen.queryByTestId("time-weighted-toggle")).toBeNull();
    expect(screen.getByTestId("averaging-interval-input")).toBeInTheDocument();
    expect(screen.getByTestId("time-weighted-voting")).not.toHaveClass(
      "tw-border-t"
    );
  });

  it("shows validation error for low interval", () => {
    renderComponent({
      enabled: true,
      averagingInterval: 2,
      averagingIntervalUnit: "minutes" as const,
    });
    const setting = screen.getByTestId("averaging-interval-setting");
    const input = screen.getByTestId("averaging-interval-input");
    expect(setting).toHaveTextContent("Must be at least 5 minutes");
    expect(setting).toHaveClass("tw-border-error");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("shows external validation error beside the interval input", () => {
    const durationError =
      "This interval is longer than the wave duration. Choose a shorter interval, extend the wave end date, or clear the end date.";
    renderComponent(baseConfig, jest.fn(), durationError);
    expect(screen.getByTestId("averaging-interval-setting")).toHaveTextContent(
      durationError
    );
    expect(screen.getByTestId("averaging-interval-input")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(screen.queryByTestId("validation-error")).toBeNull();
    expect(screen.queryByTestId("general-error")).toBeNull();
  });
});
