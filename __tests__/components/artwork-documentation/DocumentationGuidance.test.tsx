import { fireEvent, render, screen } from "@testing-library/react";
import DocumentationWorkedExample from "@/components/artwork-documentation/DocumentationWorkedExample";
import DocumentationModules from "@/components/artwork-documentation/DocumentationModules";
import DocumentationNarrativeStarter from "@/components/artwork-documentation/DocumentationNarrativeStarter";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import {
  MODULE_FIELDS,
  MODULE_IDS,
  SECTIONS,
} from "@/lib/artwork-documentation/registry";
import { documentationExampleFields } from "@/lib/artwork-documentation/examples";
import { ARTWORK_DOCUMENTATION_EXAMPLE_MESSAGES } from "@/i18n/messages/artwork-documentation-examples";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

function completeProfile() {
  const context = documentationFixture();
  context.profile.interview_instrument = {
    id: "artwork-documentation-artist-interview-v1",
    version: 1,
    language: "en",
    prompts: [{ id: "q5", text: "What does a gate mean in this image?" }],
  };
  context.profile.modules = context.profile.modules.map((module) => ({
    ...module,
    fields: MODULE_FIELDS[module.id].map((field) => ({
      ...context.profile.modules[1]!.fields[0]!,
      id: field.id,
    })),
  }));
  return context;
}

describe("worked artwork documentation examples", () => {
  it("covers all eight modules and every publication field, with a separate review example", () => {
    const context = completeProfile();
    const excluded = new Set([
      "identity.private_contact",
      "files.source_availability",
      "rights.people_depicted",
      "rights.consent_status",
      "rights.consent_asset_ids",
      "rights.identifiability_note",
      "rights.sensitive_context_note",
    ]);
    const fields = SECTIONS.flatMap((section) =>
      documentationExampleFields(context.profile, section)
    );
    expect(new Set(fields.map((entry) => entry.moduleId))).toEqual(
      new Set(MODULE_IDS)
    );
    expect(
      fields.map(({ moduleId, field }) => `${moduleId}.${field.id}`).sort()
    ).toEqual(
      MODULE_IDS.flatMap((moduleId) =>
        MODULE_FIELDS[moduleId].map((field) => `${moduleId}.${field.id}`)
      )
        .filter((path) => !excluded.has(path))
        .sort()
    );
    expect(
      ARTWORK_DOCUMENTATION_EXAMPLE_MESSAGES[
        "artworkDocumentation.examples.review"
      ]
    ).toContain("before finalizing");
  });

  it("opens an empty section's complete fictional example without adding any answers", () => {
    const context = documentationFixture();
    context.modules["artwork"]!.answers = {};
    const before = JSON.stringify(context);
    render(
      <DocumentationWorkedExample
        context={context}
        edits={[]}
        section="artwork"
      />
    );
    expect(
      screen
        .getByText("See a complete example for this section")
        .closest("details")
    ).toHaveAttribute("open");
    expect(screen.getByText("The Space Between")).toBeInTheDocument();
    expect(JSON.stringify(context)).toBe(before);
  });

  it("keeps the example discoverable after a section has an answer, and filters unsupported fields", () => {
    render(
      <DocumentationWorkedExample
        context={documentationFixture()}
        edits={[]}
        section="artwork"
      />
    );
    expect(
      screen
        .getByText("See a complete example for this section")
        .closest("details")
    ).not.toHaveAttribute("open");
    expect(
      screen.queryByText("12 May 2025; exact day.")
    ).not.toBeInTheDocument();
  });

  it("does not attach known interview answers to an unknown pinned instrument", () => {
    const context = completeProfile();
    context.profile.interview_instrument.id = "another-instrument";
    expect(
      documentationExampleFields(context.profile, "preservation").some(
        ({ field }) => field.id === "q5"
      )
    ).toBe(false);
  });

  it("does not offer a factual title or location template for insertion", () => {
    const onChange = jest.fn();
    render(
      <DocumentationModules
        context={documentationFixture()}
        edits={[]}
        section="artwork"
        onChange={onChange}
      />
    );
    expect(
      screen.queryByRole("button", { name: "Adapt this writing structure" })
    ).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps writing structures unsaved until the artist replaces prompts and explicitly applies a schema-valid answer", () => {
    const onApply = jest.fn();
    render(
      <DocumentationNarrativeStarter
        id="caption"
        label="Caption"
        structure="I made [[your own account]]."
        editor={{ kind: "localized", max: 3000 }}
        disabled={false}
        hasAnswer={false}
        validate={() => true}
        onApply={onApply}
      />
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Adapt this writing structure" })
    );
    expect(onApply).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Use my answer" })
    ).toBeDisabled();
    fireEvent.change(
      screen.getByRole("textbox", { name: "Your answer for Caption" }),
      { target: { value: "I photographed the trees after the rain." } }
    );
    expect(
      screen.getByRole("button", { name: "Use my answer" })
    ).toBeDisabled();
    fireEvent.change(
      screen.getByLabelText("Language of your answer (for example, en or es)"),
      { target: { value: "en" } }
    );
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Use my answer" }));
    expect(onApply).toHaveBeenCalledWith({
      primary_language: "en",
      versions: [
        {
          language: "en",
          text: "I photographed the trees after the rain.",
          authorship: "original",
          approved_by_artist: false,
        },
      ],
    });
  });

  it("does not overwrite an answer that arrives while the artist writes a starter", () => {
    const props = {
      id: "description",
      label: "Description",
      structure: "[[My account]]",
      editor: { kind: "text" as const, multiline: true },
      disabled: false,
      hasAnswer: false,
      validate: () => true,
      onApply: jest.fn(),
    };
    const { rerender } = render(<DocumentationNarrativeStarter {...props} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Adapt this writing structure" })
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "My own work." },
    });
    rerender(<DocumentationNarrativeStarter {...props} hasAnswer />);
    expect(screen.getByDisplayValue("My own work.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Use my answer" })
    ).toBeDisabled();
    expect(props.onApply).not.toHaveBeenCalled();
  });

  it.each([
    "I made [[a renamed prompt]].",
    "I made [[an unfinished prompt.",
    "I made an unfinished prompt]].",
  ])("keeps a remaining reserved prompt unsaved: %s", (text) => {
    const onApply = jest.fn();
    render(
      <DocumentationNarrativeStarter
        id="description"
        label="Description"
        structure="I made [[my account]]."
        editor={{ kind: "text", multiline: true }}
        disabled={false}
        hasAnswer={false}
        validate={() => true}
        onApply={onApply}
      />
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Adapt this writing structure" })
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: text },
    });
    const apply = screen.getByRole("button", { name: "Use my answer" });
    expect(apply).toBeDisabled();
    fireEvent.click(apply);
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "I refer to the catalogue [1] in my account." },
    });
    expect(apply).toBeEnabled();
    fireEvent.click(apply);
    expect(onApply).toHaveBeenCalledWith(
      "I refer to the catalogue [1] in my account."
    );
  });

  it("leaves rejected or discarded working text out of the form", () => {
    const onApply = jest.fn();
    render(
      <DocumentationNarrativeStarter
        id="description"
        label="Description"
        structure="[[My account]]"
        editor={{ kind: "text", multiline: true }}
        disabled={false}
        hasAnswer={false}
        validate={() => false}
        onApply={onApply}
      />
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Adapt this writing structure" })
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Too long for this schema." },
    });
    expect(
      screen.getByRole("button", { name: "Use my answer" })
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Discard this working text" })
    );
    expect(onApply).not.toHaveBeenCalled();
  });
});
