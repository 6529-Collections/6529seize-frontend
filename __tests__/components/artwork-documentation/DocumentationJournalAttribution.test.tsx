import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DocumentationJournalAttribution from "@/components/artwork-documentation/DocumentationJournalAttribution";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/artwork-documentation/DocumentationAuthGate", () => ({
  useDocumentationActor: () => ({ connectedProfile: mockConnectedProfile }),
}));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));

const profileId = "00000000-0000-4000-8000-000000000901";
let mockConnectedProfile: { id: string; handle: string | null } | null = null;
const clients: QueryClient[] = [];
function show(active = true, id = profileId) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <DocumentationJournalAttribution
        profileId={id}
        createdAt={1788825600000}
        active={active}
      />
    </QueryClientProvider>
  );
}
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
  mockConnectedProfile = null;
  jest.clearAllMocks();
});

it("uses the known matching profile handle without another identity request", () => {
  mockConnectedProfile = { id: profileId, handle: "MuseumRecorder" };
  show();
  expect(screen.getByText(/Recorded by MuseumRecorder/)).toBeInTheDocument();
  expect(commonApiFetch).not.toHaveBeenCalled();
  expect(screen.queryByText(new RegExp(profileId))).toBeNull();
});

it("resolves a different recorder through the ordinary identity API", async () => {
  mockConnectedProfile = { id: "different-profile", handle: "CurrentReader" };
  jest
    .mocked(commonApiFetch)
    .mockResolvedValue({ id: profileId, handle: "OriginalRecorder" });
  show();
  expect(
    await screen.findByText(/Recorded by OriginalRecorder/)
  ).toBeInTheDocument();
  expect(commonApiFetch).toHaveBeenCalledWith({
    endpoint: `identities/${profileId}`,
  });
  expect(screen.queryByText(/CurrentReader/)).toBeNull();
  expect(screen.queryByText(new RegExp(profileId))).toBeNull();
});

it.each(["missing", "mismatched"])(
  "keeps a named role fallback for a %s profile",
  async (outcome) => {
    if (outcome === "missing")
      jest.mocked(commonApiFetch).mockRejectedValue(new Error("Unavailable"));
    else
      jest
        .mocked(commonApiFetch)
        .mockResolvedValue({ id: "another-profile", handle: "WrongRecorder" });
    show();
    await waitFor(() => expect(commonApiFetch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(clients[0]!.isFetching()).toBe(0));
    expect(
      screen.getByText(/Recorded by Museum contributor/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/WrongRecorder/)).toBeNull();
    expect(screen.queryByText(new RegExp(profileId))).toBeNull();
  }
);

it("does not request malformed identifiers or identities for a hidden chapter", () => {
  const first = show(false);
  first.unmount();
  show(true, "not-an-identity-path");
  expect(commonApiFetch).not.toHaveBeenCalled();
  expect(
    screen.getByText(/Recorded by Museum contributor/)
  ).toBeInTheDocument();
});
