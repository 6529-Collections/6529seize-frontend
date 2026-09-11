import { fireEvent, render, screen, within } from "@testing-library/react";
import DocumentationValueEditor from "@/components/artwork-documentation/DocumentationValueEditor";
import DocumentationModules from "@/components/artwork-documentation/DocumentationModules";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import type { ApiArtworkDocumentationOperation } from "@/generated/models/ApiArtworkDocumentationOperation";
import type { PendingEdit } from "@/lib/artwork-documentation/draft-controller";
import { validDocumentationOperation } from "@/lib/artwork-documentation/validation";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

describe("artwork documentation modules", () => {
  it("associates a nested Label with its input rather than the surrounding field heading", () => {
    const context = documentationFixture();
    const artwork = context.profile.modules.find(
      (module) => module.id === "artwork"
    )!;
    const rights = context.profile.modules.find(
      (module) => module.id === "rights"
    )!;
    rights.fields = [
      {
        ...artwork.fields[0]!,
        id: "intended_license",
        value_schema: {
          type: "object",
          properties: { uri: { type: "string" }, label: { type: "string" } },
        } as never,
      },
    ];
    context.modules["rights"]!.answers["intended_license"] = {
      status: "provided",
      intended_visibility: "public_record",
      value: {
        uri: "https://creativecommons.org/publicdomain/zero/1.0/",
        label: "CC0 1.0",
      },
    } as never;
    const { rerender } = render(
      <DocumentationModules
        context={context}
        edits={[]}
        section="rights"
        onChange={jest.fn()}
      />
    );
    const field = screen.getByRole("region", {
      name: "Intended artwork license",
    });
    const input = within(field).getByRole<HTMLInputElement>("textbox", {
      name: "Label",
    });
    expect(input.labels).toHaveLength(1);
    expect(input.labels?.[0]?.control).toBe(input);
    expect(document.getElementById(input.id)).toBe(input);
    expect(
      document.getElementById(field.getAttribute("aria-labelledby")!)
    ).toBe(
      within(field).getByRole("heading", { name: "Intended artwork license" })
    );

    rerender(
      <DocumentationModules
        context={context}
        edits={[]}
        section="rights"
        readOnly
        onChange={jest.fn()}
      />
    );
    const readOnlyField = screen.getByRole("region", {
      name: "Intended artwork license",
    });
    expect(
      document.getElementById(readOnlyField.getAttribute("aria-labelledby")!)
    ).toBe(
      within(readOnlyField).getByRole("heading", {
        name: "Intended artwork license",
      })
    );
    expect(within(readOnlyField).queryByRole("textbox")).toBeNull();
  });
  it("asks for a replacement reason only while a different confirmed final file is selected", () => {
    const context = documentationFixture();
    context.latest_revision_id = "confirmed-revision";
    const artwork = context.profile.modules.find(
      (module) => module.id === "artwork"
    )!;
    artwork.fields.push({ ...artwork.fields[0]!, id: "canonical_asset_id" });
    context.modules["artwork"]!.answers["canonical_asset_id"] = {
      status: "provided",
      value: "original-file",
      intended_visibility: "public_record",
    } as never;
    const assets = [
      { id: "original-file", label: "Confirmed photograph" },
      { id: "replacement-file", label: "Revised photograph" },
    ];
    context.asset_links = assets.map((asset) => ({
      asset_id: asset.id,
      role: "artwork_final",
      intended_visibility: "public_record",
    })) as typeof context.asset_links;
    const onChange = jest.fn<
      void,
      [string, ApiArtworkDocumentationOperation]
    >();
    const form = (edits: PendingEdit[]) => (
      <DocumentationModules
        context={context}
        edits={edits}
        section="artwork"
        assets={assets}
        onChange={onChange}
      />
    );
    const { rerender } = render(form([]));
    const applyPendingChange = () => {
      const [moduleId, operation] = onChange.mock.calls.at(-1)!;
      rerender(form([{ moduleId, operation, sequence: 1 }]));
      return validDocumentationOperation(context, moduleId, operation);
    };
    const reasonName = "Why are you replacing the confirmed final file?";
    const file = screen.getByRole("combobox", { name: "Final artwork file" });
    expect(screen.queryByRole("textbox", { name: reasonName })).toBeNull();

    fireEvent.change(file, { target: { value: "replacement-file" } });
    expect(applyPendingChange()).toBe(false);
    const reason = screen.getByRole("textbox", { name: reasonName });
    expect(reason).toBeVisible();
    expect(reason).toHaveAccessibleDescription(
      "Explain the change in 20–1,000 characters. This explanation becomes part of the record’s history."
    );
    fireEvent.change(reason, { target: { value: "1234567890123456789" } });
    expect(applyPendingChange()).toBe(false);
    expect(screen.getByRole("status")).toBeVisible();
    fireEvent.change(reason, { target: { value: "12345678901234567890" } });
    expect(applyPendingChange()).toBe(true);
    expect(screen.queryByRole("status")).toBeNull();

    fireEvent.change(file, { target: { value: "original-file" } });
    expect(applyPendingChange()).toBe(true);
    expect(screen.queryByRole("textbox", { name: reasonName })).toBeNull();

    fireEvent.change(file, { target: { value: "replacement-file" } });
    expect(applyPendingChange()).toBe(false);
    expect(screen.getByRole("textbox", { name: reasonName })).toHaveValue("");
  });
  it("keeps clearing an answer inside its options without hiding the recorded value", () => {
    const context = documentationFixture();
    const onChange = jest.fn();
    render(
      <DocumentationModules
        context={context}
        edits={[]}
        section="artwork"
        onChange={onChange}
      />
    );
    const title = screen.getByRole("region", { name: "Title" });
    expect(
      within(title).getByDisplayValue("মুক্তিযুদ্ধ — A long title")
    ).toBeVisible();
    expect(
      within(title).getByRole("button", { name: "Leave unanswered" })
    ).not.toBeVisible();
    fireEvent.click(within(title).getByText("Answer options"));
    fireEvent.click(
      within(title).getByRole("button", { name: "Leave unanswered" })
    );
    expect(onChange).toHaveBeenCalledWith("artwork", {
      op: "unset",
      field: "title",
    });
  });
  it("reads a viewer/editor's restricted answer as prose while ordinary fields remain editable", () => {
    const context = documentationFixture();
    Object.assign(context.mutation_capabilities, {
      confirm_as_artist: false,
      read_restricted_fields: false,
      read_archival_files: false,
    });
    context.mutation_restricted_paths = ["artwork.location"];
    context.modules["artwork"]!.answers["location"] = {
      status: "provided",
      value: "Published location with restricted history",
      intended_visibility: "public_record",
    } as never;
    const onChange = jest.fn();
    render(
      <DocumentationModules
        context={context}
        edits={[]}
        section="artwork"
        onChange={onChange}
      />
    );
    const location = screen.getByRole("region", { name: "Location" });
    expect(
      within(location).getByText("Published location with restricted history")
    ).toBeVisible();
    expect(within(location).queryByRole("textbox")).not.toBeInTheDocument();
    expect(within(location).queryByRole("button")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    const title = screen.getByDisplayValue("মুক্তিযুদ্ধ — A long title");
    expect(title).toBeEnabled();
    fireEvent.change(title, { target: { value: "Ordinary title change" } });
    expect(onChange).toHaveBeenCalledWith(
      "artwork",
      expect.objectContaining({ field: "title" })
    );
  });
  it("uses publication intent without exposing per-field privacy choices in the new intake", () => {
    const context = documentationFixture();
    context.profile.version = 2;
    context.profile.intake_mode = "publication_only" as never;
    context.profile.modules[1]!.fields[1]!.allowed_statuses = [
      "provided",
      "unknown",
    ] as never;
    const onChange = jest.fn();
    render(
      <DocumentationModules
        context={context}
        edits={[]}
        section="artwork"
        onChange={onChange}
      />
    );
    expect(
      screen.queryByRole("option", { name: "Restricted" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Withheld" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(/More about the work/));
    fireEvent.change(screen.getByRole("textbox", { name: "Location" }), {
      target: { value: "A studio" },
    });
    expect(onChange).toHaveBeenLastCalledWith(
      "artwork",
      expect.objectContaining({
        answer: {
          status: "provided",
          value: "A studio",
          intended_visibility: "public_record",
        },
      })
    );
  });
  it("renders the original script without rewriting the artist title", () => {
    render(
      <DocumentationModules
        context={documentationFixture()}
        edits={[]}
        section="artwork"
        onChange={jest.fn()}
      />
    );
    expect(
      screen.getByDisplayValue("মুক্তিযুদ্ধ — A long title")
    ).toBeInTheDocument();
  });
  it("records withheld location without copying its private value", () => {
    const context = documentationFixture();
    context.modules["artwork"]!.answers["location"] = {
      status: "provided",
      value: "Private place",
      intended_visibility: "public_record",
    } as (typeof context.modules)[string]["answers"][string];
    const onChange = jest.fn();
    render(
      <DocumentationModules
        context={context}
        edits={[]}
        section="artwork"
        onChange={onChange}
      />
    );
    fireEvent.click(
      within(screen.getByRole("region", { name: "Location" })).getByText(
        "Answer options"
      )
    );
    fireEvent.change(screen.getByLabelText("How would you like to answer?"), {
      target: { value: "withheld" },
    });
    expect(onChange.mock.calls[0][1].answer).toEqual({
      status: "withheld",
      intended_visibility: "public_record",
    });
  });
  it("keeps an optional field mounted in its open disclosure after an autosave while essential fields remain visible", () => {
    const context = documentationFixture();
    const onChange = jest.fn();
    const { rerender } = render(
      <DocumentationModules
        context={context}
        edits={[]}
        section="artwork"
        onChange={onChange}
      />
    );
    expect(screen.getByRole("textbox", { name: "Title" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Location" })).not.toBeVisible();
    fireEvent.click(screen.getByText(/More about the work/));
    const location = screen.getByRole("textbox", { name: "Location" });
    const disclosure = location.closest("details");
    fireEvent.change(location, { target: { value: "A studio" } });
    context.modules["artwork"]!.answers["location"] = {
      status: "provided",
      value: "A studio",
      intended_visibility: "public_record",
    } as never;
    rerender(
      <DocumentationModules
        context={context}
        edits={[]}
        section="artwork"
        onChange={onChange}
      />
    );
    expect(screen.getByRole("textbox", { name: "Location" })).toBe(location);
    expect(location.closest("details")).toBe(disclosure);
    expect(location).toBeVisible();
  });

  it("shows existing non-answer statuses and their explanation while keeping a direct answer's alternatives secondary", () => {
    const context = documentationFixture();
    context.modules["artwork"]!.answers["location"] = {
      status: "unknown",
      intended_visibility: "public_record",
      explanation: "The original location was not recorded.",
    } as never;
    render(
      <DocumentationModules
        context={context}
        edits={[]}
        section="artwork"
        onChange={jest.fn()}
      />
    );
    const location = screen.getByRole("region", { name: "Location" });
    expect(
      within(location).getByText("The original location was not recorded.", {
        selector: "p",
      })
    ).toBeVisible();
    expect(
      within(location).getByRole("textbox", { name: "Explanation" })
    ).not.toBeVisible();
    fireEvent.click(within(location).getByText("Answer options"));
    expect(
      within(location).getByRole("combobox", {
        name: "How would you like to answer?",
      })
    ).toBeVisible();
  });
  it("renders no input or private value for server-redacted fields", () => {
    const context = documentationFixture();
    context.modules["artwork"]!.answers["location"] = { redacted: true };
    render(
      <DocumentationModules
        context={context}
        edits={[]}
        section="artwork"
        onChange={jest.fn()}
      />
    );
    expect(
      screen.getByText(
        "Restricted evidence — your role does not include access."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Location" })
    ).not.toBeInTheDocument();
  });
  it("uses the interview question pinned to this context profile", () => {
    const context = documentationFixture();
    context.profile.interview_instrument = {
      id: "pinned-interview",
      version: 1,
      language: "en",
      prompts: [
        { id: "q1", text: "What does this particular threshold mean to you?" },
      ],
    };
    const interview = context.profile.modules.find(
      (module) => module.id === "interview"
    )!;
    interview.fields = [
      {
        ...context.profile.modules.find((module) => module.id === "artwork")!
          .fields[0]!,
        id: "q1",
      },
    ];
    context.modules["interview"]!.answers["mode"] = {
      status: "provided",
      intended_visibility: "public_record",
      value: "written",
    } as never;
    render(
      <DocumentationModules
        context={context}
        edits={[]}
        section="preservation"
        onChange={jest.fn()}
      />
    );
    expect(
      screen.getByRole("heading", {
        name: "What does this particular threshold mean to you?",
      })
    ).toBeInTheDocument();
  });
  it("lets an artist clear an optional numeric member without changing it to zero", () => {
    const onChange = jest.fn();
    render(
      <DocumentationValueEditor
        id="dimensions"
        label="Dimensions"
        editor={{
          kind: "object",
          fields: { width: { kind: "number" }, height: { kind: "number" } },
        }}
        value={{ width: 1200, height: 800 }}
        onChange={onChange}
      />
    );
    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Width in pixels" }),
      { target: { value: "" } }
    );
    expect(onChange).toHaveBeenLastCalledWith({ height: 800 });
  });
});
