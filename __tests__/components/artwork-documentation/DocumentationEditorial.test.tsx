import { fireEvent, render, screen } from "@testing-library/react";
import DocumentationValueEditor from "@/components/artwork-documentation/DocumentationValueEditor";
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
    fireEvent.change(screen.getByLabelText("Primary language"), {
      target: { value: "fr" },
    });
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
    expect(screen.getByText("The doorway at dawn.")).toHaveAttribute(
      "lang",
      "en"
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
