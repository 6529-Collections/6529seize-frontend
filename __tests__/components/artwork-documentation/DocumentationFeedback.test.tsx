import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DocumentationFeedback from "@/components/artwork-documentation/DocumentationFeedback";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import {
  getDocumentationThreads,
  resolveDocumentationThread,
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
}));

it.each([false, true])(
  "preserves an unsent comment when toggling resolved=%s",
  async (resolved) => {
    jest.mocked(resolveDocumentationThread).mockClear();
    jest
      .mocked(getDocumentationThreads)
      .mockResolvedValue({
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
