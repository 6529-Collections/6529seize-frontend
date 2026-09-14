import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import DocumentationArtistPin from "@/components/artwork-documentation/DocumentationArtistPin";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import {
  getDocumentationArtistRecord,
  pinDocumentationArtistRecord,
} from "@/services/api/artwork-documentation-api";
import museumProfile from "@/__tests__/fixtures/artwork-documentation-profile-v3.json";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/artwork-documentation-api", () => ({
  ...jest.requireActual("@/services/api/artwork-documentation-api"),
  pinDocumentationArtistRecord: jest.fn(),
  getDocumentationArtistRecord: jest.fn(),
}));
jest.mock("@/components/artwork-documentation/DocumentationAuthGate", () => ({
  useDocumentationActor: () => ({
    actorKey: "artist",
    connectedProfile: { id: "artist" },
  }),
}));
beforeEach(() => jest.clearAllMocks());
function QueryWrapper({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {children}
    </QueryClientProvider>
  );
}

it.each([false, true])(
  "does not offer artist information import to a non-artist with identity editing=%s",
  (canEditIdentity) => {
    const context = documentationFixture();
    context.mutation_capabilities.confirm_as_artist = false;
    if (!canEditIdentity) context.mutation_capabilities.edit_modules = [];
    context.available_artist_record = {
      id: "new-artist-record",
      record_version: 2,
      answers: {},
    };
    const controller = new DocumentationDraftController(
      context,
      { read: jest.fn(), save: jest.fn() },
      jest.fn()
    );
    const { container } = render(
      <DocumentationArtistPin context={context} controller={controller} />
    );
    expect(container).toBeEmptyDOMElement();
    controller.dispose();
  }
);

it("lets the artist explicitly adopt the available identity record", async () => {
  const context = documentationFixture();
  context.available_artist_record = {
    id: "new-artist-record",
    record_version: 2,
    answers: {},
  };
  jest.mocked(pinDocumentationArtistRecord).mockResolvedValue({
    ...context,
    artist_record_revision_id: "new-artist-record",
    draft_version: 2,
  });
  const controller = new DocumentationDraftController(
    context,
    { read: jest.fn(), save: jest.fn() },
    jest.fn()
  );
  render(<DocumentationArtistPin context={context} controller={controller} />, {
    wrapper: QueryWrapper,
  });
  fireEvent.click(
    screen.getByText("Use updated artist information", { selector: "summary" })
  );
  fireEvent.click(screen.getByRole("button"));
  await waitFor(() =>
    expect(pinDocumentationArtistRecord).toHaveBeenCalledWith(
      context,
      "new-artist-record",
      expect.any(AbortSignal)
    )
  );
  controller.dispose();
});

it("fetches a deferred artist revision only on comparison and enables adoption after the complete revision arrives", async () => {
  const context = documentationFixture();
  context.available_artist_record = {
    id: "new-artist-record",
    record_version: 2,
    answers: {},
    deferred: true,
  };
  jest
    .mocked(getDocumentationArtistRecord)
    .mockResolvedValue({
      ...context.available_artist_record,
      deferred: false,
      answers: {},
    });
  const controller = new DocumentationDraftController(
    context,
    { read: jest.fn(), save: jest.fn() },
    jest.fn()
  );
  render(<DocumentationArtistPin context={context} controller={controller} />, {
    wrapper: QueryWrapper,
  });
  expect(getDocumentationArtistRecord).not.toHaveBeenCalled();
  expect(screen.queryByRole("button")).toBeNull();
  fireEvent.click(
    screen.getByText("Use updated artist information", { selector: "summary" })
  );
  await screen.findByRole("button", { name: "Use updated artist information" });
  expect(getDocumentationArtistRecord).toHaveBeenCalledWith(
    context.id,
    "new-artist-record",
    expect.any(AbortSignal)
  );
  expect(pinDocumentationArtistRecord).not.toHaveBeenCalled();
  controller.dispose();
});

it("does not expose or adopt restricted deferred answers in a publication-only record", async () => {
  const context = documentationFixture();
  context.profile = museumProfile as never;
  context.available_artist_record = {
    id: "new-artist-record",
    record_version: 2,
    answers: {},
    deferred: true,
  };
  jest
    .mocked(getDocumentationArtistRecord)
    .mockResolvedValue({
      ...context.available_artist_record,
      deferred: false,
      answers: {
        private_contact: {
          status: "provided",
          value: "Do not expose",
          intended_visibility: "restricted",
        },
      },
    } as never);
  const controller = new DocumentationDraftController(
    context,
    { read: jest.fn(), save: jest.fn() },
    jest.fn()
  );
  render(<DocumentationArtistPin context={context} controller={controller} />, {
    wrapper: QueryWrapper,
  });
  fireEvent.click(
    screen.getByText("Use updated artist information", { selector: "summary" })
  );
  await waitFor(() =>
    expect(getDocumentationArtistRecord).toHaveBeenCalledTimes(1)
  );
  await screen.findByText(/cannot be reused|publication|private/i, {
    selector: "p",
  });
  expect(screen.queryByText("Do not expose")).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Use updated artist information" })
  ).toBeNull();
  expect(pinDocumentationArtistRecord).not.toHaveBeenCalled();
  controller.dispose();
});

it("keeps incomplete or mismatched deferred revisions unavailable for adoption and offers retry", async () => {
  const context = documentationFixture();
  context.available_artist_record = {
    id: "new-artist-record",
    record_version: 2,
    answers: {},
    deferred: true,
  };
  jest
    .mocked(getDocumentationArtistRecord)
    .mockResolvedValue({
      ...context.available_artist_record,
      id: "wrong-revision",
      deferred: false,
    });
  const controller = new DocumentationDraftController(
    context,
    { read: jest.fn(), save: jest.fn() },
    jest.fn()
  );
  render(<DocumentationArtistPin context={context} controller={controller} />, {
    wrapper: QueryWrapper,
  });
  fireEvent.click(
    screen.getByText("Use updated artist information", { selector: "summary" })
  );
  await screen.findByRole("button", { name: "Try again" });
  expect(
    screen.queryByRole("button", { name: "Use updated artist information" })
  ).toBeNull();
  expect(pinDocumentationArtistRecord).not.toHaveBeenCalled();
  controller.dispose();
});
