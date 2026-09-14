import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import ArtworkDocumentationList from "@/components/artwork-documentation/ArtworkDocumentationList";
import DocumentationNewContext from "@/components/artwork-documentation/DocumentationNewContext";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import type { ApiArtworkDocumentationContextSummary } from "@/generated/models/ApiArtworkDocumentationContextSummary";
import type { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import {
  createDocumentationWork,
  createAdditionalDocumentationContext,
  getDocumentationWorks,
  documentationWorkspacePath,
} from "@/services/api/artwork-documentation-api";

const mockPush = jest.fn();
const standalone = documentationFixture().profile;
const program = {
  ...standalone,
  profile_id: "keys_and_gates_photography_v1",
  program_id: "6529NM-AP-01",
  version: 3,
};
const mockAccess = {
  enabled: true,
  selfServiceEnabled: false,
  profiles: [program, standalone],
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
};

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/artwork-documentation/DocumentationAuthGate", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: ReactNode }) => children,
  useDocumentationActor: () => ({
    actorKey: "artist-a",
    connectedProfile: { id: "artist-a" },
  }),
}));
jest.mock(
  "@/hooks/artwork-documentation/useArtworkDocumentationAccess",
  () => ({
    useArtworkDocumentationAccess: () => mockAccess,
    documentationQueryKey: (...parts: string[]) => ["documentation", ...parts],
  })
);
jest.mock("@/services/api/artwork-documentation-api", () => ({
  ...jest.requireActual<
    typeof import("@/services/api/artwork-documentation-api")
  >("@/services/api/artwork-documentation-api"),
  getDocumentationWorks: jest.fn(),
  createDocumentationWork: jest.fn(),
  createAdditionalDocumentationContext: jest.fn(),
}));
jest.mock("@/services/api/wave-drops-v2-api", () => ({
  fetchDropsV2ByIds: jest.fn().mockResolvedValue([]),
}));
jest.mock(
  "@/components/artwork-documentation/DocumentationArtworkPreview",
  () => ({ ArtworkImage: () => null })
);

function record(): ApiArtworkDocumentationContextSummary {
  const context = documentationFixture();
  return {
    id: context.id,
    work_id: context.work_id,
    program_id: program.program_id,
    owner_profile_id: context.owner_profile_id,
    artist_display_name: "Example artist",
    artist_preferred_credit: null,
    source_submission: null,
    title: "Assigned Keys and Gates work",
    draft_version: 18,
    confirmation_status: "unconfirmed",
    latest_revision_id: null,
    lifecycle: "active",
    updated_at: 1,
    profile_id: program.profile_id,
    profile_version: 3,
    reviews: [],
  } as ApiArtworkDocumentationContextSummary;
}
function renderList(props: { programId?: string; sourceDropId?: string } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ArtworkDocumentationList {...props} />
    </QueryClientProvider>
  );
}
function failure(status: number, code: string) {
  return { status, response: { body: { code } } };
}
beforeEach(() => {
  jest.clearAllMocks();
  mockAccess.enabled = true;
  mockAccess.selfServiceEnabled = false;
  mockAccess.isError = false;
  mockAccess.profiles = [program, standalone];
  jest
    .mocked(getDocumentationWorks)
    .mockResolvedValue({ data: [record()], next_cursor: null });
});

