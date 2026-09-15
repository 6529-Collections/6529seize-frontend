import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DocumentationReview from "@/components/artwork-documentation/DocumentationReview";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import {
  reviewDocumentationRevision,
  getDocumentationPublicPreview,
  confirmDocumentation,
  getDocumentationContext,
} from "@/services/api/artwork-documentation-api";
import { useDocumentationDraft } from "@/hooks/artwork-documentation/useDocumentationDraft";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationPublicPreview } from "@/generated/models/ApiArtworkDocumentationPublicPreview";

const mockRequestAuth = jest.fn().mockResolvedValue({ success: true });
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ requestAuth: mockRequestAuth }),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/artwork-documentation/DocumentationAuthGate", () => ({
  useDocumentationActor: () => ({
    actorKey: "artist-a",
    connectedProfile: { id: "artist-a" },
  }),
}));
jest.mock("@/services/api/artwork-documentation-api", () => ({
  ...jest.requireActual("@/services/api/artwork-documentation-api"),
  getDocumentationRevisions: jest
    .fn()
    .mockResolvedValue({ data: [], next_cursor: null }),
  getDocumentationPublicPreview: jest.fn(),
  confirmDocumentation: jest.fn(),
  getDocumentationContext: jest.fn(),
  reviewDocumentationRevision: jest.fn().mockResolvedValue({}),
}));

it("waits for the server public projection and never falls back to private draft answers", async () => {
  const context = documentationFixture();
  context.modules["identity"]!.answers["private_contact"] = {
    status: "provided",
    value: "private@example.invalid",
    intended_visibility: "restricted",
  } as never;
  let resolve!: (data: ApiArtworkDocumentationPublicPreview) => void;
  jest.mocked(getDocumentationPublicPreview).mockReturnValue(
    new Promise((done) => {
      resolve = done;
    })
  );
  const controller = new DocumentationDraftController(
    context,
    { read: jest.fn(), save: jest.fn() },
    jest.fn()
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <DocumentationReview
        context={context}
        controller={controller}
        saveState="clean"
        onNavigateSection={jest.fn()}
      />
    </QueryClientProvider>
  );
  expect(screen.getByText("private@example.invalid")).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Preview saved publication content" })
  );
  expect(screen.queryByText("private@example.invalid")).not.toBeInTheDocument();
  await waitFor(() => expect(getDocumentationPublicPreview).toHaveBeenCalled());
  resolve({
    context_id: context.id,
    draft_version: 1,
    modules: {
      artwork: {
        schema_version: 1,
        answers: { title: context.modules["artwork"]!.answers["title"]! },
      },
    },
    asset_links: [],
  });
  expect(
    await screen.findByText("মুক্তিযুদ্ধ — A long title")
  ).toBeInTheDocument();
  expect(screen.queryByText("private@example.invalid")).not.toBeInTheDocument();
  controller.dispose();
  client.clear();
});

it("keeps reviewer notes separate for each lane and clears only the submitted lane", async () => {
  const context = documentationFixture();
  context.latest_revision_id = "revision";
  context.confirmation_status = "current" as never;
  context.mutation_capabilities.review_lanes = ["technical", "rights"] as never;
  const controller = new DocumentationDraftController(
    context,
    { read: jest.fn(), save: jest.fn() },
    jest.fn()
  );
  jest.spyOn(controller, "mutate").mockResolvedValue(true);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <DocumentationReview
        context={context}
        controller={controller}
        saveState="clean"
        onNavigateSection={jest.fn()}
      />
    </QueryClientProvider>
  );
  const technical = within(
    screen.getByRole("heading", { name: "Technical review" }).parentElement!
  );
  const rights = within(
    screen.getByRole("heading", { name: "Rights review" }).parentElement!
  );
  fireEvent.change(technical.getByRole("textbox", { name: "Review note" }), {
    target: { value: "Technical note" },
  });
  fireEvent.change(rights.getByRole("textbox", { name: "Review note" }), {
    target: { value: "Rights note" },
  });
  fireEvent.click(
    technical.getByRole("button", { name: "Accept this version" })
  );
  await waitFor(() =>
    expect(reviewDocumentationRevision).toHaveBeenCalledWith(
      context.id,
      "revision",
      "technical",
      expect.objectContaining({ reason: "Technical note" })
    )
  );
  await waitFor(() =>
    expect(technical.getByRole("textbox", { name: "Review note" })).toHaveValue(
      ""
    )
  );
  expect(rights.getByRole("textbox", { name: "Review note" })).toHaveValue(
    "Rights note"
  );
  controller.dispose();
  client.clear();
});

