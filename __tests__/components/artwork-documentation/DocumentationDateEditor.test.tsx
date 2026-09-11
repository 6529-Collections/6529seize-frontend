import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import DocumentationValueEditor from "@/components/artwork-documentation/DocumentationValueEditor";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { SUPPORTED_LOCALES } from "@/i18n/locales";
import type { FieldValue } from "@/lib/artwork-documentation/registry";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: jest.fn(() => "en-US"),
}));

function DateEditor({
  initialValue,
  onChange,
}: {
  readonly initialValue: FieldValue;
  readonly onChange: (value: FieldValue) => void;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <>
      <p id="date-help">Use the date the work was made.</p>
      <DocumentationValueEditor
        id="capture-date"
        label="Capture date"
        editor={{ kind: "date" }}
        value={value}
        describedBy="date-help"
        onChange={(next) => {
          setValue(next);
          onChange(next);
        }}
      />
    </>
  );
}

describe("date entry guidance", () => {
  beforeEach(() => {
    jest.mocked(useBrowserLocale).mockReturnValue("en-US");
  });

  it.each(SUPPORTED_LOCALES)(
    "keeps single-date formats visible and associated with populated inputs in %s",
    (locale) => {
      jest.mocked(useBrowserLocale).mockReturnValue(locale);
      const onChange = jest.fn();
      render(
        <>
          <p id="date-help">Use the date the work was made.</p>
          {[
            { precision: "year", start: "1987", label: "Year", format: "YYYY" },
            {
              precision: "month",
              start: "1987-09",
              label: "Year and month",
              format: "YYYY-MM",
            },
            {
              precision: "day",
              start: "1987-09-11",
              label: "Date",
              format: "YYYY-MM-DD",
            },
          ].map(({ precision, start }) => (
            <DocumentationValueEditor
              key={precision}
              id={`capture-${precision}`}
              label="Capture date"
              editor={{ kind: "date" }}
              value={{ precision, start }}
              describedBy="date-help"
              onChange={onChange}
            />
          ))}
        </>
      );
      for (const [label, format, value] of [
        ["Year", "YYYY", "1987"],
        ["Year and month", "YYYY-MM", "1987-09"],
        ["Date", "YYYY-MM-DD", "1987-09-11"],
      ]) {
        const input = screen.getByRole("textbox", { name: label });
        const hint = screen.getByText(`Use the format ${format}.`);
        expect(input).toHaveValue(value);
        expect(hint).toBeVisible();
        expect(input).toHaveAccessibleDescription(
          `Use the date the work was made. Use the format ${format}.`
        );
        expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(
          hint.id
        );
        expect(document.querySelectorAll(`[id="${hint.id}"]`)).toHaveLength(1);
      }
      expect(onChange).not.toHaveBeenCalled();
    }
  );

  it("updates range guidance without rewriting dates and removes a cleared precision or endpoint", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const initialValue = {
      precision: "range",
      endpoint_precision: "day",
      start: "1987-09-11",
      end: "1988-10-12",
      approximate: true,
    };
    render(<DateEditor initialValue={initialValue} onChange={onChange} />);
    const from = screen.getByRole("textbox", { name: "From" });
    const to = screen.getByRole("textbox", { name: "To" });
    await user.clear(from);
    await user.type(from, "1987-09-12");
    expect(onChange).toHaveBeenLastCalledWith({
      ...initialValue,
      start: "1987-09-12",
    });
    expect(screen.getByText("Use the format YYYY-MM-DD.")).toBeVisible();
    for (const input of [from, to]) {
      expect(input).toHaveAccessibleDescription(
        "Use the date the work was made. Use the format YYYY-MM-DD."
      );
    }
    const precision = screen.getByRole("combobox", { name: "Range precision" });
    await user.selectOptions(precision, "month");
    expect(from).toHaveValue("1987-09-12");
    expect(to).toHaveValue("1988-10-12");
    for (const input of [from, to]) {
      expect(input).toHaveAccessibleDescription(
        "Use the date the work was made. Use the format YYYY-MM."
      );
    }
    await user.selectOptions(precision, "");
    expect(onChange).toHaveBeenLastCalledWith({
      precision: "range",
      start: "1987-09-12",
      end: "1988-10-12",
      approximate: true,
    });
    expect(precision).toHaveValue("");
    expect(screen.getByText("Use the format YYYY-MM-DD.")).toBeVisible();
    expect(from).toHaveAttribute("placeholder", "YYYY-MM-DD");
    await user.clear(to);
    expect(onChange).toHaveBeenLastCalledWith({
      precision: "range",
      start: "1987-09-12",
      approximate: true,
    });
    await user.selectOptions(precision, "day");
    await user.type(to, "1989-01-01");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "How precisely can you date it?" }),
      "year"
    );
    expect(onChange).toHaveBeenLastCalledWith({
      precision: "year",
      start: "1987-09-12",
      approximate: true,
    });
    expect(
      screen.queryByRole("textbox", { name: "To" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Year" })
    ).toHaveAccessibleDescription(
      "Use the date the work was made. Use the format YYYY."
    );
  });

  it.each(["", "unsupported"])(
    "keeps valid format guidance when a loaded range has endpoint precision %j",
    (endpointPrecision) => {
      const onChange = jest.fn();
      render(
        <DateEditor
          initialValue={{
            precision: "range",
            endpoint_precision: endpointPrecision,
          }}
          onChange={onChange}
        />
      );
      for (const label of ["From", "To"]) {
        expect(
          screen.getByRole("textbox", { name: label })
        ).toHaveAccessibleDescription(
          "Use the date the work was made. Use the format YYYY-MM-DD."
        );
      }
      expect(screen.getByText("Use the format YYYY-MM-DD.")).toBeVisible();
      expect(onChange).not.toHaveBeenCalled();
    }
  );
});
