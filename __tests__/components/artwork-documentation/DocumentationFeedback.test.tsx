import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DocumentationFeedback from "@/components/artwork-documentation/DocumentationFeedback";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import {
  getDocumentationThreads,
  resolveDocumentationThread,
  createDocumentationThread,
  commentDocumentationThread,
} from "@/services/api/artwork-documentation-api";
import {
  ApiArtworkDocumentationCapabilitiesEditModulesEnum,
  ApiArtworkDocumentationCapabilitiesReviewLanesEnum,
  type ApiArtworkDocumentationCapabilities,
} from "@/generated/models/ApiArtworkDocumentationCapabilities";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/identity-query", () => ({
  getIdentityQueryOptions: ({
    handleOrWallet,
  }: {
    handleOrWallet: string;
  }) => ({
    queryKey: ["identity", handleOrWallet],
    queryFn: async () => ({ handle: "DocumentationArtist" }),
  }),
}));
jest.mock("@/components/artwork-documentation/DocumentationAuthGate", () => ({
  useDocumentationActor: () => ({
    actorKey: "artist-a",
    connectedProfile: { id: "artist-a" },
  }),
}));
jest.mock("@/services/api/artwork-documentation-api", () => ({
  ...jest.requireActual("@/services/api/artwork-documentation-api"),
  getDocumentationThreads: jest.fn(),
  resolveDocumentationThread: jest.fn().mockResolvedValue({}),
  createDocumentationThread: jest.fn().mockResolvedValue({}),
  commentDocumentationThread: jest.fn().mockResolvedValue({}),
}));

function viewerContext() {
  const context = documentationFixture();
  context.profile.intake_mode = "publication_only" as never;
  context.profile.version = 2;
  context.capabilities = {
    ...context.capabilities,
    read_restricted_fields: true,
    confirm_as_artist: false,
    edit_modules: [],
    review_lanes: [],
    manage_context: false,
    manage_assignments: false,
  };
  context.mutation_capabilities = {
    ...context.capabilities,
    read_archival_files: false,
    read_rights_evidence: false,
    read_source_receipts: false,
    read_contact: false,
    read_restricted_fields: false,
  };
  return context;
}

function mockDiscussion(resolved = false, restrictedClass = "ordinary") {
  jest.mocked(getDocumentationThreads).mockResolvedValue({
    data: [
      {
        id: "thread",
        context_id: "context",
        thread_version: 1,
        resolved,
        audience: "artist_and_reviewers",
        restricted_class: restrictedClass,
        comments: [
          {
            id: "comment",
            text: "Prior discussion",
            actor_profile_id: "artist-a",
            created_at: 1788998400000,
          },
        ],
      },
    ],
  } as never);
}

it.each([
  ["publication questions", true, false],
  ["resolved publication questions", true, true],
  ["legacy feedback", false, false],
  ["resolved legacy feedback", false, true],
])(
  "lets a viewer read %s without conversation actions",
  async (_, publication, resolved) => {
    jest.clearAllMocks();
    const context = viewerContext();
    if (!publication) delete context.profile.intake_mode;
    mockDiscussion(Boolean(resolved));
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <DocumentationFeedback context={context} />
      </QueryClientProvider>
    );
    await screen.findByText("Prior discussion");
    await screen.findByText("@DocumentationArtist");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(createDocumentationThread).not.toHaveBeenCalled();
    expect(commentDocumentationThread).not.toHaveBeenCalled();
    expect(resolveDocumentationThread).not.toHaveBeenCalled();
    client.clear();
  }
);

const writerRoles: [string, Partial<ApiArtworkDocumentationCapabilities>][] = [
  ["artist", { confirm_as_artist: true }],
  [
    "editor",
    {
      edit_modules: [
        ApiArtworkDocumentationCapabilitiesEditModulesEnum.Artwork,
      ],
    },
  ],
  [
    "reviewer",
    {
      review_lanes: [
        ApiArtworkDocumentationCapabilitiesReviewLanesEnum.Curatorial,
      ],
    },
  ],
  ["context coordinator", { manage_context: true }],
  ["assignment coordinator", { manage_assignments: true }],
];

it("lets an authorized coordinator create a reviewers-only conversation", async () => {
  jest.clearAllMocks();
  const context = viewerContext();
  delete context.profile.intake_mode;
  context.mutation_capabilities.manage_context = true;
  mockDiscussion();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <DocumentationFeedback context={context} />
    </QueryClientProvider>
  );
  await screen.findByText("Prior discussion");
  fireEvent.change(
    screen.getAllByRole("textbox", { name: "Your comment" }).at(-1)!,
    {
      target: { value: "A curatorial question" },
    }
  );
  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "reviewers_only" },
  });
  fireEvent.click(
    screen.getAllByRole("button", { name: "Add comment" }).at(-1)!
  );
  await waitFor(() =>
    expect(createDocumentationThread).toHaveBeenCalledWith(context.id, {
      text: "A curatorial question",
      audience: "reviewers_only",
      restricted_class: "ordinary",
    })
  );
  client.clear();
});