it("opens the assigned record without offering creation during the invitation-only pilot", async () => {
  renderList();
  const open = await screen.findByRole("link", { name: /Open record/ });
  expect(open).toHaveAttribute(
    "href",
    documentationWorkspacePath(record().work_id, record().id)
  );
  expect(
    screen.queryByRole("button", { name: "Start documenting" })
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  expect(createDocumentationWork).not.toHaveBeenCalled();
});

it("offers only standalone profiles after existing records when self-service is enabled", async () => {
  const user = userEvent.setup();
  mockAccess.selfServiceEnabled = true;
  jest
    .mocked(createDocumentationWork)
    .mockResolvedValue(documentationFixture());
  renderList();
  const start = await screen.findByRole("button", {
    name: "Start documenting",
  });
  expect(screen.getAllByRole("option")).toHaveLength(1);
  expect(
    screen
      .getByRole("link", { name: /Open record/ })
      .compareDocumentPosition(start) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  await user.click(start);
  expect(createDocumentationWork).toHaveBeenCalledWith(
    {
      profile_id: standalone.profile_id,
      profile_version: standalone.version,
      start_mode: "standalone",
    },
    expect.any(String)
  );
  expect(mockPush).toHaveBeenCalledWith(
    documentationWorkspacePath(
      documentationFixture().work_id,
      documentationFixture().id
    )
  );
});

it("waits for the source lookup and opens an existing program record without a create POST", async () => {
  mockAccess.selfServiceEnabled = true;
  const existing = {
    ...record(),
    source_submission: {
      drop_id: "source-drop",
      wave_id: "wave",
      source_receipt_id: "receipt",
      title: "Source title",
    },
  };
  let resolve!: (value: {
    data: ApiArtworkDocumentationContextSummary[];
    next_cursor: null;
  }) => void;
  jest.mocked(getDocumentationWorks).mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    })
  );
  renderList({ sourceDropId: "source-drop" });
  expect(
    screen.queryByRole("button", { name: "Start documenting" })
  ).not.toBeInTheDocument();
  await act(async () => {
    resolve({ data: [existing], next_cursor: null });
  });
  expect(
    await screen.findByText(
      /This submission already has a documentation record/
    )
  ).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Start documenting" })
  ).not.toBeInTheDocument();
  expect(createDocumentationWork).not.toHaveBeenCalled();
  for (const link of screen.getAllByRole("link", { name: /Open record/ }))
    expect(link).toHaveAttribute(
      "href",
      documentationWorkspacePath(existing.work_id, existing.id)
    );
});

it("recovers a failed list read without creating a record or retaining the read error", async () => {
  const user = userEvent.setup();
  mockAccess.selfServiceEnabled = true;
  jest
    .mocked(getDocumentationWorks)
    .mockRejectedValueOnce(new Error("Network"));
  renderList({ sourceDropId: "source-drop" });
  const alert = await screen.findByRole("alert");
  expect(alert).not.toHaveTextContent(/unsaved changes/);
  expect(
    screen.queryByRole("button", { name: "Start documenting" })
  ).not.toBeInTheDocument();
  await user.click(within(alert).getByRole("button", { name: "Try again" }));
  await screen.findByRole("link", { name: /Open record/ });
  await waitFor(() =>
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  );
  expect(createDocumentationWork).not.toHaveBeenCalled();
});

it("offers personal-list recovery for a denied program queue without rendering successful filters or empty state", async () => {
  jest
    .mocked(getDocumentationWorks)
    .mockRejectedValueOnce(failure(404, "UNAVAILABLE"));
  renderList({ programId: program.program_id });
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent(
    "This record list is not available to your profile"
  );
  expect(
    within(alert).getByRole("link", { name: "My artwork documentation" })
  ).toHaveAttribute("href", "/artwork-documentation");
  expect(screen.queryByText("Find a record")).not.toBeInTheDocument();
  expect(
    screen.queryByText(/The next chapter starts here/)
  ).not.toBeInTheDocument();
});

