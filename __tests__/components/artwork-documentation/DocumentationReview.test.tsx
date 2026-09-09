import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DocumentationReview from "@/components/artwork-documentation/DocumentationReview";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import { getDocumentationPublicPreview } from "@/services/api/artwork-documentation-api";
import type { ApiArtworkDocumentationPublicPreview } from "@/generated/models/ApiArtworkDocumentationPublicPreview";

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
      />
    </QueryClientProvider>
  );
  expect(screen.getByText("private@example.invalid")).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Preview future public record" })
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
