import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArtworkDocumentationRecordView } from "@/components/artwork-documentation/ArtworkDocumentationWorkspace";
import { useDocumentationDraft } from "@/hooks/artwork-documentation/useDocumentationDraft";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import { patchDocumentationModule } from "@/services/api/artwork-documentation-api";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/artwork-documentation/DocumentationAuthGate", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock(
  "@/hooks/artwork-documentation/useArtworkDocumentationAccess",
  () => ({ documentationQueryKey: (...parts: string[]) => parts })
);
jest.mock("@/services/api/artwork-documentation-api", () => ({
  ...jest.requireActual<
    typeof import("@/services/api/artwork-documentation-api")
  >("@/services/api/artwork-documentation-api"),
  patchDocumentationModule: jest.fn(),
}));
jest.mock(
  "@/components/artwork-documentation/DocumentationRecordHeader",
  () => ({ __esModule: true, default: () => <h1>Assigned work</h1> })
);
jest.mock(
  "@/components/artwork-documentation/DocumentationArtworkPreview",
  () => ({ __esModule: true, default: () => null })
);
jest.mock("@/components/artwork-documentation/DocumentationDossier", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock(
  "@/components/artwork-documentation/DocumentationMuseumJournal",
  () => ({ __esModule: true, default: () => null })
);
jest.mock("@/components/artwork-documentation/DocumentationSummary", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/artwork-documentation/DocumentationSaveStatus", () => ({
  __esModule: true,
  default: ({ snapshot }: { readonly snapshot: { state: string } }) => (
    <p role="status">{snapshot.state}</p>
  ),
}));
jest.mock(
  "@/components/artwork-documentation/DocumentationRecordChapters",
  () => ({
    DocumentationFilesSection: () => null,
    DocumentationReadingChapter: () => <p>Saved artwork</p>,
    DocumentationWritingChapter: ({
      draft,
    }: {
      readonly draft: ReturnType<typeof useDocumentationDraft>;
    }) => {
      const { titleOperation } = jest.requireActual<
        typeof import("@/__tests__/fixtures/artwork-documentation")
      >("@/__tests__/fixtures/artwork-documentation");
      const value =
        draft.edits[0]?.operation.answer?.value ??
        draft.context.modules["artwork"]?.answers["title"]?.value;
      return (
        <label>
          Artwork title
          <input
            value={typeof value === "string" ? value : ""}
            onChange={(event) =>
              draft.controller.edit(
                "artwork",
                titleOperation(event.target.value)
              )
            }
          />
        </label>
      );
    },
  })
);
function Editor({
  context,
}: {
  readonly context: ApiArtworkDocumentationContext;
}) {
  return (
    <ArtworkDocumentationRecordView draft={useDocumentationDraft(context)} />
  );
}
function ownerContext() {
  const context = documentationFixture();
  context.program_id = "6529NM-AP-01";
  // These permissions are local to the assigned record, not a program grant.
  expect(context.capabilities.manage_context).toBe(true);
  expect(context.capabilities.manage_assignments).toBe(true);
  return context;
}
beforeEach(() => {
  jest.clearAllMocks();
});

it("saves an assigned artist's pending title before exiting to the personal list", async () => {
  const user = userEvent.setup();
  const context = ownerContext();
  let resolve!: (saved: ApiArtworkDocumentationContext) => void;
  jest.mocked(patchDocumentationModule).mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    })
  );
  render(<Editor context={context} />);
  expect(
    screen.getByRole("link", { name: /My artwork documentation/ })
  ).toHaveAttribute("href", "/artwork-documentation");
  fireEvent.change(screen.getByRole("textbox", { name: "Artwork title" }), {
    target: { value: "Saved artist title" },
  });
  await user.click(screen.getByRole("button", { name: "Save and exit" }));
  expect(patchDocumentationModule).toHaveBeenCalledTimes(1);
  expect(patchDocumentationModule).toHaveBeenCalledWith(
    context,
    "artwork",
    [
      expect.objectContaining({
        answer: expect.objectContaining({ value: "Saved artist title" }),
      }),
    ],
    expect.any(String),
    expect.any(AbortSignal)
  );
  expect(mockPush).not.toHaveBeenCalled();
  resolve({ ...context, draft_version: 2 });
  await waitFor(() =>
    expect(mockPush).toHaveBeenCalledWith("/artwork-documentation")
  );
});

it("retains the artist's unsaved title and stays in the editor when Save and exit is rejected", async () => {
  const user = userEvent.setup();
  const context = ownerContext();
  jest.mocked(patchDocumentationModule).mockRejectedValueOnce({
    status: 422,
    response: { body: { code: "INVALID_ANSWER" } },
  });
  render(<Editor context={context} />);
  fireEvent.change(screen.getByRole("textbox", { name: "Artwork title" }), {
    target: { value: "Still in this window" },
  });
  await user.click(screen.getByRole("button", { name: "Save and exit" }));
  await waitFor(() =>
    expect(
      screen
        .getAllByRole("status")
        .every((status) => status.textContent === "invalid")
    ).toBe(true)
  );
  expect(mockPush).not.toHaveBeenCalled();
  expect(screen.getByRole("textbox", { name: "Artwork title" })).toHaveValue(
    "Still in this window"
  );
});

it("gives a record-only viewer the personal list rather than a program-wide queue", async () => {
  const user = userEvent.setup();
  const context = ownerContext();
  const permissions = {
    ...context.capabilities,
    edit_modules: [],
    confirm_as_artist: false,
    review_lanes: [],
    manage_assignments: false,
    manage_context: false,
  };
  context.capabilities = permissions;
  context.mutation_capabilities = permissions;
  render(<Editor context={context} />);
  expect(
    screen.queryByRole("button", { name: "Save and exit" })
  ).not.toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "My artwork documentation" })
  );
  expect(mockPush).toHaveBeenCalledWith("/artwork-documentation");
  expect(patchDocumentationModule).not.toHaveBeenCalled();
});
