import { fireEvent, render, screen } from "@testing-library/react";
import DocumentationWorkedExample from "@/components/artwork-documentation/DocumentationWorkedExample";
import DocumentationModules from "@/components/artwork-documentation/DocumentationModules";
import { DocumentationExampleExcerpt } from "@/components/artwork-documentation/DocumentationFieldExample";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import {
  AN_ALTERATION_EXAMPLE_PATH,
  anAlterationExcerpt,
} from "@/lib/artwork-documentation/an-alteration";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

describe("precise guidance from the supplied artist record", () => {
  it("opens the complete illustrated sample separately and never puts the whole record in a form disclosure", () => {
    const context = documentationFixture();
    const original = JSON.stringify(context);
    const { container } = render(
      <DocumentationWorkedExample
        context={context}
        edits={[]}
        section="artwork"
      />
    );
    expect(
      screen.getByRole("link", { name: "Read the complete example" })
    ).toHaveAttribute("href", AN_ALTERATION_EXAMPLE_PATH);
    expect(screen.getByRole("link")).toHaveAttribute("target", "_blank");
    expect(container.querySelector("details")).toBeNull();
    expect(JSON.stringify(context)).toBe(original);
  });
  it("shows the relevant original excerpt without inserting fictional facts", () => {
    const onChange = jest.fn();
    render(
      <DocumentationModules
        context={documentationFixture()}
        edits={[]}
        section="artwork"
        onChange={onChange}
      />
    );
    const details = screen
      .getAllByText("See an example for this answer")[0]!
      .closest("details")!;
    expect(details).not.toHaveAttribute("open");
    fireEvent.click(details.querySelector("summary")!);
    expect(details.querySelector("blockquote")?.textContent).toBe(
      anAlterationExcerpt("artwork", "title")
    );
    expect(details.querySelector("button")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
  it("distinguishes a specialist example from AN ALTERATION and leaves unrelated questions alone", () => {
    const { container, rerender } = render(
      <DocumentationExampleExcerpt moduleId="process" fieldId="video" />
    );
    fireEvent.click(screen.getByText("See an example for this answer"));
    expect(screen.getByText(/Illustrative example:/)).toHaveTextContent(
      /invented details/
    );
    expect(
      container.querySelector("blockquote")?.textContent?.length
    ).toBeGreaterThan(30);
    expect(screen.queryByText(/From AN ALTERATION/)).toBeNull();
    expect(container.querySelector("a,button")).toBeNull();
    rerender(
      <DocumentationExampleExcerpt
        moduleId="interview"
        fieldId="unknown_custom_question"
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
