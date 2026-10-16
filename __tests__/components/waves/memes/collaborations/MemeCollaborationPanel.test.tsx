import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemeCollaborationPanel } from "@/components/waves/memes/collaborations/MemeCollaborationPanel";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { ApiMemeCollaborationInvitationStatusEnum } from "@/generated/models/ApiMemeCollaborationInvitation";
import type { ApiMemeCollaborationState } from "@/generated/models/ApiMemeCollaborationState";

jest.mock(
  "@/components/waves/memes/collaborations/MemeCollaboratorPicker",
  () => ({
    MemeCollaboratorPicker: ({
      onChange,
      disabled,
      excludedIds,
    }: {
      onChange: (profiles: unknown[]) => void;
      disabled: boolean;
      excludedIds: string[];
    }) => (
      <button
        disabled={disabled}
        data-excluded={excludedIds.join(",")}
        onClick={() =>
          onChange([
            { id: "C", handle: "artistC", display: "artistC", pfp: null },
          ])
        }
      >
        Select collaborator C
      </button>
    ),
  })
);
const requestAuth = jest.fn();
const setToast = jest.fn();
let viewer = "B";
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { id: viewer, handle: "artistB" },
    requestAuth,
    setToast,
  }),
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
async function openReview() {
  fireEvent.click(
    await screen.findByRole("button", { name: "Review invitation" })
  );
  return screen.findByRole("dialog", { name: "Review invitation" });
}
async function expandInvitations() {
  fireEvent.click(
    await screen.findByRole("button", { name: /Manage collaborators/ })
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  viewer = "B";
  requestAuth.mockResolvedValue({ success: true });
});

it("requires reviewing the terms and sends consent for the exact artwork version", async () => {
  const { client } = mount();
  await openReview();
  const accept = await screen.findByRole("button", {
    name: "Accept collaboration",
  });
  expect(accept).toBeDisabled();
  fireEvent.change(
    screen.getByRole("textbox", { name: "Artist credit name" }),
    { target: { value: "  Artist B Name  " } }
  );
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
        artist_name: "Artist B Name",
        artwork_hash: pending.artwork_hash,
        terms_version: pending.terms_version,
      },
    })
  );
  await waitFor(() =>
    expect(
      client.getQueryData([QueryKey.DROP, "collaborations", "drop", "B"])
    ).toEqual(accepted)
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Decline" })
  ).not.toBeInTheDocument();
});

it("shows the submitter cancellation controls and no way to accept on behalf of B", async () => {
  viewer = "A";
  mount();
  await expandInvitations();
  expect(
    await screen.findByRole("button", { name: "Cancel invitation" })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Accept collaboration" })
  ).not.toBeInTheDocument();
});

it("requires fresh confirmation after the artwork or terms change", async () => {
  const { client } = mount();
  await openReview();
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
    expect(
      screen.getByRole("button", { name: "Accept collaboration" })
    ).toBeDisabled();
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
  expect(screen.queryByText("Reviewed artwork")).not.toBeInTheDocument();
  await openReview();
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
  await openReview();
  expect(screen.queryByText("@artistC")).not.toBeInTheDocument();
  expect(
    screen.getAllByRole("button", { name: "Accept collaboration" })
  ).toHaveLength(1);
  expect(screen.getAllByRole("button", { name: "Decline" })).toHaveLength(1);
});

it("announces only the changed invitation status and keeps controls outside live regions", async () => {
  viewer = "A";
  const otherInvitation = {
    ...pendingInvitation,
    id: "other",
    profile: { ...profile, id: "C", handle: "artistC" },
  };
  const { client } = mount({
    ...pending,
    invitations: [pendingInvitation, otherInvitation],
  });
  await expandInvitations();
  const statuses = await screen.findAllByRole("status");
  expect(statuses).toHaveLength(2);
  expect(statuses[0]).toHaveTextContent("@artistB: Pending acceptance");
  expect(statuses[1]).toHaveTextContent("@artistC: Pending acceptance");
  for (const status of statuses) {
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-atomic", "true");
    expect(within(status).queryByRole("button")).not.toBeInTheDocument();
  }
  expect(screen.getByRole("list")).not.toHaveAttribute("aria-live");
  for (const button of screen.getAllByRole("button")) {
    expect(button.closest("[aria-live]")).toBeNull();
  }
  await act(async () => {
    client.setQueryData([QueryKey.DROP, "collaborations", "drop", "A"], {
      ...pending,
      invitations: [
        {
          ...pendingInvitation,
          status: ApiMemeCollaborationInvitationStatusEnum.Accepted,
        },
        otherInvitation,
      ],
    });
  });
  await waitFor(() =>
    expect(statuses[0]).toHaveTextContent("@artistB: Accepted")
  );
  expect(screen.getAllByRole("status")).toEqual(statuses);
  expect(statuses[1]).toHaveTextContent("@artistC: Pending acceptance");
});

