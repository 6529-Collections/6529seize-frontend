import type { MouseEventHandler } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DatePickerModal from "@/components/datePickerModal/DatePickerModal";

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: ({
    onClick,
  }: {
    onClick?: MouseEventHandler<SVGSVGElement>;
  }) => <svg data-testid="fa" onClick={onClick} />,
}));

describe("DatePickerModal", () => {
  it("prefills date inputs with initial values", () => {
    const from = new Date("2022-01-01");
    const to = new Date("2022-01-02");
    render(
      <DatePickerModal
        mode="date"
        show
        initial_from_date={from}
        initial_to_date={to}
        onHide={jest.fn()}
      />
    );
    const start = screen.getByPlaceholderText("Start Date") as HTMLInputElement;
    const end = screen.getByPlaceholderText("End Date") as HTMLInputElement;
    expect(start).toHaveValue("2022-01-01");
    expect(end).toHaveValue("2022-01-02");
  });

  it("shows error when start date is after end date", () => {
    render(<DatePickerModal mode="date" show onHide={jest.fn()} />);
    const start = screen.getByPlaceholderText("Start Date");
    const end = screen.getByPlaceholderText("End Date");
    fireEvent.change(start, { target: { value: "2024-01-02" } });
    fireEvent.change(end, { target: { value: "2024-01-01" } });
    fireEvent.click(screen.getByText("Apply"));
    expect(
      screen.getByText("The start date must be before the end date.")
    ).toBeInTheDocument();
  });

  describe("UTC calendar days", () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it("does not report the same day as an inverted range", () => {
      const onApplyDate = jest.fn();
      const onHide = jest.fn();
      // A full ISO timestamp later in the day used to compare greater than a
      // date-only string for the same day and raise a false error.
      render(
        <DatePickerModal
          mode="date"
          show
          initial_from_date={new Date("2024-03-05T15:30:00.000Z")}
          initial_to_date={new Date("2024-03-05T00:00:00.000Z")}
          onApplyDate={onApplyDate}
          onHide={onHide}
        />
      );
      fireEvent.change(screen.getByPlaceholderText("End Date"), {
        target: { value: "2024-03-05" },
      });
      fireEvent.click(screen.getByText("Apply"));

      expect(
        screen.queryByText("The start date must be before the end date.")
      ).not.toBeInTheDocument();
      expect(onApplyDate).toHaveBeenCalledTimes(1);
      expect(onHide).toHaveBeenCalled();
    });

    it("emits each chosen day as 00:00 UTC", () => {
      const onApplyDate = jest.fn();
      render(
        <DatePickerModal
          mode="date"
          show
          onApplyDate={onApplyDate}
          onHide={jest.fn()}
        />
      );
      fireEvent.change(screen.getByPlaceholderText("Start Date"), {
        target: { value: "2024-03-01" },
      });
      fireEvent.change(screen.getByPlaceholderText("End Date"), {
        target: { value: "2024-03-31" },
      });
      fireEvent.click(screen.getByText("Apply"));

      const [from, to] = onApplyDate.mock.calls[0] as [Date, Date];
      expect(from.toISOString()).toBe("2024-03-01T00:00:00.000Z");
      expect(to.toISOString()).toBe("2024-03-31T00:00:00.000Z");
    });

    it("re-emits previously applied UTC-midnight dates unchanged", () => {
      const onApplyDate = jest.fn();
      render(
        <DatePickerModal
          mode="date"
          show
          initial_from_date={new Date("2024-03-01")}
          initial_to_date={new Date("2024-03-31")}
          onApplyDate={onApplyDate}
          onHide={jest.fn()}
        />
      );
      fireEvent.click(screen.getByText("Apply"));

      expect(onApplyDate).toHaveBeenCalledWith(
        new Date("2024-03-01T00:00:00.000Z"),
        new Date("2024-03-31T00:00:00.000Z")
      );
    });

    it.each([
      // Late evening in the Americas is already tomorrow in UTC.
      ["2026-10-12T23:30:00Z", "2026-10-12"],
      ["2026-10-13T00:00:00Z", "2026-10-13"],
      // Early morning in Asia-Pacific is still yesterday in UTC.
      ["2026-10-12T00:30:00Z", "2026-10-12"],
    ])("limits the latest selectable day to today in UTC at %s", (now, max) => {
      jest.useFakeTimers().setSystemTime(new Date(now));
      render(<DatePickerModal mode="date" show onHide={jest.fn()} />);

      expect(screen.getByPlaceholderText("Start Date")).toHaveAttribute(
        "max",
        max
      );
      expect(screen.getByPlaceholderText("End Date")).toHaveAttribute(
        "max",
        max
      );
    });

    describe("applying a date after today in UTC", () => {
      const renderAt = (now: string) => {
        jest.useFakeTimers().setSystemTime(new Date(now));
        const onApplyDate = jest.fn();
        const onHide = jest.fn();
        render(
          <DatePickerModal
            mode="date"
            show
            onApplyDate={onApplyDate}
            onHide={onHide}
          />
        );
        return { onApplyDate, onHide };
      };
      const type = (start: string, end: string) => {
        fireEvent.change(screen.getByPlaceholderText("Start Date"), {
          target: { value: start },
        });
        fireEvent.change(screen.getByPlaceholderText("End Date"), {
          target: { value: end },
        });
      };
      const outOfRange = "Dates cannot be later than today in UTC.";

      it("rejects a typed end date after today", () => {
        const { onApplyDate, onHide } = renderAt("2026-10-12T12:00:00Z");
        type("2026-10-01", "2026-10-13");
        fireEvent.click(screen.getByText("Apply"));

        expect(screen.getByRole("alert")).toHaveTextContent(outOfRange);
        expect(onApplyDate).not.toHaveBeenCalled();
        expect(onHide).not.toHaveBeenCalled();
      });

      it("rejects a typed start date after today", () => {
        const { onApplyDate } = renderAt("2026-10-12T12:00:00Z");
        type("2026-10-13", "2026-10-14");
        fireEvent.click(screen.getByText("Apply"));

        expect(screen.getByRole("alert")).toHaveTextContent(outOfRange);
        expect(onApplyDate).not.toHaveBeenCalled();
      });

      it("rejects a single later date when only one field is filled", () => {
        const { onApplyDate } = renderAt("2026-10-12T12:00:00Z");
        fireEvent.change(screen.getByPlaceholderText("End Date"), {
          target: { value: "2026-12-31" },
        });
        fireEvent.click(screen.getByText("Apply"));

        expect(screen.getByRole("alert")).toHaveTextContent(outOfRange);
        expect(onApplyDate).not.toHaveBeenCalled();
      });

      it("accepts today in UTC, even late in the evening in the Americas", () => {
        // 23:30 UTC is still Oct 12 in UTC but already Oct 13 east of UTC.
        const { onApplyDate, onHide } = renderAt("2026-10-12T23:30:00Z");
        type("2026-10-01", "2026-10-12");
        fireEvent.click(screen.getByText("Apply"));

        expect(screen.queryByRole("alert")).toBeNull();
        expect(onApplyDate).toHaveBeenCalledWith(
          new Date("2026-10-01T00:00:00.000Z"),
          new Date("2026-10-12T00:00:00.000Z")
        );
        expect(onHide).toHaveBeenCalled();
      });

      it("reads the current UTC day when Apply is pressed", () => {
        const { onApplyDate } = renderAt("2026-10-12T23:59:59Z");
        type("2026-10-01", "2026-10-13");
        // Midnight UTC passes while the modal is open.
        jest.setSystemTime(new Date("2026-10-13T00:00:01Z"));
        fireEvent.click(screen.getByText("Apply"));

        expect(onApplyDate).toHaveBeenCalledWith(
          new Date("2026-10-01T00:00:00.000Z"),
          new Date("2026-10-13T00:00:00.000Z")
        );
      });

      it("clears the message once the dates are valid", () => {
        const { onApplyDate } = renderAt("2026-10-12T12:00:00Z");
        type("2026-10-01", "2026-10-13");
        fireEvent.click(screen.getByText("Apply"));
        expect(screen.getByRole("alert")).toBeInTheDocument();

        type("2026-10-01", "2026-10-12");
        fireEvent.click(screen.getByText("Apply"));

        expect(screen.queryByRole("alert")).toBeNull();
        expect(onApplyDate).toHaveBeenCalledTimes(1);
      });
    });

    it("tells people the dates are UTC and links the note to both inputs", () => {
      render(<DatePickerModal mode="date" show onHide={jest.fn()} />);

      const note = screen.getByText(
        "Dates are in UTC. The latest date you can select is today in UTC."
      );
      for (const placeholder of ["Start Date", "End Date"]) {
        expect(
          screen.getByPlaceholderText(placeholder).getAttribute(
            "aria-describedby"
          )
        ).toContain(note.id);
      }
    });

    it("does not show the UTC note for block ranges", () => {
      render(<DatePickerModal mode="block" show onHide={jest.fn()} />);

      expect(screen.queryByText(/Dates are in UTC/)).not.toBeInTheDocument();
    });

    it("does not crash on an invalid initial date", () => {
      render(
        <DatePickerModal
          mode="date"
          show
          initial_from_date={new Date("not a date")}
          initial_to_date={new Date("2024-03-31")}
          onHide={jest.fn()}
        />
      );

      expect(screen.getByPlaceholderText("Start Date")).toHaveValue("");
      expect(screen.getByPlaceholderText("End Date")).toHaveValue("2024-03-31");
    });
  });

  it("shows error for invalid block numbers", () => {
    render(<DatePickerModal mode="block" show onHide={jest.fn()} />);
    const start = screen.getByPlaceholderText("Start Block");
    const end = screen.getByPlaceholderText("End Block");
    fireEvent.change(start, { target: { value: "abc" } });
    fireEvent.change(end, { target: { value: "10" } });
    fireEvent.click(screen.getByText("Apply"));
    expect(
      screen.getByText("Please enter a valid start and end block.")
    ).toBeInTheDocument();
  });

  it("applies valid block numbers", () => {
    const onApply = jest.fn();
    const onHide = jest.fn();
    render(
      <DatePickerModal
        mode="block"
        show
        onApplyBlock={onApply}
        onHide={onHide}
      />
    );
    const start = screen.getByPlaceholderText("Start Block");
    const end = screen.getByPlaceholderText("End Block");
    fireEvent.change(start, { target: { value: "1" } });
    fireEvent.change(end, { target: { value: "2" } });
    fireEvent.click(screen.getByText("Apply"));
    expect(onApply).toHaveBeenCalledWith(1, 2);
    expect(onHide).toHaveBeenCalled();
  });
});
