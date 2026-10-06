import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import WaveMySubmissions from "@/components/waves/leaderboard/WaveMySubmissions";
import { fetchDropV2ById } from "@/services/api/wave-drops-v2-api";

const mockPush = jest.fn();
let mockProfileId = "me";
let mockProxy = false;
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { id: mockProfileId },
    activeProfileProxy: mockProxy ? { id: "proxy" } : null,
  }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/waves/wave",
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("@/services/api/wave-drops-v2-api", () => ({
  fetchDropV2ById: jest.fn(),
}));
jest.mock("@/helpers/waves/wave.helpers", () => ({
  ...jest.requireActual<typeof import("@/helpers/waves/wave.helpers")>(
    "@/helpers/waves/wave.helpers"
  ),
  toApiWaveMin: (wave: ApiWave) => wave,
}));
jest.mock("@/components/waves/leaderboard/MySubmissionsDialog", () => ({
  __esModule: true,
  default: ({
    isOpen,
    children,
  }: {
    isOpen: boolean;
    children: (isApp: boolean) => ReactNode;
  }) => (isOpen ? <div role="dialog">{children(false)}</div> : null),
}));
jest.mock("@/components/waves/drops/WaveCompetitionEntries", () => ({
  WaveCompetitionEntries: ({
    authorId,
    wave,
    kind,
  }: {
    authorId: string;
    wave: ApiWave;
    kind: string;
  }) => (
    <div data-testid="entries">
      {authorId}:{wave.id}:{kind}
    </div>
  ),
}));

const wave = { id: "wave", name: "Art competition" } as ApiWave;
const drop = {
  id: "saved",
  wave: { id: "wave" },
  author: { id: "me" },
  drop_type: "PARTICIPATORY",
} as ApiDrop;
const fetchDrop = jest.mocked(fetchDropV2ById);

function renderView(receiptDrop: ApiDrop | null = drop) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const props = { wave, receiptDrop, onDismissReceipt: jest.fn() };
  const view = render(
    <QueryClientProvider client={client}>
      <WaveMySubmissions key={mockProfileId} {...props} />
    </QueryClientProvider>
  );
  return { ...view, client, props };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockProfileId = "me";
  mockProxy = false;
});

it("confirms membership from the saved drop even without a leaderboard rank", async () => {
  fetchDrop.mockResolvedValue({
    ...drop,
    submission_context: { status: "ACTIVE" },
  } as ApiDrop);
  renderView();
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent(
      "Your entry is in Art competition."
    )
  );
  fireEvent.click(screen.getByRole("button", { name: "View my entry" }));
  expect(mockPush).toHaveBeenCalledWith("/waves/wave?drop=saved", {
    scroll: false,
  });
});

it("keeps a failed status check distinct from submission and retries only its read", async () => {
  fetchDrop.mockRejectedValueOnce(new Error("Unavailable"));
  fetchDrop.mockResolvedValueOnce({
    ...drop,
    submission_context: { status: "ACTIVE" },
  } as ApiDrop);
  renderView();
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("We couldn’t confirm")
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "Your artwork is saved."
  );
  expect(
    screen.getByRole("region", { name: "Your artwork is saved." })
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Check again" })
  ).toHaveAccessibleDescription(/Your artwork is saved.*We couldn’t confirm/);
  fireEvent.click(screen.getByRole("button", { name: "Check again" }));
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent(
      "Your entry is in Art competition."
    )
  );
  expect(fetchDrop).toHaveBeenCalledTimes(2);
});

it("opens only this viewer’s entries in this wave, without a rank filter", () => {
  renderView(null);
  fireEvent.click(screen.getByRole("button", { name: "My submissions" }));
  expect(screen.getByTestId("entries")).toHaveTextContent("me:wave:active");
  fireEvent.click(screen.getByRole("button", { name: "Winning entries" }));
  expect(screen.getByTestId("entries")).toHaveTextContent("me:wave:winners");
});

it("does not show another viewer’s receipt after a profile change", () => {
  mockProfileId = "someone-else";
  renderView();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(fetchDrop).not.toHaveBeenCalled();
});

it("does not expose a personal submission control in proxy mode", () => {
  mockProxy = true;
  renderView();
  expect(
    screen.queryByRole("button", { name: "My submissions" })
  ).not.toBeInTheDocument();
  expect(fetchDrop).not.toHaveBeenCalled();
});
