import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemeCollaborationPanel } from "@/components/waves/memes/collaborations/MemeCollaborationPanel";
import { MemeCollaboratorCredits } from "@/components/waves/memes/collaborations/MemeCollaboratorCredits";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { ApiMemeCollaborationInvitationStatusEnum } from "@/generated/models/ApiMemeCollaborationInvitation";
import type { ApiMemeCollaborationState } from "@/generated/models/ApiMemeCollaborationState";

const requestAuth = jest.fn();
const setToast = jest.fn();
let viewer = "B";
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: { id: viewer }, requestAuth, setToast }),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (url: string) => url,
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));
const fetchMock = jest.mocked(commonApiFetch);
const postMock = jest.mocked(commonApiPost);
const profile = { id: "B", handle: "artistB", display: "artistB", pfp: null };
const pendingInvitation = {
  id: "invitation",
  profile,
  status: ApiMemeCollaborationInvitationStatusEnum.Pending,
};
const pending: ApiMemeCollaborationState = {
  managed: true,
  closed: false,
  artwork_hash: "a".repeat(64),
  terms_version: "b".repeat(64),
  acceptance_copy: "Acceptance is final.",
  terms: "Submission terms",
  collaborators: [],
  invitations: [pendingInvitation],
};
function mount(data: ApiMemeCollaborationState = pending) {
  fetchMock.mockResolvedValue(data);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const result = render(
    <QueryClientProvider client={client}>
      <MemeCollaborationPanel dropId="drop" authorId="A" />
    </QueryClientProvider>
  );
  return { ...result, client };
}
beforeEach(() => {
  jest.clearAllMocks();
  viewer = "B";
  requestAuth.mockResolvedValue({ success: true });
});

it("requires reviewing the terms and sends consent for the exact artwork version", async () => {
  mount();
  const accept = await screen.findByRole("button", {
    name: "Accept collaboration",
  });
  expect(accept).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox"));
  const accepted = {
    ...pending,
    collaborators: [profile],
    invitations: [
      {
        ...pendingInvitation,
        status: ApiMemeCollaborationInvitationStatusEnum.Accepted,
      },
    ],
  };
  postMock.mockResolvedValue(accepted);
  fetchMock.mockResolvedValue(accepted);
  fireEvent.click(accept);
  await waitFor(() =>
    expect(postMock).toHaveBeenCalledWith({
      endpoint: "drops/drop/collaborations/invitation/response",
      body: {
        action: "ACCEPT",
        artwork_hash: pending.artwork_hash,
        terms_version: pending.terms_version,
      },
    })
  );
  expect(await screen.findByText("Accepted")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Decline" })
  ).not.toBeInTheDocument();
});

it("shows the submitter cancellation controls and no way to accept on behalf of B", async () => {
  viewer = "A";
  mount();
  expect(
    await screen.findByRole("button", { name: "Cancel invitation" })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Accept collaboration" })
  ).not.toBeInTheDocument();
});

it("requires fresh confirmation after the artwork or terms change", async () => {
  const { client } = mount();
  const accept = await screen.findByRole("button", {
    name: "Accept collaboration",
  });
  fireEvent.click(screen.getByRole("checkbox"));
  expect(accept).toBeEnabled();
  await act(async () => {
    client.setQueryData([QueryKey.DROP, "collaborations", "drop", "B"], {
      ...pending,
      artwork_hash: "c".repeat(64),
    });
  });
  await waitFor(() => {
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(accept).toBeDisabled();
  });
  expect(postMock).not.toHaveBeenCalled();
});

it("does not expose pending names to public viewers or offer late acceptance", async () => {
  viewer = "visitor";
  const { unmount } = mount({ ...pending, invitations: [] });
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  expect(screen.queryByText("@artistB")).not.toBeInTheDocument();
  unmount();
  viewer = "B";
  mount({
    ...pending,
    closed: true,
    invitations: [
      {
        ...pendingInvitation,
        status: ApiMemeCollaborationInvitationStatusEnum.Closed,
      },
    ],
  });
  expect(
    await screen.findByText("Closed at mint selection")
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Accept collaboration" })
  ).not.toBeInTheDocument();
});

it("renders all accepted collaborators as independent profile links", () => {
  render(
    <MemeCollaboratorCredits
      collaborators={[profile, { ...profile, id: "C", handle: "artistC" }]}
    />
  );
  expect(screen.getByRole("link", { name: "@artistB" })).toHaveAttribute(
    "href",
    "/artistB"
  );
  expect(screen.getByRole("link", { name: "@artistC" })).toHaveAttribute(
    "href",
    "/artistC"
  );
});

it("shows the exact review snapshot and opens only safe media links", async () => {
  mount({
    ...pending,
    artwork: {
      name: "Reviewed artwork",
      description: "Reviewed description",
      image_url: "https://media.example/art.png",
      animation_url: "javascript:alert(1)",
    },
  });
  expect(await screen.findByText("Reviewed artwork")).toBeInTheDocument();
  expect(screen.getByText("Reviewed description")).toBeInTheDocument();
  const links = screen.getAllByRole("link", {
    name: "Open artwork media for review",
  });
  expect(links).toHaveLength(1);
  expect(links[0]).toHaveAttribute("href", "https://media.example/art.png");
});

it("offers response actions only for the connected invitee even if another pending invitation is returned", async () => {
  mount({
    ...pending,
    invitations: [
      pendingInvitation,
      {
        ...pendingInvitation,
        id: "other",
        profile: { ...profile, id: "C", handle: "artistC" },
      },
    ],
  });
  await screen.findByText("@artistC");
  expect(
    screen.getAllByRole("button", { name: "Accept collaboration" })
  ).toHaveLength(1);
  expect(screen.getAllByRole("button", { name: "Decline" })).toHaveLength(1);
});