it("guides missing interview permission to its chapters and blocks confirmation until the issue clears", () => {
  const context = documentationFixture();
  context.issues = [
    {
      field: "asset:recording",
      code: "INTERVIEW_PUBLICATION_PERMISSION_REQUIRED",
      lane: "rights",
    },
  ];
  const controller = new DocumentationDraftController(
    context,
    { read: jest.fn(), save: jest.fn() },
    jest.fn()
  );
  const onNavigateSection = jest.fn();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = (current: typeof context) => (
    <QueryClientProvider client={client}>
      <DocumentationReview
        context={current}
        controller={controller}
        saveState="clean"
        onNavigateSection={onNavigateSection}
      />
    </QueryClientProvider>
  );
  const rendered = render(view(context));
  expect(
    screen.getByText(/record publication permission for each received/)
  ).toHaveTextContent("Your uploaded files remain available.");
  expect(screen.getByRole("checkbox")).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Confirm this version" })
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "The conversation" }));
  expect(onNavigateSection).toHaveBeenLastCalledWith("conversation");
  fireEvent.click(screen.getByRole("button", { name: "Credits & terms" }));
  expect(onNavigateSection).toHaveBeenLastCalledWith("rights");
  rendered.rerender(view({ ...context, issues: [] }));
  expect(
    screen.queryByText(/record publication permission for each received/)
  ).toBeNull();
  expect(screen.getByRole("checkbox")).toBeEnabled();
  controller.dispose();
  client.clear();
});

function LiveReview({
  initial,
  reviewKey = "review",
}: {
  readonly initial: ApiArtworkDocumentationContext;
  readonly reviewKey?: string;
}) {
  const draft = useDocumentationDraft(initial);
  return (
    <DocumentationReview
      key={reviewKey}
      context={draft.context}
      controller={draft.controller}
      saveState={draft.state}
      edits={draft.edits}
      onNavigateSection={jest.fn()}
    />
  );
}
function renderLiveReview(initial = documentationFixture()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rendered = render(
    <QueryClientProvider client={client}>
      <LiveReview initial={initial} />
    </QueryClientProvider>
  );
  return { ...rendered, client };
}
function recordedContext(
  context: ApiArtworkDocumentationContext
): ApiArtworkDocumentationContext {
  return {
    ...context,
    latest_revision_id: "confirmed-revision",
    confirmation_status: "current" as never,
  };
}
function clickConfirm() {
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Confirm this version" }));
}

