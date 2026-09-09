import { fireEvent, render, screen } from "@testing-library/react";
import DocumentationModules from "@/components/artwork-documentation/DocumentationModules";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import { publicPreviewAnswers } from "@/lib/artwork-documentation/answers";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

describe("artwork documentation modules", () => {
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
  it("omits restricted fields from the preview data before rendering", () => {
    const context = documentationFixture();
    context.modules["artwork"]!.answers["location"] = {
      status: "provided",
      value: "Sensitive place",
      intended_visibility: "restricted",
    } as (typeof context.modules)[string]["answers"][string];
    expect(
      publicPreviewAnswers(context)["artwork"]?.["location"]
    ).toBeUndefined();
    expect(JSON.stringify(publicPreviewAnswers(context))).not.toContain(
      "Sensitive place"
    );
  });
});
