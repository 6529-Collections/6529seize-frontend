import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import userEvent from "@testing-library/user-event";
import type { FieldValue } from "@/lib/artwork-documentation/registry";
import DocumentationValueEditor from "@/components/artwork-documentation/DocumentationValueEditor";
import LanguageTagCorrection from "@/components/artwork-documentation/DocumentationLanguageTagCorrection";
import DocumentationSummary from "@/components/artwork-documentation/DocumentationSummary";
import DocumentationRecordValue from "@/components/artwork-documentation/DocumentationRecordValue";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

const narrative = {
  primary_language: "en",
  versions: [
    {
      language: "en",
      text: "The doorway at dawn.",
      authorship: "original",
      approved_by_artist: false,
    },
    {
      language: "fr",
      text: "La porte à l’aube.",
      authorship: "artist_translation",
      approved_by_artist: true,
    },
  ],
};

describe("editorial artwork documentation", () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
    };
  });

  function NarrativeEditor({
    onChange,
  }: {
    readonly onChange: (value: FieldValue) => void;
  }) {
    const [value, setValue] = useState<FieldValue>(narrative);
    return (
      <DocumentationValueEditor
        id="caption"
        label="Caption"
        editor={{ kind: "localized", max: 3000 }}
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange(next);
        }}
        hideLabel
      />
    );
  }

  it("keeps nested object and list labels visible when the outer answer label is supplied", () => {
    const { rerender } = render(
      <DocumentationValueEditor
        id="dimensions"
        label="Dimensions"
        editor={{
          kind: "object",
          fields: { width: { kind: "number" }, height: { kind: "number" } },
        }}
        value={{ width: 6000, height: 4000 }}
        onChange={jest.fn()}
        hideLabel
      />
    );
    for (const label of ["Width in pixels", "Height in pixels"]) {
      expect(screen.getByText(label, { selector: "label" })).not.toHaveClass(
        "tw-sr-only"
      );
    }
    rerender(
      <DocumentationValueEditor
        id="names"
        label="Name"
        editor={{ kind: "list", item: { kind: "text" }, max: 10 }}
        value={["Ari"]}
        onChange={jest.fn()}
        hideLabel
      />
    );
    expect(screen.getByText("Name", { selector: "label" })).not.toHaveClass(
      "tw-sr-only"
    );
  });

  it("applies a typed language correction once and preserves sibling text and review metadata", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<NarrativeEditor onChange={onChange} />);
    await user.click(screen.getByText("Language and translations"));
    await user.selectOptions(screen.getByLabelText("Primary language"), "fr");
    expect(onChange).toHaveBeenLastCalledWith({
      ...narrative,
      primary_language: "fr",
    });
    onChange.mockClear();
    await user.click(
      screen.getAllByRole("button", { name: "Change language" })[0]!
    );
    const modal = screen.getByRole("dialog", { name: "Change language" });
    await user.selectOptions(
      within(modal).getByRole("combobox", { name: "Language" }),
      "__other__"
    );
    const input = within(modal).getByRole("textbox", { name: "Language tag" });
    await user.clear(input);
    await user.type(input, "FR-ca");
    await user.tab();
    expect(onChange).not.toHaveBeenCalled();
    expect(modal).toBeInTheDocument();
    await user.click(
      within(modal).getByRole("button", { name: "Apply language" })
    );
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith({
      ...narrative,
      primary_language: "fr-CA",
      versions: [
        narrative.versions[0],
        { ...narrative.versions[1], language: "fr-CA" },
      ],
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lets artists choose a language by name and keeps an uncommon current language", async () => {
    const user = userEvent.setup();
    const onApply = jest.fn();
    render(
      <LanguageTagCorrection
        language="fr-CA"
        otherLanguages={["en"]}
        onApply={onApply}
        onClose={jest.fn()}
      />
    );
    const language = screen.getByRole("combobox", { name: "Language" });
    expect(language).toHaveValue("fr-CA");
    expect(
      screen.getByRole("option", { name: "Canadian French" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Language tag" })
    ).not.toBeInTheDocument();
    await user.selectOptions(
      language,
      screen.getByRole("option", { name: "Japanese" })
    );
    expect(onApply).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Apply language" }));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenLastCalledWith("ja");
  });

  it("keeps invalid and duplicate corrections visible until fixed or cancelled", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<NarrativeEditor onChange={onChange} />);
    await user.click(screen.getByText("Language and translations"));
    await user.click(
      screen.getAllByRole("button", { name: "Change language" })[0]!
    );
    const modal = screen.getByRole("dialog");
    await user.selectOptions(
      within(modal).getByRole("combobox", { name: "Language" }),
      "__other__"
    );
    const input = within(modal).getByRole("textbox", { name: "Language tag" });
    for (const tag of ["f", "fr"]) {
      await user.clear(input);
      await user.type(input, tag);
      await user.click(
        within(modal).getByRole("button", { name: "Apply language" })
      );
      expect(input).toHaveValue(tag);
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(within(modal).getByRole("alert")).toHaveTextContent(
        "has not been applied"
      );
      expect(onChange).not.toHaveBeenCalled();
    }
    const leave = new Event("beforeunload", { cancelable: true });
    globalThis.dispatchEvent(leave);
    expect(leave.defaultPrevented).toBe(true);
    await user.click(within(modal).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reads dimensions and an explicit empty contributor list without structural labels", () => {
    const { rerender, container } = render(
      <DocumentationRecordValue value={{ width: 6000, height: 4000 }} />
    );
    expect(container).toHaveTextContent("6,000 × 4,000 pixels");
    rerender(
      <DocumentationRecordValue value={{ kind: "none", entries: [] }} />
    );
    expect(container).toHaveTextContent("None");
    expect(screen.queryByText("Entries")).not.toBeInTheDocument();
  });

  it("reads language names while keeping recorded references available in a disclosure", () => {
    const context = documentationFixture();
    context.modules["artwork"]!.answers["title_language"] = {
      status: "provided",
      intended_visibility: "public_record",
      value: "fr",
    } as never;
    context.modules["artwork"]!.answers["instrument_id"] = {
      status: "provided",
      intended_visibility: "public_record",
      value: "preserved-reference-123",
    } as never;
    render(<DocumentationSummary context={context} />);
    expect(screen.getByText("French")).toBeInTheDocument();
    const reference = screen.getByText("preserved-reference-123");
    expect(reference.closest("details")).not.toHaveAttribute("open");
    expect(screen.getByText("Record references")).toBeInTheDocument();
  });

  it("reads supplied history entries as facts without authoring instructions", () => {
    const { rerender, container } = render(
      <DocumentationRecordValue
        value={{
          kind: "entries_supplied",
          entries: [{ title: "An exhibition", year: "2026" }],
        }}
      />
    );
    expect(container).toHaveTextContent("An exhibition");
    expect(container).toHaveTextContent("2026");
    expect(screen.queryByText("Add entries")).toBeNull();
    expect(screen.queryByText("Type")).toBeNull();
    rerender(
      <DocumentationRecordValue
        value={{ kind: "entries_supplied", entries: [] }}
      />
    );
    expect(container).toHaveTextContent("No entries recorded");
    rerender(
      <DocumentationRecordValue
        value={{
          kind: "entries_supplied",
          entries: [],
          explanation: "Still being prepared",
        }}
      />
    );
    expect(container).toHaveTextContent("Entries supplied");
    expect(container).toHaveTextContent("Still being prepared");
    expect(screen.queryByText("Add entries")).toBeNull();
  });

  it("keeps the original account's credit when a translation is selected first", () => {
    const onChange = jest.fn();
    render(
      <DocumentationValueEditor
        id="caption"
        label="Caption"
        editor={{ kind: "localized", max: 3000 }}
        value={{ ...narrative, primary_language: "fr" }}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByText("Language and translations"));
    const original = screen.getByRole("group", { name: "Version 1 · English" });
    expect(
      within(original).getByDisplayValue("The doorway at dawn.")
    ).toHaveAttribute("dir", "auto");
    expect(
      within(original).getByRole("combobox", { name: "Authorship" })
    ).toHaveValue("original");
    expect(screen.getByRole("textbox", { name: "Caption" })).toHaveValue(
      "La porte à l’aube."
    );
    expect(screen.getByRole("textbox", { name: "Caption" })).toHaveAttribute(
      "dir",
      "auto"
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it.each([
    [{ precision: "year", start: "1987" }, "1987"],
    [{ precision: "month", start: "1987-09" }, "September 1987"],
    [
      {
        precision: "range",
        start: "1987-09-11",
        end: "1988",
        approximate: true,
      },
      "Approximately September 11, 1987 – 1988",
    ],
  ])("reads dates without inventing missing precision", (value, expected) => {
    const { container } = render(<DocumentationRecordValue value={value} />);
    expect(container).toHaveTextContent(expected);
  });

  it("edits the primary narrative without dropping translations or review metadata", () => {
    const onChange = jest.fn();
    render(
      <DocumentationValueEditor
        id="caption"
        label="Caption"
        editor={{ kind: "localized", max: 3000 }}
        value={narrative}
        onChange={onChange}
        hideLabel
      />
    );
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: "Caption" }), {
      target: { value: "The doorway after rain." },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      ...narrative,
      versions: [
        { ...narrative.versions[0], text: "The doorway after rain." },
        narrative.versions[1],
      ],
    });
  });

  it("selects an existing primary-language version without rewriting either text", () => {
    const onChange = jest.fn();
    render(
      <DocumentationValueEditor
        id="caption"
        label="Caption"
        editor={{ kind: "localized", max: 3000 }}
        value={narrative}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByText("Language and translations"));
    fireEvent.change(
      screen.getByRole("combobox", { name: "Primary language" }),
      {
        target: { value: "fr" },
      }
    );
    expect(onChange).toHaveBeenLastCalledWith({
      ...narrative,
      primary_language: "fr",
    });
  });

  it("shows the selected language first and retains the other recorded version for reading", () => {
    const context = documentationFixture();
    context.modules["context"]!.answers["caption"] = {
      status: "provided",
      intended_visibility: "public_record",
      value: { ...narrative, primary_language: "fr" },
    } as never;
    render(<DocumentationSummary context={context} />);
    expect(screen.getByText("La porte à l’aube.")).toHaveAttribute(
      "lang",
      "fr"
    );
    expect(screen.getByText("La porte à l’aube.")).toHaveAttribute(
      "dir",
      "auto"
    );
    expect(screen.getByText("The doorway at dawn.")).toHaveAttribute(
      "lang",
      "en"
    );
    expect(screen.getByText("The doorway at dawn.")).toHaveAttribute(
      "dir",
      "auto"
    );
    expect(
      screen.getByText("Reviewed by the artist", { exact: false })
    ).toBeInTheDocument();
  });

  it("does not put server-redacted values into the record heading or body", () => {
    const context = documentationFixture();
    context.modules["artwork"]!.answers["title"] = {
      redacted: true,
      value: "Hidden work title",
    } as never;
    render(<DocumentationSummary context={context} />);
    expect(screen.queryByText("Hidden work title")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Title not yet provided" })
    ).toBeInTheDocument();
  });
});
