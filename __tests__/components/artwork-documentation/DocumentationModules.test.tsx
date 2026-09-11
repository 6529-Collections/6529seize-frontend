import { fireEvent, render, screen } from "@testing-library/react";
import DocumentationValueEditor from "@/components/artwork-documentation/DocumentationValueEditor";
import DocumentationModules from "@/components/artwork-documentation/DocumentationModules";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

describe("artwork documentation modules", () => {
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
    fireEvent.change(screen.getByLabelText("How would you like to answer?"), {
      target: { value: "withheld" },
    });
    expect(onChange.mock.calls[0][1].answer).toEqual({
      status: "withheld",
      intended_visibility: "public_record",
    });
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
