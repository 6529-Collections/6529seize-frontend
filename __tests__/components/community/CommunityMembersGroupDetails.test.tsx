import CommunityMembersGroupDetails from "@/components/community/CommunityMembersGroupDetails";
import { useAuth } from "@/components/auth/Auth";
import { ApiRateMatter } from "@/generated/models/ApiRateMatter";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock(
  "@/components/groups/page/list/card/GroupCardConfigs",
  () =>
    ({ group }: { readonly group: Pick<ApiGroupFull, "id"> }) => (
      <div data-testid="group-criteria">{group.id}</div>
    )
);

jest.mock(
  "@/components/groups/page/list/card/vote-all/GroupCardVoteAll",
  () =>
    ({
      matter,
      onCancel,
      viewerIdentityKey,
    }: {
      readonly matter: ApiRateMatter;
      readonly onCancel: () => void;
      readonly viewerIdentityKey: string | null;
    }) => (
      <div
        data-testid="bulk-rate-form"
        data-matter={matter}
        data-viewer={viewerIdentityKey}
      >
        <button type="button" onClick={onCancel}>
          Cancel bulk rating
        </button>
      </div>
    )
);

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

const useQueryMock = useQuery as jest.Mock;
const useAuthMock = useAuth as jest.Mock;
const commonApiFetchMock = commonApiFetch as jest.Mock;

function createInspectableGroup({
  hasCriteria = true,
  isPrivate = false,
}: {
  readonly hasCriteria?: boolean;
  readonly isPrivate?: boolean;
} = {}): ApiGroupFull {
  return {
    id: "group-1",
    name: "Artists and curators",
    created_at: 1,
    created_by: { handle: "creator" } as ApiGroupFull["created_by"],
    visible: true,
    is_private: isPrivate,
    group: {
      tdh: {
        min: null,
        max: null,
        inclusion_strategy: "BOTH",
      },
      rep: {
        min: null,
        max: null,
        direction: "RECEIVED",
        user_identity: null,
        category: null,
      },
      cic: {
        min: null,
        max: null,
        direction: "RECEIVED",
        user_identity: null,
      },
      level: { min: hasCriteria ? 3 : null, max: null },
      owns_nfts: [],
      identity_group_id: null,
      identity_group_identities_count: 0,
      excluded_identity_group_id: null,
      excluded_identity_group_identities_count: 0,
      is_beneficiary_of_grant_id: null,
      is_beneficiary_of_grant_match_mode: "ANY_TOKEN",
      is_beneficiary_of_grant: null,
    } as ApiGroupFull["group"],
  };
}

