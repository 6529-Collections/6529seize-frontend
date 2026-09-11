import { fireEvent, render, screen } from "@testing-library/react";
import DocumentationValueEditor from "@/components/artwork-documentation/DocumentationValueEditor";
import DocumentationSummary from "@/components/artwork-documentation/DocumentationSummary";
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