describe("artist confirmation recovery", () => {
  beforeEach(() => {
    jest.mocked(confirmDocumentation).mockReset();
    jest.mocked(getDocumentationContext).mockReset();
    mockRequestAuth.mockReset().mockResolvedValue({ success: true });
  });

  it("shows local progress and the server-recorded version after confirmation", async () => {
    const context = documentationFixture();
    let finish!: () => void;
    jest.mocked(confirmDocumentation).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = () => resolve({} as never);
        })
    );
    jest
      .mocked(getDocumentationContext)
      .mockResolvedValue(recordedContext(context));
    const view = renderLiveReview(context);
    clickConfirm();
    expect(
      await screen.findByText("Recording your confirmation…")
    ).toHaveAttribute("role", "status");
    expect(
      screen.getByRole("button", { name: "Confirm this version" })
    ).toBeDisabled();
    await act(async () => finish());
    expect(
      await screen.findByText(
        /Your confirmation is recorded for this saved version/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View confirmed version" })
    ).toHaveAttribute(
      "href",
      expect.stringContaining("/revisions/confirmed-revision")
    );
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    view.unmount();
    view.client.clear();
  });

  it("retains recorded confirmation after reload and does not call it pending review", () => {
    const view = renderLiveReview(recordedContext(documentationFixture()));
    expect(
      screen.getByText(/Your confirmation is recorded for this saved version/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View confirmed version" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByText("Review pending")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "When you confirm your documentation, its dated version will appear here."
      )
    ).not.toBeInTheDocument();
    expect(confirmDocumentation).not.toHaveBeenCalled();
    view.unmount();
    view.client.clear();
  });

  it("shows rejection beside confirmation and requires readback plus a fresh explicit retry", async () => {
    const context = documentationFixture();
    jest.mocked(confirmDocumentation).mockRejectedValueOnce({ status: 422 });
    jest
      .mocked(getDocumentationContext)
      .mockResolvedValueOnce(context)
      .mockResolvedValueOnce(context)
      .mockResolvedValueOnce(recordedContext(context));
    const view = renderLiveReview(context);
    clickConfirm();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We could not verify your confirmation. It may have been recorded."
    );
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("checkbox")).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Check confirmation status" })
    );
    await waitFor(() => expect(screen.getByRole("checkbox")).toBeEnabled());
    expect(confirmDocumentation).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(/This saved version has no recorded confirmation/)
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(
      screen.getByRole("button", { name: "Confirm this version" })
    ).toBeDisabled();
    clickConfirm();
    expect(
      await screen.findByText(
        /Your confirmation is recorded for this saved version/
      )
    ).toBeInTheDocument();
    expect(confirmDocumentation).toHaveBeenCalledTimes(2);
    expect(jest.mocked(confirmDocumentation).mock.calls[1]?.[1]).toEqual(
      jest.mocked(confirmDocumentation).mock.calls[0]?.[1]
    );
    view.unmount();
    view.client.clear();
  });

  it("recovers a successful POST with a failed readback without attesting again", async () => {
    const context = documentationFixture();
    jest.mocked(confirmDocumentation).mockResolvedValue({} as never);
    jest
      .mocked(getDocumentationContext)
      .mockRejectedValueOnce(new Error("connection lost"))
      .mockResolvedValue(recordedContext(context));
    const view = renderLiveReview(context);
    clickConfirm();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "It may have been recorded"
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Check confirmation status" })
    );
    expect(
      await screen.findByText(
        /Your confirmation is recorded for this saved version/
      )
    ).toBeInTheDocument();
    expect(confirmDocumentation).toHaveBeenCalledTimes(1);
    expect(getDocumentationContext).toHaveBeenCalledTimes(3);
    view.unmount();
    view.client.clear();
  });

  it("keeps an uncertain result blocked when status readback fails too", async () => {
    jest
      .mocked(confirmDocumentation)
      .mockRejectedValue(new Error("connection lost"));
    jest
      .mocked(getDocumentationContext)
      .mockRejectedValue(new Error("still offline"));
    const view = renderLiveReview();
    clickConfirm();
    await screen.findByRole("alert");
    fireEvent.click(
      screen.getByRole("button", { name: "Check confirmation status" })
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We could not verify your confirmation"
    );
    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(confirmDocumentation).toHaveBeenCalledTimes(1);
    view.unmount();
    view.client.clear();
  });

  it("requires a new review when the version changes after the checkbox was ticked", () => {
    const context = documentationFixture();
    const controller = new DocumentationDraftController(
      context,
      { read: jest.fn(), save: jest.fn() },
      jest.fn()
    );
    const client = new QueryClient();
    const view = (current: ApiArtworkDocumentationContext) => (
      <QueryClientProvider client={client}>
        <DocumentationReview
          context={current}
          controller={controller}
          saveState="clean"
          onNavigateSection={jest.fn()}
        />
      </QueryClientProvider>
    );
    const rendered = render(view(context));
    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("checkbox")).toBeChecked();
    rendered.rerender(
      view({ ...context, draft_version: context.draft_version + 1 })
    );
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(
      screen.getByRole("button", { name: "Confirm this version" })
    ).toBeDisabled();
    expect(screen.getByText(/This record has changed/)).toBeInTheDocument();
    expect(confirmDocumentation).not.toHaveBeenCalled();
    controller.dispose();
    client.clear();
  });

  it("does not show an earlier confirmation as current for a newer draft", () => {
    const context = {
      ...recordedContext(documentationFixture()),
      confirmation_status: "newer_draft" as never,
      draft_version: 2,
    };
    const view = renderLiveReview(context);
    expect(
      screen.queryByText(/Your confirmation is recorded for this saved version/)
    ).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeEnabled();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    view.unmount();
    view.client.clear();
  });

  it("requires sign-in recovery before checking an unauthorized confirmation response", async () => {
    const context = documentationFixture();
    jest.mocked(confirmDocumentation).mockRejectedValueOnce({ status: 401 });
    jest.mocked(getDocumentationContext).mockResolvedValue(context);
    mockRequestAuth
      .mockResolvedValueOnce({ success: false })
      .mockResolvedValueOnce({ success: true });
    const view = renderLiveReview(context);
    clickConfirm();
    await screen.findByRole("alert");
    fireEvent.click(
      screen.getByRole("button", { name: "Check confirmation status" })
    );
    await waitFor(() => expect(mockRequestAuth).toHaveBeenCalledTimes(1));
    expect(getDocumentationContext).not.toHaveBeenCalled();
    await screen.findByRole("alert");
    fireEvent.click(
      screen.getByRole("button", { name: "Check confirmation status" })
    );
    await waitFor(() => expect(screen.getByRole("checkbox")).toBeEnabled());
    expect(mockRequestAuth).toHaveBeenCalledTimes(2);
    expect(confirmDocumentation).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    view.unmount();
    view.client.clear();
  });
  it("keeps one confirmation in flight when the action is clicked twice", async () => {
    const context = documentationFixture();
    let finish!: () => void;
    jest.mocked(confirmDocumentation).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = () => resolve({} as never);
        })
    );
    jest
      .mocked(getDocumentationContext)
      .mockResolvedValue(recordedContext(context));
    const view = renderLiveReview(context);
    fireEvent.click(screen.getByRole("checkbox"));
    const button = screen.getByRole("button", { name: "Confirm this version" });
    act(() => {
      fireEvent.click(button);
      fireEvent.click(button);
    });
    await waitFor(() => expect(confirmDocumentation).toHaveBeenCalledTimes(1));
    expect(
      screen.getByText("Recording your confirmation…")
    ).toBeInTheDocument();
    await act(async () => finish());
    expect(
      await screen.findByText(
        /Your confirmation is recorded for this saved version/
      )
    ).toBeInTheDocument();
    view.unmount();
    view.client.clear();
  });

  it("does not attest when a queued save reveals a newer version after the click", async () => {
    const context = documentationFixture();
    const controller = new DocumentationDraftController(
      context,
      { read: jest.fn(), save: jest.fn() },
      jest.fn()
    );
    const client = new QueryClient();
    jest.spyOn(controller, "mutate").mockImplementation(async (action) => {
      await action(
        { ...context, draft_version: 2 },
        new AbortController().signal
      );
      return true;
    });
    render(
      <QueryClientProvider client={client}>
        <DocumentationReview
          context={context}
          controller={controller}
          saveState="clean"
          onNavigateSection={jest.fn()}
        />
      </QueryClientProvider>
    );
    clickConfirm();
    await waitFor(() => expect(screen.getByRole("checkbox")).not.toBeChecked());
    expect(confirmDocumentation).not.toHaveBeenCalled();
    expect(
      screen.queryByText(/Your confirmation is recorded/)
    ).not.toBeInTheDocument();
    controller.dispose();
    client.clear();
  });

  it("uses the named-field recovery callback for a missing answer", () => {
    const context = documentationFixture();
    context.modules["artwork"]!.completeness.missing = ["artwork.title"];
    const controller = new DocumentationDraftController(
      context,
      { read: jest.fn(), save: jest.fn() },
      jest.fn()
    );
    const client = new QueryClient();
    const onNavigateSection = jest.fn();
    const onNavigateField = jest.fn();
    render(
      <QueryClientProvider client={client}>
        <DocumentationReview
          context={context}
          controller={controller}
          saveState="clean"
          onNavigateSection={onNavigateSection}
          onNavigateField={onNavigateField}
        />
      </QueryClientProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "Title" }));
    expect(onNavigateField).toHaveBeenCalledWith("artwork", "title");
    expect(onNavigateSection).not.toHaveBeenCalled();
    controller.dispose();
    client.clear();
  });
  it("uses neutral readback recovery after an unknown rejected action", async () => {
    const context = documentationFixture();
    const controller = new DocumentationDraftController(
      context,
      { read: jest.fn().mockResolvedValue(context), save: jest.fn() },
      jest.fn()
    );
    await controller.mutate(async () => {
      throw { status: 422 };
    });
    const client = new QueryClient();
    const view = (saveState: "invalid" | "clean") => (
      <QueryClientProvider client={client}>
        <DocumentationReview
          context={context}
          controller={controller}
          saveState={saveState}
          onNavigateSection={jest.fn()}
        />
      </QueryClientProvider>
    );
    const rendered = render(view("invalid"));
    expect(
      screen.getByText(/The last action could not be verified/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await act(async () => {
      await controller.retry();
    });
    rendered.rerender(view("clean"));
    expect(
      screen.getByText(/The last action could not be verified/)
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Check confirmation status" })
    ).toBeEnabled();
    expect(confirmDocumentation).not.toHaveBeenCalled();
    controller.dispose();
    client.clear();
  });

  it("keeps a recorded confirmation authoritative after another mutation fails", async () => {
    const context = recordedContext(documentationFixture());
    const controller = new DocumentationDraftController(
      context,
      { read: jest.fn(), save: jest.fn() },
      jest.fn()
    );
    await controller.mutate(async () => {
      throw { status: 422 };
    });
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <DocumentationReview
          context={context}
          controller={controller}
          saveState="invalid"
          onNavigateSection={jest.fn()}
        />
      </QueryClientProvider>
    );
    expect(
      screen.getByText(/Your confirmation is recorded for this saved version/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The last action could not be verified/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Check confirmation status" })
    ).not.toBeInTheDocument();
    expect(confirmDocumentation).not.toHaveBeenCalled();
    controller.dispose();
    client.clear();
  });

  it("keeps failed readback neutral when no confirmation was attempted", async () => {
    const context = documentationFixture();
    const controller = new DocumentationDraftController(
      context,
      { read: getDocumentationContext, save: jest.fn() },
      jest.fn()
    );
    await controller.mutate(async () => {
      throw { status: 422 };
    });
    jest
      .mocked(getDocumentationContext)
      .mockRejectedValue(new Error("offline"));
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <DocumentationReview
          context={context}
          controller={controller}
          saveState="invalid"
          onNavigateSection={jest.fn()}
        />
      </QueryClientProvider>
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Check confirmation status" })
    );
    await waitFor(() =>
      expect(getDocumentationContext).toHaveBeenCalledTimes(1)
    );
    await waitFor(() =>
      expect(
        screen.queryByText("Checking your saved confirmation…")
      ).not.toBeInTheDocument()
    );
    expect(
      screen.getByText(/The last action could not be verified/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(confirmDocumentation).not.toHaveBeenCalled();
    controller.dispose();
    client.clear();
  });

  it("replaces an uncertain confirmation notice when conflict recovery reads the confirmed version", async () => {
    const context = documentationFixture();
    jest.mocked(confirmDocumentation).mockRejectedValueOnce({ status: 409 });
    jest
      .mocked(getDocumentationContext)
      .mockResolvedValue(recordedContext(context));
    const view = renderLiveReview(context);
    clickConfirm();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We could not verify your confirmation"
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Use latest saved version" })
    );
    expect(
      await screen.findByText(
        /Your confirmation is recorded for this saved version/
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/This saved version has no recorded confirmation/)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Check confirmation status" })
    ).not.toBeInTheDocument();
    expect(confirmDocumentation).toHaveBeenCalledTimes(1);
    view.unmount();
    view.client.clear();
  });

  it.each(["post", "readback"] as const)(
    "recovers a delayed %s failure through generic retry after the Review remounts",
    async (phase) => {
      const context = documentationFixture();
      let fail!: (error: Error) => void;
      const pending = new Promise<never>((_, reject) => {
        fail = reject;
      });
      if (phase === "post")
        jest.mocked(confirmDocumentation).mockReturnValueOnce(pending);
      else {
        jest.mocked(confirmDocumentation).mockResolvedValueOnce({} as never);
        jest.mocked(getDocumentationContext).mockReturnValueOnce(pending);
      }
      jest
        .mocked(getDocumentationContext)
        .mockResolvedValue(recordedContext(context));
      const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const view = (reviewKey: string) => (
        <QueryClientProvider client={client}>
          <LiveReview initial={context} reviewKey={reviewKey} />
        </QueryClientProvider>
      );
      const rendered = render(view("before-navigation"));
      try {
        clickConfirm();
        await waitFor(() =>
          expect(confirmDocumentation).toHaveBeenCalledTimes(1)
        );
        if (phase === "readback")
          await waitFor(() =>
            expect(getDocumentationContext).toHaveBeenCalledTimes(1)
          );
        rendered.rerender(view("after-navigation"));
        await act(async () => {
          fail(new Error("response lost"));
        });
        expect(
          await screen.findByText(/The last action could not be verified/)
        ).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(
          await screen.findByText(
            /Your confirmation is recorded for this saved version/
          )
        ).toBeInTheDocument();
        expect(confirmDocumentation).toHaveBeenCalledTimes(1);
        expect(getDocumentationContext).toHaveBeenCalledTimes(
          phase === "post" ? 1 : 2
        );
        expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
      } finally {
        rendered.unmount();
        client.clear();
      }
    }
  );
});
