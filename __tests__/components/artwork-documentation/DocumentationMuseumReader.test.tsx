import { render, screen } from "@testing-library/react";
import DocumentationSummary from "@/components/artwork-documentation/DocumentationSummary";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import profile from "@/__tests__/fixtures/artwork-documentation-profile-v3.json";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

it("reads a segment's custom question by its own text and resolves references to this work", () => {
  const context = documentationFixture();
  context.profile = profile as never;
  context.modules["interview"]!.answers["sessions"] = {
    status: "provided",
    intended_visibility: "public_record",
    value: [
      {
        id: "conversation",
        title: "Conversation with the artist",
        instrument: {
          id: "guide",
          title: "Guide",
          version: "1",
          questions: [{ id: "custom-question", text: "What must survive?" }],
        },
        segments: [
          { question_id: "custom-question", text: "The complete sequence." },
        ],
      },
    ],
  } as never;
  const result = render(
    <DocumentationSummary
      context={context}
      section="conversation"
      showHeading={false}
    />
  );
  expect(screen.getAllByText("What must survive?")).toHaveLength(2);
  expect(screen.getByText("The complete sequence.")).toBeInTheDocument();
  expect(screen.queryByText(/unresolved|reference not/i)).toBeNull();
  context.modules["files"]!.answers["described_materials"] = {
    status: "provided",
    intended_visibility: "public_record",
    value: [
      {
        id: "described",
        name: "Related physical print",
        related_subject_ids: [context.work_id],
      },
    ],
  } as never;
  result.rerender(
    <DocumentationSummary
      context={context}
      section="materials"
      showHeading={false}
    />
  );
  expect(
    screen.getByText(
      String(context.modules["artwork"]!.answers["title"]!.value)
    )
  ).toBeInTheDocument();
  expect(screen.queryByText(/unresolved|reference not/i)).toBeNull();
});
