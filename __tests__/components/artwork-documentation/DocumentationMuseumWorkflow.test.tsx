import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import DocumentationDossier from "@/components/artwork-documentation/DocumentationDossier";
import DocumentationMuseumJournal from "@/components/artwork-documentation/DocumentationMuseumJournal";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import {
  getArtworkDossier,
  createArtworkDossierExport,
  getArtworkDossierExport,
  getMuseumRecords,
  appendMuseumRecord,
} from "@/services/api/artwork-documentation-museum-api";
import { getDocumentationContext } from "@/services/api/artwork-documentation-api";
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/artwork-documentation/DocumentationAuthGate", () => ({
  useDocumentationActor: () => ({
    actorKey: mockActorKey,
    connectedProfile: { id: mockActorKey },
  }),
}));
jest.mock("@/services/api/artwork-documentation-museum-api");
jest.mock("@/services/api/artwork-documentation-api", () => ({
  ...jest.requireActual("@/services/api/artwork-documentation-api"),
  getDocumentationContext: jest.fn(),
}));
const clients: QueryClient[] = [];
const controllers: DocumentationDraftController[] = [];
let mockActorKey = "viewer";
function setup() {
  const context = documentationFixture();
  const controller = new DocumentationDraftController(
    context,
    { save: jest.fn(), read: jest.fn() },
    jest.fn()
  );
  controllers.push(controller);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  return {
    context,
    controller,
    wrap: (children: ReactNode) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}
afterEach(() => {
  controllers.splice(0).forEach((controller) => controller.dispose());
  clients.splice(0).forEach((client) => client.clear());
  jest.clearAllMocks();
  sessionStorage.clear();
  mockActorKey = "viewer";
});

it.each([
  [0, "0 files in this dossier"],
  [1, "1 file in this dossier"],
  [2, "2 files in this dossier"],
] as const)(
  "describes a dossier containing %s received files",
  async (count, copy) => {
    const props = setup();
    jest.mocked(getArtworkDossier).mockResolvedValue({
      context_id: props.context.id,
      draft_version: 1,
      source_sha256: "saved-hash",
      files: Array.from({ length: count }, (_, index) => ({
        asset_id: `asset-${index}`,
      })),
      issues: [],
      can_export: false,
    } as never);
    render(
      props.wrap(
        <DocumentationDossier
          context={props.context}
          controller={props.controller}
          active
        />
      )
    );
    expect(await screen.findByText(copy)).toBeInTheDocument();
    expect(createArtworkDossierExport).not.toHaveBeenCalled();
  }
);

it("prepares from the fresh saved hash/version and downloads the completed dossier without editing artist content", async () => {
  const user = userEvent.setup();
  const props = setup();
  const manifest = {
    context_id: props.context.id,
    draft_version: 7,
    source_sha256: "fresh-hash",
    files: [],
    issues: [],
    can_export: true,
  } as never;
  jest.mocked(getArtworkDossier).mockResolvedValue(manifest);
  const job = {
    id: "job",
    context_id: props.context.id,
    state: "ready",
    source_sha256: "fresh-hash",
    download_url: "https://assets.invalid/dossier.zip",
    sha256: "package-hash",
  } as never;
  jest.mocked(createArtworkDossierExport).mockResolvedValue(job);
  jest.mocked(getArtworkDossierExport).mockResolvedValue(job);
  render(
    props.wrap(
      <DocumentationDossier
        context={props.context}
        controller={props.controller}
        active
      />
    )
  );
  await user.click(
    await screen.findByRole("button", { name: "Prepare the dossier" })
  );
  expect(
    await screen.findByRole("link", { name: "Download the dossier" })
  ).toHaveAttribute("href", "https://assets.invalid/dossier.zip");
  expect(getArtworkDossier).toHaveBeenCalledTimes(2);
  expect(createArtworkDossierExport).toHaveBeenCalledWith(
    props.context.id,
    7,
    "fresh-hash",
    expect.any(String),
    expect.any(AbortSignal)
  );
  expect(props.controller.snapshot().context.draft_version).toBe(1);
});

it("does not fetch a hidden dossier or offer export against an incomplete manifest", async () => {
  const props = setup();
  jest.mocked(getArtworkDossier).mockResolvedValue({
    files: [],
    issues: [
      {
        code: "missing",
        path: "materials",
        message: "A referenced file is not received.",
      },
    ],
    can_export: false,
  } as never);
  const result = render(
    props.wrap(
      <DocumentationDossier
        context={props.context}
        controller={props.controller}
        active={false}
      />
    )
  );
  expect(getArtworkDossier).not.toHaveBeenCalled();
  result.rerender(
    props.wrap(
      <DocumentationDossier
        context={props.context}
        controller={props.controller}
        active
      />
    )
  );
  expect(
    await screen.findByRole("button", { name: "Prepare the dossier" })
  ).toBeDisabled();
  expect(
    screen.getByText("A referenced file is not received.")
  ).toBeInTheDocument();
  expect(createArtworkDossierExport).not.toHaveBeenCalled();
});

function exportFixtures() {
  const props = setup();
  const manifest = {
    context_id: props.context.id,
    draft_version: 7,
    source_sha256: "original-source-hash",
    files: [],
    issues: [],
    can_export: true,
  } as never;
  const job = {
    id: "existing-export",
    context_id: props.context.id,
    state: "ready",
    source_sha256: "original-source-hash",
    download_url: "https://assets.invalid/authorized-dossier.zip",
  } as never;
  jest.mocked(getArtworkDossier).mockResolvedValue(manifest);
  jest.mocked(getArtworkDossierExport).mockResolvedValue(job);
  return {
    ...props,
    manifest,
    job,
    storageKey: `6529:artwork-documentation:dossier:viewer:${props.context.id}`,
  };
}
it("explains why dossier preparation stops when the artist draft cannot be saved", async () => {
  const props = exportFixtures();
  jest.spyOn(props.controller, "flush").mockResolvedValue(false);
  render(
    props.wrap(
      <DocumentationDossier
        context={props.context}
        controller={props.controller}
        active
      />
    )
  );
  await userEvent
    .setup()
    .click(await screen.findByRole("button", { name: "Prepare the dossier" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    /could not be prepared/
  );
  expect(createArtworkDossierExport).not.toHaveBeenCalled();
});

it("recovers a known export after refresh using an authorized read and never stores its download URL", async () => {
  const user = userEvent.setup();
  const props = exportFixtures();
  jest.mocked(createArtworkDossierExport).mockResolvedValue(props.job);
  const first = render(
    props.wrap(
      <DocumentationDossier
        context={props.context}
        controller={props.controller}
        active
      />
    )
  );
  await user.click(
    await screen.findByRole("button", { name: "Prepare the dossier" })
  );
  await screen.findByRole("link", { name: "Download the dossier" });
  expect(JSON.parse(sessionStorage.getItem(props.storageKey)!)).toEqual({
    jobId: "existing-export",
    request: null,
  });
  first.unmount();
  const refreshed = setup();
  render(
    refreshed.wrap(
      <DocumentationDossier
        context={refreshed.context}
        controller={refreshed.controller}
        active
      />
    )
  );
  await screen.findByRole("link", { name: "Download the dossier" });
  expect(getArtworkDossierExport).toHaveBeenLastCalledWith(
    props.context.id,
    "existing-export",
    expect.any(AbortSignal)
  );
  expect(createArtworkDossierExport).toHaveBeenCalledTimes(1);
});

it("preserves the exact unknown-outcome request across refresh and retries it only when asked", async () => {
  const user = userEvent.setup();
  const props = exportFixtures();
  jest
    .mocked(createArtworkDossierExport)
    .mockRejectedValueOnce(new Error("Response lost"));
  const first = render(
    props.wrap(
      <DocumentationDossier
        context={props.context}
        controller={props.controller}
        active
      />
    )
  );
  await user.click(
    await screen.findByRole("button", { name: "Prepare the dossier" })
  );
  await screen.findByRole("button", { name: "Retry the dossier request" });
  const firstCall = jest.mocked(createArtworkDossierExport).mock.calls[0]!;
  expect(JSON.parse(sessionStorage.getItem(props.storageKey)!)).toEqual({
    jobId: null,
    request: {
      key: firstCall[3],
      sourceHash: "original-source-hash",
      draftVersion: 7,
    },
  });
  first.unmount();
  const refreshed = setup();
  jest.mocked(getArtworkDossier).mockResolvedValue({
    context_id: props.context.id,
    draft_version: 9,
    source_sha256: "new-draft-hash",
    files: [],
    issues: [],
    can_export: false,
  } as never);
  jest.mocked(createArtworkDossierExport).mockResolvedValue(props.job);
  render(
    refreshed.wrap(
      <DocumentationDossier
        context={refreshed.context}
        controller={refreshed.controller}
        active
      />
    )
  );
  const retry = await screen.findByRole("button", {
    name: "Retry the dossier request",
  });
  expect(createArtworkDossierExport).toHaveBeenCalledTimes(1);
  await user.click(retry);
  await screen.findByRole("link", { name: "Download the dossier" });
  expect(
    jest.mocked(createArtworkDossierExport).mock.calls[1]!.slice(0, 4)
  ).toEqual(firstCall.slice(0, 4));
});

it.each(["missing", "expired"])(
  "clears a %s recovered job and requires an explicit new request",
  async (state) => {
    const props = exportFixtures();
    sessionStorage.setItem(
      props.storageKey,
      JSON.stringify({ jobId: "old-export", request: null })
    );
    if (state === "missing")
      jest.mocked(getArtworkDossierExport).mockRejectedValue({ status: 404 });
    else
      jest
        .mocked(getArtworkDossierExport)
        .mockResolvedValue({ id: "old-export", state: "expired" } as never);
    render(
      props.wrap(
        <DocumentationDossier
          context={props.context}
          controller={props.controller}
          active
        />
      )
    );
    await screen.findByText(/previous dossier is no longer available/);
    expect(sessionStorage.getItem(props.storageKey)).toBeNull();
    expect(
      await screen.findByRole("button", { name: "Prepare the dossier" })
    ).toBeEnabled();
    expect(createArtworkDossierExport).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("link", { name: "Download the dossier" })
    ).toBeNull();
  }
);

it("discards the displayed recovery state on an actor change and does not read another actor's stored job", async () => {
  const props = exportFixtures();
  sessionStorage.setItem(
    props.storageKey,
    JSON.stringify({ jobId: "existing-export", request: null })
  );
  const result = render(
    props.wrap(
      <DocumentationDossier
        context={props.context}
        controller={props.controller}
        active
      />
    )
  );
  await screen.findByRole("link", { name: "Download the dossier" });
  const reads = jest.mocked(getArtworkDossierExport).mock.calls.length;
  mockActorKey = "another-profile:proxy:wallet";
  result.rerender(
    props.wrap(
      <DocumentationDossier
        context={props.context}
        controller={props.controller}
        active
      />
    )
  );
  await screen.findByRole("button", { name: "Prepare the dossier" });
  expect(
    screen.queryByRole("link", { name: "Download the dossier" })
  ).toBeNull();
  expect(getArtworkDossierExport).toHaveBeenCalledTimes(reads);
  expect(createArtworkDossierExport).not.toHaveBeenCalled();
});

it("read-only journal access shows entries without a writable composer", async () => {
  const props = setup();
  jest.mocked(getMuseumRecords).mockResolvedValue({
    context_id: props.context.id,
    draft_version: 1,
    definitions: [],
    allowed_kinds: [],
    records: [],
    next_cursor: null,
  } as never);
  render(
    props.wrap(
      <DocumentationMuseumJournal
        context={props.context}
        controller={props.controller}
        active
      />
    )
  );
  expect(
    await screen.findByText("No Museum entries have been recorded yet.")
  ).toBeInTheDocument();
  expect(screen.queryByText("Add a Museum entry")).not.toBeInTheDocument();
  expect(appendMuseumRecord).not.toHaveBeenCalled();
});

it("preserves separate staff drafts across chapter changes and requires an explicit event status", async () => {
  const user = userEvent.setup();
  const props = setup();
  const evidence = {
    id: "evidence-file",
    filename: "Decision-source.txt",
    role: "other_supporting",
    intended_visibility: "public_record",
    state: "ready",
    size_bytes: 42,
  };
  props.context.assets = [evidence] as never;
  props.context.asset_links = [
    {
      id: "evidence-link",
      asset_id: evidence.id,
      role: evidence.role,
      intended_visibility: evidence.intended_visibility,
      manifest: evidence,
    },
  ] as never;
  const definition = {
    kind: "catalogue",
    label: "Catalogue entry",
    description: "Record the decision.",
    lane: "curatorial",
    stream_schema: "schema",
    value_schema: {
      type: "object",
      properties: { note: { type: "string", title: "Note" } },
      required: [],
      additionalProperties: false,
    },
  };
  jest.mocked(getMuseumRecords).mockResolvedValue({
    context_id: props.context.id,
    draft_version: 1,
    definitions: [definition],
    allowed_kinds: ["catalogue"],
    records: [],
    next_cursor: null,
  } as never);
  jest.mocked(appendMuseumRecord).mockResolvedValue({} as never);
  jest
    .mocked(getDocumentationContext)
    .mockResolvedValue({ ...props.context, draft_version: 2 });
  const result = render(
    props.wrap(
      <DocumentationMuseumJournal
        context={props.context}
        controller={props.controller}
        active
      />
    )
  );
  await user.click(await screen.findByText("Add a Museum entry"));
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Type of entry" }),
    "catalogue"
  );
  await user.type(
    screen.getByRole("textbox", { name: "Title" }),
    "A recorded decision"
  );
  await user.click(screen.getByText("Additional details (4)"));
  await user.selectOptions(
    screen.getByRole("listbox", { name: "Subject ids" }),
    [props.context.work_id]
  );
  await user.selectOptions(
    screen.getByRole("listbox", { name: "Evidence asset ids" }),
    [evidence.id]
  );
  const effectiveDate = screen.getByRole("textbox", { name: "Effective date" });
  expect(
    effectiveDate
      .getAttribute("aria-describedby")
      ?.split(" ")
      .map((id) => document.getElementById(id)?.textContent)
      .join(" ")
  ).toContain("Use YYYY, YYYY-MM or YYYY-MM-DD.");
  expect(
    screen.getByRole("button", { name: "Save the Museum entry" })
  ).toBeDisabled();
  result.rerender(
    props.wrap(
      <DocumentationMuseumJournal
        context={props.context}
        controller={props.controller}
        active={false}
      />
    )
  );
  result.rerender(
    props.wrap(
      <DocumentationMuseumJournal
        context={props.context}
        controller={props.controller}
        active
      />
    )
  );
  expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue(
    "A recorded decision"
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Event status" }),
    "planned"
  );
  // Opening an empty details object is not a fabricated institutional statement.
  fireEvent.change(screen.getByRole("textbox", { name: "Note" }), {
    target: { value: "Prepare a review." },
  });
  await user.click(
    screen.getByRole("button", { name: "Save the Museum entry" })
  );
  await waitFor(() =>
    expect(appendMuseumRecord).toHaveBeenCalledWith(
      props.context.id,
      1,
      expect.objectContaining({
        title: "A recorded decision",
        event_status: "planned",
        subject_ids: [props.context.work_id],
        evidence_asset_ids: [evidence.id],
      }),
      expect.any(String),
      expect.any(AbortSignal)
    )
  );
});