it("retries the failed create with its original key and clears the creation error", async () => {
  const user = userEvent.setup();
  mockAccess.selfServiceEnabled = true;
  jest
    .mocked(createDocumentationWork)
    .mockRejectedValueOnce(new Error("Response lost"))
    .mockResolvedValueOnce(documentationFixture());
  renderList();
  await user.click(
    await screen.findByRole("button", { name: "Start documenting" })
  );
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent(
    "We could not open a new documentation record"
  );
  await user.click(within(alert).getByRole("button", { name: "Try again" }));
  await waitFor(() => expect(mockPush).toHaveBeenCalled());
  const calls = jest.mocked(createDocumentationWork).mock.calls;
  expect(calls[1]).toEqual(calls[0]);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it.each([
  [
    "SELF_SERVICE_DISABLED",
    "New standalone records are not available right now",
  ],
  ["PROGRAM_INVITATION_REQUIRED", "The project team prepares program records"],
  ["DIRECT_ARTIST_REQUIRED", "Sign in directly with the artist profile"],
])(
  "explains a %s creation denial without claiming unsaved artwork was lost",
  async (code, message) => {
    const user = userEvent.setup();
    mockAccess.selfServiceEnabled = true;
    jest
      .mocked(createDocumentationWork)
      .mockRejectedValueOnce(failure(403, code));
    renderList();
    await user.click(
      await screen.findByRole("button", { name: "Start documenting" })
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.getByRole("alert")).not.toHaveTextContent(/unsaved changes/);
  }
);

it("hides additional-context creation when self-service is disabled, even for a context owner", () => {
  const context = documentationFixture();
  context.program_id = program.program_id;
  context.profile = program;
  const { container } = render(
    <DocumentationNewContext
      context={context}
      controller={
        { flush: jest.fn() } as unknown as DocumentationDraftController
      }
    />
  );
  expect(container).toBeEmptyDOMElement();
  expect(createAdditionalDocumentationContext).not.toHaveBeenCalled();
});

it("excludes program choices from additional contexts and waits for the current draft to save", async () => {
  const user = userEvent.setup();
  mockAccess.selfServiceEnabled = true;
  const context = documentationFixture();
  context.program_id = program.program_id;
  context.profile = program;
  const flush = jest.fn().mockResolvedValue(false);
  render(
    <DocumentationNewContext
      context={context}
      controller={{ flush } as unknown as DocumentationDraftController}
    />
  );
  await user.click(
    screen.getByText("Document this work for another context", {
      selector: "summary",
    })
  );
  expect(screen.getAllByRole("option")).toHaveLength(1);
  await user.click(screen.getByRole("checkbox"));
  await user.click(
    screen.getByRole("button", {
      name: "Document this work for another context",
    })
  );
  expect(flush).toHaveBeenCalledTimes(1);
  expect(createAdditionalDocumentationContext).not.toHaveBeenCalled();
});

it("loads later source records before offering creation and reuses the matched program record", async () => {
  const user = userEvent.setup();
  mockAccess.selfServiceEnabled = true;
  const existing = {
    ...record(),
    id: "later-context",
    source_submission: {
      drop_id: "older-drop",
      wave_id: "wave",
      source_receipt_id: "receipt",
      title: "Older submission",
    },
  };
  jest
    .mocked(getDocumentationWorks)
    .mockResolvedValueOnce({ data: [record()], next_cursor: "next-page" })
    .mockResolvedValueOnce({ data: [existing], next_cursor: null });
  renderList({ sourceDropId: "older-drop" });
  expect(
    await screen.findByText(
      /This submission may already have a record on a later page/
    )
  ).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Start documenting" })
  ).not.toBeInTheDocument();
  expect(createDocumentationWork).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Load more" }));
  expect(
    await screen.findByText(
      /This submission already has a documentation record/
    )
  ).toBeVisible();
  expect(getDocumentationWorks).toHaveBeenLastCalledWith(
    "next-page",
    undefined,
    expect.any(AbortSignal),
    {}
  );
  expect(
    screen.queryByRole("button", { name: "Start documenting" })
  ).not.toBeInTheDocument();
  expect(createDocumentationWork).not.toHaveBeenCalled();
  expect(
    screen
      .getAllByRole("link", { name: /Open record/ })
      .some(
        (link) =>
          link.getAttribute("href") ===
          documentationWorkspacePath(existing.work_id, existing.id)
      )
  ).toBe(true);
});