it.each(["rights", "archival", "contact"])(
  "lets a mixed viewer/editor read a %s thread without replying or resolving",
  async (restricted_class) => {
    const context = viewerContext();
    delete context.profile.intake_mode;
    context.mutation_capabilities.edit_modules = [
      ApiArtworkDocumentationCapabilitiesEditModulesEnum.Artwork,
    ];
    mockDiscussion(false, restricted_class);
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <DocumentationFeedback context={context} />
      </QueryClientProvider>
    );
    await screen.findByText("Prior discussion");
    expect(
      screen.getAllByRole("textbox", { name: "Your comment" })
    ).toHaveLength(1);
    expect(
      screen.queryByRole("button", { name: "Resolve conversation" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: "Intended visibility" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add comment" })).toBeDisabled();
    client.clear();
  }
);

it.each(writerRoles)(
  "preserves discussion participation for a %s",
  async (_, capabilities) => {
    jest.clearAllMocks();
    const context = viewerContext();
    Object.assign(context.mutation_capabilities, capabilities);
    mockDiscussion();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <DocumentationFeedback context={context} />
      </QueryClientProvider>
    );
    await screen.findByText("Prior discussion");
    fireEvent.change(
      screen.getByRole("textbox", { name: "What would you like to ask?" }),
      { target: { value: "My question" } }
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Send question to the team" })
    );
    await waitFor(() =>
      expect(createDocumentationThread).toHaveBeenCalledWith(context.id, {
        text: "My question",
        audience: "artist_and_reviewers",
        restricted_class: "ordinary",
      })
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Your comment" }), {
      target: { value: "My reply" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add comment" }));
    await waitFor(() =>
      expect(commentDocumentationThread).toHaveBeenCalledWith(
        context.id,
        "thread",
        "My reply"
      )
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Resolve conversation" })
      ).toBeEnabled()
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Resolve conversation" })
    );
    await waitFor(() =>
      expect(resolveDocumentationThread).toHaveBeenCalledWith(
        context.id,
        "thread",
        1,
        true
      )
    );
    client.clear();
  }
);

it.each([false, true])(
  "preserves an unsent comment when toggling resolved=%s",
  async (resolved) => {
    jest.mocked(resolveDocumentationThread).mockClear();
    jest.mocked(getDocumentationThreads).mockResolvedValue({
      data: [
        {
          id: "thread",
          context_id: "context",
          thread_version: 1,
          resolved,
          audience: "artist_and_reviewers",
          restricted_class: "ordinary",
          comments: [
            {
              id: "comment",
              text: "Prior discussion",
              actor_profile_id: "artist-a",
              created_at: 1788998400000,
            },
          ],
        },
      ],
    } as never);
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <DocumentationFeedback context={documentationFixture()} />
      </QueryClientProvider>
    );
    await screen.findByText("Prior discussion");
    const input = screen.getAllByRole("textbox", { name: "Your comment" })[0]!;
    fireEvent.change(input, { target: { value: "My unsent comment" } });
    fireEvent.click(
      screen.getByRole("button", {
        name: resolved ? "Reopen conversation" : "Resolve conversation",
      })
    );
    await waitFor(() => expect(resolveDocumentationThread).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: resolved ? "Reopen conversation" : "Resolve conversation",
        })
      ).toBeEnabled()
    );
    expect(input).toHaveValue("My unsent comment");
    client.clear();
  }
);

it("sends publication drafting questions outside the artwork revision and preserves a failed question", async () => {
  const context = documentationFixture();
  context.profile.intake_mode = "publication_only" as never;
  context.profile.version = 2;
  context.latest_revision_id = "confirmed-artwork";
  jest.mocked(getDocumentationThreads).mockResolvedValue({ data: [] } as never);
  jest
    .mocked(createDocumentationThread)
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({});
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <DocumentationFeedback context={context} />
    </QueryClientProvider>
  );
  await screen.findByText(
    "No questions yet. You can return here whenever you need help."
  );
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  const input = screen.getByRole("textbox", {
    name: "What would you like to ask?",
  });
  fireEvent.change(input, {
    target: { value: "Which final file should I choose?" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Send question to the team" })
  );
  await screen.findByRole("alert");
  expect(input).toHaveValue("Which final file should I choose?");
  expect(createDocumentationThread).toHaveBeenLastCalledWith(context.id, {
    text: "Which final file should I choose?",
    audience: "artist_and_reviewers",
    restricted_class: "ordinary",
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Send question to the team" })
  );
  await waitFor(() => expect(input).toHaveValue(""));
  expect(context.latest_revision_id).toBe("confirmed-artwork");
  expect(context.modules["context"]!.answers).toEqual({});
  client.clear();
});

it("keeps resolved publication questions available without mixing revision feedback into the conversation", async () => {
  const context = documentationFixture();
  context.profile.intake_mode = "publication_only" as never;
  context.profile.version = 2;
  jest.mocked(getDocumentationThreads).mockResolvedValue({
    data: [
      {
        id: "answered-question",
        context_id: context.id,
        field_path: null,
        revision_id: null,
        thread_version: 2,
        resolved: true,
        audience: "artist_and_reviewers",
        restricted_class: "ordinary",
        comments: [
          {
            id: "answer",
            actor_profile_id: "artist-a",
            text: "The team clarified which display instructions to use.",
            created_at: 1788998400000,
          },
        ],
      },
      {
        id: "revision-feedback",
        context_id: context.id,
        field_path: "artwork.title",
        revision_id: "confirmed-artwork",
        thread_version: 1,
        resolved: false,
        audience: "artist_and_reviewers",
        restricted_class: "ordinary",
        comments: [
          {
            id: "revision-comment",
            actor_profile_id: "artist-a",
            text: "Feedback about the prior artwork title.",
            created_at: 1788998400000,
          },
        ],
      },
    ],
  } as never);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <DocumentationFeedback context={context} />
    </QueryClientProvider>
  );
  await screen.findByText(
    "The team clarified which display instructions to use."
  );
  expect(
    screen.getByRole("button", { name: "Reopen conversation" })
  ).toBeInTheDocument();
  expect(
    screen.queryByText("Feedback about the prior artwork title.")
  ).not.toBeInTheDocument();
  client.clear();
});
