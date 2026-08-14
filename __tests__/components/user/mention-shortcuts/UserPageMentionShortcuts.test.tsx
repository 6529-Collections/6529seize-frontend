import { AuthContext } from "@/components/auth/Auth";
import UserPageMentionShortcuts from "@/components/user/mention-shortcuts/UserPageMentionShortcuts";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { useMentionAliases } from "@/hooks/useMentionAliases";
import { commonApiFetch } from "@/services/api/common-api";
import { updateMentionAlias } from "@/services/api/mention-aliases-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("@/hooks/useMentionAliases", () => ({
  useMentionAliases: jest.fn(),
}));
jest.mock("@/services/api/mention-aliases-api", () => ({
  createMentionAlias: jest.fn(),
  deleteMentionAlias: jest.fn(),
  updateMentionAlias: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const mockedUseMentionAliases = useMentionAliases as jest.MockedFunction<
  typeof useMentionAliases
>;
const mockedUpdateMentionAlias = updateMentionAlias as jest.MockedFunction<
  typeof updateMentionAlias
>;
const mockedCommonApiFetch = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;
const mockedRefetch = jest.fn();

const profile = {
  id: "profile-1",
  handle: "alice",
} as any;

const makeAlias = (
  id: string,
  alias: string,
  members: { profile_id: string; handle: string; pfp: null }[]
) => ({ id, alias, members });

function renderQuickTags({
  connectedProfileId = "profile-1",
  activeProfileProxy = null,
}: {
  readonly connectedProfileId?: string | null;
  readonly activeProfileProxy?: object | null;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={
          {
            connectedProfile: connectedProfileId
              ? { id: connectedProfileId }
              : null,
            activeProfileProxy,
            setToast: jest.fn(),
          } as any
        }
      >
        <UserPageMentionShortcuts profile={profile} />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

describe("UserPageMentionShortcuts", () => {
  beforeEach(() => {
    mockedRefetch.mockReset();
    mockedCommonApiFetch.mockResolvedValue([]);
    mockedUseMentionAliases.mockReturnValue({
      aliases: [
        makeAlias("tag-1", "frens", [
          {
            profile_id: "profile-2",
            handle: "bob",
            pfp: null,
          },
          {
            profile_id: "profile-6",
            handle: "frank",
            pfp: null,
          },
          {
            profile_id: "profile-7",
            handle: "grace",
            pfp: null,
          },
          {
            profile_id: "profile-8",
            handle: "heidi",
            pfp: null,
          },
          {
            profile_id: "profile-9",
            handle: "ivan",
            pfp: null,
          },
          {
            profile_id: "profile-10",
            handle: "judy",
            pfp: null,
          },
        ]),
        makeAlias("tag-2", "reviewers", [
          {
            profile_id: "profile-3",
            handle: "carol",
            pfp: null,
          },
        ]),
        makeAlias("tag-3", "team", [
          {
            profile_id: "profile-4",
            handle: "dave",
            pfp: null,
          },
        ]),
        makeAlias("tag-4", "writers", [
          {
            profile_id: "profile-5",
            handle: "erin",
            pfp: null,
          },
        ]),
      ],
      isPending: false,
      isError: false,
      refetch: mockedRefetch,
    } as unknown as ReturnType<typeof useMentionAliases>);
  });

  it("renders owner-only Quick Tags as a compact Brain section", () => {
    renderQuickTags();

    const section = screen.getByTestId("quick-tags-section");
    expect(section).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Quick Tags" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Mention several profiles with one shortcut.")
    ).not.toHaveClass("tw-whitespace-nowrap");
    expect(screen.getByRole("button", { name: "Manage" })).toBeInTheDocument();
    expect(screen.getByText("@frens")).toBeInTheDocument();
    expect(screen.getByText("6 members")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+1 more" })).toBeInTheDocument();
    expect(screen.queryByText("@writers")).not.toBeInTheDocument();
    expect(section.querySelector(".tw-flex-wrap")).toBeInTheDocument();
  });

  it("opens the complete inline manager from Manage", () => {
    renderQuickTags();

    fireEvent.click(screen.getByRole("button", { name: "Manage" }));

    expect(screen.getByTestId("quick-tags-manager")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New Quick Tag" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New Quick Tag" })
    ).toHaveTextContent("+ New");
    expect(screen.getByText("@writers")).toBeInTheDocument();
    expect(screen.getByText("@bob")).toBeInTheDocument();
    expect(screen.getByText("@judy")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove @bob" })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New Quick Tag" }));

    expect(
      screen.getByRole("heading", { name: "Create Quick Tag" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "New Quick Tag" })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("@writers")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save Quick Tag" })
    ).toBeInTheDocument();
  });

  it("retries after Quick Tags fail to load", () => {
    mockedUseMentionAliases.mockReturnValue({
      aliases: [],
      isPending: false,
      isError: true,
      refetch: mockedRefetch,
    } as unknown as ReturnType<typeof useMentionAliases>);
    renderQuickTags();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(mockedRefetch).toHaveBeenCalledTimes(1);
  });

  it("moves focus through inline views and returns with the shared back action", async () => {
    renderQuickTags();

    fireEvent.click(screen.getByRole("button", { name: "Manage" }));
    const managerHeading = screen.getByRole("heading", { name: "Quick Tags" });
    await waitFor(() => expect(managerHeading).toHaveFocus());

    fireEvent.click(screen.getByRole("button", { name: "New Quick Tag" }));
    const editorHeading = screen.getByRole("heading", {
      name: "Create Quick Tag",
    });
    await waitFor(() => expect(editorHeading).toHaveFocus());

    fireEvent.click(screen.getByRole("button", { name: "Back to Quick Tags" }));
    await waitFor(() =>
      expect(screen.getByTestId("quick-tags-manager")).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Quick Tags" })).toHaveFocus()
    );

    fireEvent.click(screen.getByRole("button", { name: "Back to Quick Tags" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Quick Tags" })).toHaveFocus()
    );
    expect(screen.getByRole("button", { name: "Manage" })).toBeInTheDocument();
  });

  it("keeps delete confirmation inline and returns focus to Manage", async () => {
    renderQuickTags();

    fireEvent.click(screen.getByRole("button", { name: "Manage" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]!);

    const deleteHeading = screen.getByRole("heading", {
      name: "Delete @frens?",
    });
    await waitFor(() => expect(deleteHeading).toHaveFocus());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back to Quick Tags" }));

    await waitFor(() =>
      expect(screen.getByTestId("quick-tags-manager")).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Quick Tags" })).toHaveFocus()
    );
  });

  it("uses the shared selected-profile chips in the editor", () => {
    renderQuickTags();

    fireEvent.click(screen.getByRole("button", { name: /@frens/i }));

    expect(screen.getByText("@bob")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove @bob" })
    ).toBeInTheDocument();
  });

  it("removes the owner and deduplicates pre-populated profile ids when saving", async () => {
    mockedUseMentionAliases.mockReturnValue({
      aliases: [
        {
          id: "tag-1",
          alias: "frens",
          members: [
            {
              profile_id: "profile-1",
              handle: "alice",
              pfp: null,
            },
            {
              profile_id: "profile-2",
              handle: "bob",
              pfp: null,
            },
            {
              profile_id: "profile-2",
              handle: "bob",
              pfp: null,
            },
          ],
        },
      ],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useMentionAliases>);
    mockedUpdateMentionAlias.mockResolvedValue({
      id: "tag-1",
      alias: "frens",
      members: [],
    });
    renderQuickTags();

    fireEvent.click(screen.getByRole("button", { name: /@frens/i }));
    expect(screen.queryByText("@alice")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save Quick Tag" }));

    await waitFor(() =>
      expect(mockedUpdateMentionAlias).toHaveBeenCalledWith("tag-1", {
        alias: "frens",
        member_profile_ids: ["profile-2"],
      })
    );
  });

  it("keeps editor navigation disabled while a save is pending", async () => {
    let resolveUpdate!: (
      value: Awaited<ReturnType<typeof updateMentionAlias>>
    ) => void;
    const pendingUpdate = new Promise<
      Awaited<ReturnType<typeof updateMentionAlias>>
    >((resolve) => {
      resolveUpdate = resolve;
    });
    mockedUpdateMentionAlias.mockReturnValue(pendingUpdate);
    renderQuickTags();

    fireEvent.click(screen.getByRole("button", { name: /@frens/i }));
    fireEvent.click(screen.getByRole("button", { name: "Save Quick Tag" }));

    await waitFor(() => expect(mockedUpdateMentionAlias).toHaveBeenCalled());
    expect(
      screen.getByRole("button", { name: "Back to Quick Tags" })
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    resolveUpdate({ id: "tag-1", alias: "frens", members: [] });
    await waitFor(() =>
      expect(screen.getByTestId("quick-tags-manager")).toBeInTheDocument()
    );
  });

  it("excludes the connected profile from search results", async () => {
    const searchResults: CommunityMemberMinimal[] = [
      {
        profile_id: "profile-1",
        handle: "alice",
        normalised_handle: "alice",
        primary_wallet: "0xalice",
        display: "Alice",
        tdh: 0,
        level: 0,
        cic_rating: 0,
        wallet: "0xalice",
        pfp: null,
      },
      {
        profile_id: "profile-6",
        handle: "alex",
        normalised_handle: "alex",
        primary_wallet: "0xalex",
        display: "Alex",
        tdh: 0,
        level: 0,
        cic_rating: 0,
        wallet: "0xalex",
        pfp: null,
      },
    ];
    mockedCommonApiFetch.mockResolvedValue(searchResults);
    renderQuickTags();

    fireEvent.click(screen.getByRole("button", { name: "Manage" }));
    fireEvent.click(screen.getByRole("button", { name: "New Quick Tag" }));
    fireEvent.change(screen.getByLabelText("Search profiles by handle"), {
      target: { value: "ali" },
    });

    await waitFor(() =>
      expect(mockedCommonApiFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "community-members",
          params: expect.objectContaining({ param: "ali" }),
        })
      )
    );
    expect(
      screen.queryByRole("button", { name: /@alice/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /@alex/i })).toBeInTheDocument();
  });

  it("announces only the search results rendered in the list", async () => {
    const searchResults: CommunityMemberMinimal[] = Array.from(
      { length: 7 },
      (_, index): CommunityMemberMinimal => ({
        profile_id: `profile-${index + 20}`,
        handle: `alex${index}`,
        normalised_handle: `alex${index}`,
        primary_wallet: `0xalex${index}`,
        display: `Alex ${index}`,
        tdh: 0,
        level: 0,
        cic_rating: 0,
        wallet: `0xalex${index}`,
        pfp: null,
      })
    );
    mockedCommonApiFetch.mockResolvedValue(searchResults);
    renderQuickTags();

    fireEvent.click(screen.getByRole("button", { name: "Manage" }));
    fireEvent.click(screen.getByRole("button", { name: "New Quick Tag" }));
    fireEvent.change(screen.getByLabelText("Search profiles by handle"), {
      target: { value: "ale" },
    });

    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: /@alex/i })).toHaveLength(5)
    );
    expect(screen.getByText("5 profiles available.")).toBeInTheDocument();
    expect(screen.queryByText("7 profiles available.")).not.toBeInTheDocument();
  });

  it("does not render on another profile or while acting as a proxy", () => {
    const { rerender } = renderQuickTags({
      connectedProfileId: "profile-2",
    });

    expect(screen.queryByTestId("quick-tags-section")).toBeNull();
    expect(mockedUseMentionAliases).toHaveBeenLastCalledWith({
      enabled: false,
    });

    const queryClient = new QueryClient();
    rerender(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={
            {
              connectedProfile: { id: "profile-1" },
              activeProfileProxy: { id: "proxy-1" },
              setToast: jest.fn(),
            } as any
          }
        >
          <UserPageMentionShortcuts profile={profile} />
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    expect(screen.queryByTestId("quick-tags-section")).toBeNull();
    expect(mockedUseMentionAliases).toHaveBeenLastCalledWith({
      enabled: false,
    });
  });
});
