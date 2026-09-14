import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DocumentationSources from "@/components/artwork-documentation/DocumentationSources";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import {
  getDocumentationSourcePreview,
  importDocumentationSource,
} from "@/services/api/artwork-documentation-api";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/artwork-documentation/DocumentationAuthGate", () => ({
  useDocumentationActor: () => ({
    actorKey: "editor",
    connectedProfile: { id: "editor" },
  }),
}));
jest.mock("@/services/api/artwork-documentation-api", () => ({
  ...jest.requireActual("@/services/api/artwork-documentation-api"),
  getDocumentationSourcePreview: jest.fn(),
  importDocumentationSource: jest.fn(),
}));

it.each([
  "viewer-only receipt",
  "restricted historical target",
  "restricted proposed answer",
])("keeps a %s readable without enabling source import", async (scenario) => {
  const context = documentationFixture();
  context.source_links = [{ source_receipt_id: "receipt" }] as never;
  context.mutation_capabilities.confirm_as_artist = false;
  context.mutation_capabilities.read_restricted_fields = false;
  if (scenario === "viewer-only receipt")
    context.mutation_capabilities.read_source_receipts = false;
  else if (scenario === "restricted historical target")
    context.mutation_restricted_paths = ["artwork.title"];
  jest.mocked(getDocumentationSourcePreview).mockResolvedValue({
    source_receipt_id: "receipt",
    receipt_text: "Original source text",
    fields: [
      {
        source_path: "title",
        target_field: "artwork.title",
        answer: {
          status: "provided",
          value: "Source title",
          intended_visibility:
            scenario === "restricted proposed answer"
              ? "restricted"
              : "public_record",
        },
        will_overwrite: true,
      },
    ],
  } as never);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const controller = new DocumentationDraftController(
    context,
    {
      save: jest.fn(async () => context),
      read: jest.fn(async () => context),
    },
    jest.fn()
  );
  render(
    <QueryClientProvider client={client}>
      <DocumentationSources context={context} controller={controller} />
    </QueryClientProvider>
  );
  await screen.findByText("Original source text");
  expect(
    screen.queryByRole("checkbox", { hidden: true })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { hidden: true })
  ).not.toBeInTheDocument();
  expect(importDocumentationSource).not.toHaveBeenCalled();
  controller.dispose();
  client.clear();
});

it.each([false, true])(
  "rechecks source import permissions after selection when access changes=%s",
  async (changed) => {
    jest.clearAllMocks();
    const context = documentationFixture();
    context.source_links = [{ source_receipt_id: "receipt" }] as never;
    context.mutation_capabilities.confirm_as_artist = false;
    jest.mocked(getDocumentationSourcePreview).mockResolvedValue({
      receipt_text: "Original source text",
      fields: [
        {
          source_path: "title",
          target_field: "artwork.title",
          answer: {
            status: "provided",
            value: "Source title",
            intended_visibility: "restricted",
          },
        },
      ],
    } as never);
    jest.mocked(importDocumentationSource).mockResolvedValue(context);
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const controller = new DocumentationDraftController(
      context,
      {
        save: jest.fn(async () => context),
        read: jest.fn(async () => context),
      },
      jest.fn()
    );
    render(
      <QueryClientProvider client={client}>
        <DocumentationSources context={context} controller={controller} />
      </QueryClientProvider>
    );
    await screen.findByText("Original source text");
    fireEvent.click(screen.getByRole("checkbox", { hidden: true }));
    if (changed) context.mutation_capabilities.read_restricted_fields = false;
    fireEvent.click(screen.getByRole("button", { hidden: true }));
    if (changed) {
      await waitFor(() =>
        expect(controller.snapshot().state).toBe("auth_expired")
      );
      expect(importDocumentationSource).not.toHaveBeenCalled();
    } else
      await waitFor(() =>
        expect(importDocumentationSource).toHaveBeenCalledTimes(1)
      );
    controller.dispose();
    client.clear();
  }
);