describe("CommunityMembersGroupDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthMock.mockReturnValue({ connectedProfile: { handle: "viewer" } });
  });

  it("shows a stable loading state", () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(
      <CommunityMembersGroupDetails
        groupId="group-1"
        onClose={jest.fn()}
        viewerIdentityKey={null}
      />
    );

    expect(screen.getByText("Loading group criteria")).toBeInTheDocument();
  });

  it("encodes the group id before adding it to the API path", async () => {
    commonApiFetchMock.mockResolvedValue({});
    let queryFn: (() => Promise<unknown>) | undefined;
    useQueryMock.mockImplementation((options) => {
      queryFn = options.queryFn;
      return {
        data: undefined,
        isLoading: true,
        isError: false,
      };
    });

    render(
      <CommunityMembersGroupDetails
        groupId="group/with?segments"
        onClose={jest.fn()}
        viewerIdentityKey="profile:viewer-1"
      />
    );

    await queryFn?.();
    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          "GROUP",
          "group/with?segments",
          { viewerIdentityKey: "profile:viewer-1" },
        ],
      })
    );
    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "groups/group%2Fwith%3Fsegments",
    });
  });

  it("shows a privacy-safe unavailable state", () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(
      <CommunityMembersGroupDetails
        groupId="private-id"
        onClose={jest.fn()}
        viewerIdentityKey={null}
      />
    );

    expect(screen.getByText("Group criteria unavailable")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This group may be private, deleted, or temporarily unavailable."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("private-id")).not.toBeInTheDocument();
  });

  it.each([
    { is_hidden: true },
    { is_direct_message: true },
    { visible: false },
  ])(
    "does not expose a non-inspectable group returned by the API",
    (privacy) => {
      useQueryMock.mockReturnValue({
        data: {
          id: "private-id",
          name: "Private group name",
          ...privacy,
        },
        isLoading: false,
        isError: false,
      });

      render(
        <CommunityMembersGroupDetails
          groupId="private-id"
          onClose={jest.fn()}
          viewerIdentityKey={null}
        />
      );

      expect(
        screen.getByText("Group criteria unavailable")
      ).toBeInTheDocument();
      expect(screen.queryByText("Private group name")).not.toBeInTheDocument();
      expect(screen.queryByTestId("group-criteria")).not.toBeInTheDocument();
    }
  );

  it.each([
    { label: "public", isPrivate: false },
    { label: "authorized private", isPrivate: true },
  ])("shows $label group criteria and a clear action", ({ isPrivate }) => {
    useQueryMock.mockReturnValue({
      data: createInspectableGroup({ isPrivate }),
      isLoading: false,
      isError: false,
    });

    const onClose = jest.fn();
    render(
      <CommunityMembersGroupDetails
        groupId="group-1"
        onClose={onClose}
        viewerIdentityKey={isPrivate ? "profile:viewer-1" : null}
      />
    );

    expect(screen.getByText("Selected group")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Artists and curators" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("group-criteria")).toHaveTextContent("group-1");
    expect(
      screen.getByRole("button", {
        name: "REP everyone matching criteria",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "NIC everyone matching criteria",
      })
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Clear selected group" })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("opens one bulk rating form at a time for the active criteria", async () => {
    useQueryMock.mockReturnValue({
      data: createInspectableGroup(),
      isLoading: false,
      isError: false,
    });

    render(
      <CommunityMembersGroupDetails
        groupId="group-1"
        onClose={jest.fn()}
        viewerIdentityKey="profile:viewer-1"
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "REP everyone matching criteria",
      })
    );

    const bulkForm = screen.getByRole("region", {
      name: "REP everyone matching criteria",
    });
    await waitFor(() => expect(bulkForm).toHaveFocus());
    expect(screen.getByTestId("bulk-rate-form")).toHaveAttribute(
      "data-matter",
      ApiRateMatter.Rep
    );
    expect(screen.getByTestId("bulk-rate-form")).toHaveAttribute(
      "data-viewer",
      "profile:viewer-1"
    );
    expect(
      screen.queryByRole("button", {
        name: "NIC everyone matching criteria",
      })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel bulk rating" }));
    const repButton = screen.getByRole("button", {
      name: "REP everyone matching criteria",
    });
    await waitFor(() => expect(repButton).toHaveFocus());
    expect(
      screen.getByRole("button", {
        name: "NIC everyone matching criteria",
      })
    ).toBeInTheDocument();
  });

  it("does not show bulk actions without active criteria", () => {
    useQueryMock.mockReturnValue({
      data: createInspectableGroup({ hasCriteria: false }),
      isLoading: false,
      isError: false,
    });

    render(
      <CommunityMembersGroupDetails
        groupId="group-1"
        onClose={jest.fn()}
        viewerIdentityKey="profile:viewer-1"
      />
    );

    expect(
      screen.queryByRole("button", {
        name: "REP everyone matching criteria",
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "NIC everyone matching criteria",
      })
    ).not.toBeInTheDocument();
  });

  it("preserves the signed-in requirement for bulk actions", () => {
    useAuthMock.mockReturnValue({ connectedProfile: null });
    useQueryMock.mockReturnValue({
      data: createInspectableGroup(),
      isLoading: false,
      isError: false,
    });

    render(
      <CommunityMembersGroupDetails
        groupId="group-1"
        onClose={jest.fn()}
        viewerIdentityKey={null}
      />
    );

    expect(
      screen.queryByRole("button", {
        name: "REP everyone matching criteria",
      })
    ).not.toBeInTheDocument();
  });

  it("waits for a viewer identity before showing private-group bulk actions", () => {
    useQueryMock.mockReturnValue({
      data: createInspectableGroup({ isPrivate: true }),
      isLoading: false,
      isError: false,
    });

    render(
      <CommunityMembersGroupDetails
        groupId="group-1"
        onClose={jest.fn()}
        viewerIdentityKey={null}
      />
    );

    expect(
      screen.queryByRole("button", {
        name: "REP everyone matching criteria",
      })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("group-criteria")).toBeInTheDocument();
  });

  it("treats malformed group identity data as unavailable", () => {
    useQueryMock.mockReturnValue({
      data: { id: "group-1", name: null },
      isLoading: false,
      isError: false,
    });

    render(
      <CommunityMembersGroupDetails
        groupId="group-1"
        onClose={jest.fn()}
        viewerIdentityKey={null}
      />
    );

    expect(screen.getByText("Group criteria unavailable")).toBeInTheDocument();
    expect(screen.queryByTestId("group-criteria")).not.toBeInTheDocument();
  });
});