it("lets the author invite collaborators on an existing unmanaged artwork without editing it", async () => {
  viewer = "A";
  requestAuth.mockResolvedValue({ success: true });
  postMock.mockResolvedValue({ ...pending, can_invite: true });
  mount({ ...pending, managed: false, can_invite: true, invitations: [] });
  await expandInvitations();
  fireEvent.click(await screen.findByText("Select collaborator C"));
  fireEvent.click(
    screen.getByRole("button", { name: "Send collaborator invitations" })
  );
  await waitFor(() =>
    expect(postMock).toHaveBeenCalledWith({
      endpoint: "drops/drop/collaborations",
      body: { collaborator_ids: ["C"] },
    })
  );
});
it("keeps accepted collaborators and excludes already invited profiles when adding more", async () => {
  viewer = "A";
  mount({
    ...pending,
    can_invite: true,
    invitations: [
      {
        ...pendingInvitation,
        status: ApiMemeCollaborationInvitationStatusEnum.Accepted,
      },
    ],
  });
  await expandInvitations();
  const picker = await screen.findByText("Select collaborator C");
  expect(picker).toHaveAttribute("data-excluded", "B");
  expect(screen.getByText("Accepted")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Cancel invitation" })
  ).not.toBeInTheDocument();
});
it("does not offer invitations after selection or to another viewer", async () => {
  viewer = "B";
  mount({ ...pending, can_invite: false, closed: true });
  await screen.findByText("Pending acceptance");
  expect(screen.queryByText("Select collaborator C")).not.toBeInTheDocument();
});

it("does not render an empty invite section for a nonauthor even with a stale capability", async () => {
  mount({ ...pending, managed: false, can_invite: true, invitations: [] });
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  expect(
    screen.queryByRole("heading", { name: "Collaboration invitations" })
  ).not.toBeInTheDocument();
});

it("keeps terms out of the page and resets confirmation when the review is dismissed", async () => {
  mount();
  await screen.findByRole("button", { name: "Review invitation" });
  expect(screen.queryByText("Submission terms")).not.toBeInTheDocument();
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  const dialog = await openReview();
  await waitFor(() =>
    expect(
      within(dialog).getByRole("heading", { name: "Review invitation" })
    ).toHaveFocus()
  );
  expect(within(dialog).getByText("Submission terms")).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("checkbox"));
  fireEvent.click(within(dialog).getByRole("button", { name: "Not now" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  );
  await openReview();
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  expect(postMock).not.toHaveBeenCalled();
});
it("shows one compact author entry point without public credits and keeps invitations in a dialog", async () => {
  viewer = "A";
  mount();
  const manage = await screen.findByRole("button", {
    name: /Manage collaborators/,
  });
  expect(manage).toHaveAttribute("aria-haspopup", "dialog");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByText("@artistB")).not.toBeInTheDocument();
  expect(screen.queryByText("Select collaborator C")).not.toBeInTheDocument();
  expect(manage).toHaveTextContent("1 pending");
  expect(
    screen.queryByRole("heading", { name: "Collaboration invitations" })
  ).not.toBeInTheDocument();
  fireEvent.click(manage);
  expect(screen.getByText("@artistB")).toBeVisible();
});
it("does not repeat accepted attribution in a second invitee panel", async () => {
  await act(async () => {
    mount({
      ...pending,
      invitations: [
        {
          ...pendingInvitation,
          status: ApiMemeCollaborationInvitationStatusEnum.Accepted,
        },
      ],
    });
  });
  expect(screen.queryByText("Accepted")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Review invitation" })
  ).not.toBeInTheDocument();
});

it("requires a nonblank credit name and fresh confirmation after editing it", async () => {
  mount();
  await openReview();
  const input = screen.getByRole("textbox", { name: "Artist credit name" });
  const accept = screen.getByRole("button", { name: "Accept collaboration" });
  expect(input).toHaveValue("artistB");
  expect(input).toHaveAttribute("maxLength", "200");
  fireEvent.click(screen.getByRole("checkbox"));
  expect(accept).toBeEnabled();
  fireEvent.change(input, { target: { value: "   " } });
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  fireEvent.click(screen.getByRole("checkbox"));
  expect(accept).toBeDisabled();
  fireEvent.change(input, { target: { value: "Artist B Name" } });
  expect(accept).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox"));
  expect(accept).toBeEnabled();
});

it("cancels a pending invitation and updates its status in management", async () => {
  viewer = "A";
  const cancelled = {
    ...pending,
    invitations: [
      {
        ...pendingInvitation,
        status: ApiMemeCollaborationInvitationStatusEnum.Cancelled,
      },
    ],
  };
  postMock.mockResolvedValue(cancelled);
  mount();
  fetchMock.mockResolvedValue(cancelled);
  await expandInvitations();
  fireEvent.click(screen.getByRole("button", { name: "Cancel invitation" }));
  await waitFor(() =>
    expect(postMock).toHaveBeenCalledWith({
      endpoint: "drops/drop/collaborations/invitation/response",
      body: {
        action: "CANCEL",
        artwork_hash: pending.artwork_hash,
        terms_version: pending.terms_version,
      },
    })
  );
  expect(await screen.findByText("Cancelled")).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Cancel invitation" })
  ).not.toBeInTheDocument();
});

it("opens an empty manager for an eligible author and closes without submitting invitations", async () => {
  viewer = "A";
  mount({ ...pending, can_invite: true, invitations: [] });
  const trigger = await screen.findByRole("button", {
    name: "Manage collaborators",
    exact: true,
  });
  expect(screen.queryByText("Select collaborator C")).not.toBeInTheDocument();
  fireEvent.click(trigger);
  const dialog = await screen.findByRole("dialog", {
    name: "Manage collaborators",
  });
  expect(within(dialog).getByText("No invitations yet.")).toBeVisible();
  fireEvent.click(within(dialog).getByRole("button", { name: "Done" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  );
  expect(postMock).not.toHaveBeenCalled();
});
