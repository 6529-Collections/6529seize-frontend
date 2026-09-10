import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DocumentationFeedback from "@/components/artwork-documentation/DocumentationFeedback";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import {
  getDocumentationThreads,
  resolveDocumentationThread,
  createDocumentationThread,
} from "@/services/api/artwork-documentation-api";

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
  getDocumentationThreads: jest.fn(),
  resolveDocumentationThread: jest.fn().mockResolvedValue({}),
  createDocumentationThread: jest.fn().mockResolvedValue({}),
}));

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
