import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import ArtworkDocumentationList from "@/components/artwork-documentation/ArtworkDocumentationList";
import type { ApiArtworkDocumentationContextSummary } from "@/generated/models/ApiArtworkDocumentationContextSummary";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { getDocumentationWorks } from "@/services/api/artwork-documentation-api";
import { fetchDropsV2ByIds } from "@/services/api/wave-drops-v2-api";

const mockAccess = {
  enabled: true,
  profiles: [],
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/artwork-documentation/DocumentationAuthGate", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: ReactNode }) => children,
  useDocumentationActor: () => ({
    actorKey: "viewer",
    connectedProfile: { id: "viewer" },
  }),
}));
jest.mock("@/hooks/artwork-documentation/useArtworkDocumentationAccess", () => ({
  useArtworkDocumentationAccess: () => mockAccess,
  documentationQueryKey: (...parts: string[]) => ["documentation", ...parts],
}));
jest.mock("@/services/api/artwork-documentation-api", () => ({
  getDocumentationWorks: jest.fn(),
}));
jest.mock("@/services/api/wave-drops-v2-api", () => ({
  fetchDropsV2ByIds: jest.fn(),
}));
jest.mock("@/components/artwork-documentation/DocumentationListRecord", () => ({
  __esModule: true,
  default: ({
    record,
    sourceDrop,
  }: {
    readonly record: ApiArtworkDocumentationContextSummary;
    readonly sourceDrop?: ApiDrop;
  }) => (
    <article>
      <h2>{record.title}</h2>
      {sourceDrop && <p>{sourceDrop.title}</p>}
    </article>
  ),
}));

function record(id: string): ApiArtworkDocumentationContextSummary {
  return {
    id,
    work_id: `work-${id}`,
    program_id: "6529NM-AP-01",
    owner_profile_id: `artist-${id}`,
    artist_display_name: "Example artist",
    artist_preferred_credit: null,
    source_submission: {
      drop_id: `drop-${id}`,
      wave_id: "wave",
      source_receipt_id: `receipt-${id}`,
      title: `Original submission ${id}`,
    },
    title: `Artwork ${id}`,
    draft_version: 1,
    confirmation_status: "unconfirmed",
    latest_revision_id: null,
    lifecycle: "active",
    updated_at: 1,
    profile_id: "profile",
    profile_version: 1,
    reviews: [],
  };
}

function renderList() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const result = render(
    <QueryClientProvider client={client}>
      <ArtworkDocumentationList programId="6529NM-AP-01" />
    </QueryClientProvider>
  );
  return { ...result, client };
}

beforeEach(() => {
  jest.resetAllMocks();
  mockAccess.enabled = true;
  mockAccess.isError = false;
});

it("announces a failed source fetch and retries while retaining loaded records", async () => {
  const user = userEvent.setup();
  const records = [record("one"), record("two")];
  jest.mocked(getDocumentationWorks).mockResolvedValue({
    data: records,
    next_cursor: null,
  });
  let resolveSources!: (drops: ApiDrop[]) => void;
  const recovery = new Promise<ApiDrop[]>((resolve) => {
    resolveSources = resolve;
  });
  jest
    .mocked(fetchDropsV2ByIds)
    .mockRejectedValueOnce(new Error("Source unavailable"))
    .mockReturnValueOnce(recovery);
  const { unmount, client } = renderList();

  const alert = await screen.findByRole("alert");
  const firstRecord = screen.getByRole("heading", { name: "Artwork one" });
  expect(screen.getByRole("heading", { name: "Artwork two" })).toBeVisible();
  await user.click(within(alert).getByRole("button", { name: "Try again" }));
  await waitFor(() => expect(fetchDropsV2ByIds).toHaveBeenCalledTimes(2));
  expect(screen.getByRole("heading", { name: "Artwork one" })).toBe(firstRecord);
  expect(screen.getByRole("heading", { name: "Artwork two" })).toBeVisible();

  await act(async () => {
    resolveSources([
      { id: "drop-one", title: "Recovered source one" } as ApiDrop,
      { id: "drop-two", title: "Recovered source two" } as ApiDrop,
    ]);
    await recovery;
  });
  expect(await screen.findByText("Recovered source one")).toBeVisible();
  expect(screen.getByText("Recovered source two")).toBeVisible();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Artwork one" })).toBe(firstRecord);
  expect(fetchDropsV2ByIds).toHaveBeenLastCalledWith({
    dropIds: ["drop-one", "drop-two"],
    signal: expect.any(AbortSignal),
  });
  unmount();
  client.clear();
});

it("does not fetch sources through Retry after access is disabled", async () => {
  const user = userEvent.setup();
  jest.mocked(getDocumentationWorks).mockResolvedValue({
    data: [record("one")],
    next_cursor: null,
  });
  jest.mocked(fetchDropsV2ByIds).mockRejectedValue(new Error("Source unavailable"));
  const { rerender, unmount, client } = renderList();
  await screen.findByRole("alert");
  expect(fetchDropsV2ByIds).toHaveBeenCalledTimes(1);
  mockAccess.enabled = false;
  mockAccess.isError = true;
  rerender(
    <QueryClientProvider client={client}>
      <ArtworkDocumentationList programId="6529NM-AP-01" />
    </QueryClientProvider>
  );
  await user.click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() => expect(getDocumentationWorks).toHaveBeenCalledTimes(2));
  expect(fetchDropsV2ByIds).toHaveBeenCalledTimes(1);
  unmount();
  client.clear();
});
