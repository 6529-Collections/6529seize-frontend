import { AuthContext } from "@/components/auth/Auth";
import UserPageMentionShortcuts from "@/components/user/mention-shortcuts/UserPageMentionShortcuts";
import { useMentionAliases } from "@/hooks/useMentionAliases";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/hooks/useMentionAliases", () => ({
  useMentionAliases: jest.fn(),
}));
jest.mock("@/services/api/mention-aliases-api", () => ({
  createMentionAlias: jest.fn(),
  deleteMentionAlias: jest.fn(),
  updateMentionAlias: jest.fn(),
}));

const mockedUseMentionAliases = useMentionAliases as jest.MockedFunction<
  typeof useMentionAliases
>;

const profile = {
  id: "profile-1",
  handle: "alice",
} as any;

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
    mockedUseMentionAliases.mockReturnValue({
      aliases: [
        {
          id: "tag-1",
          alias: "frens",
          members: [
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
    } as ReturnType<typeof useMentionAliases>);
  });

  it("renders owner-only Quick Tags as a standalone profile tab", () => {
    renderQuickTags();

    expect(screen.getByTestId("quick-tags-page")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Quick Tags" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/each Quick Tag expands into the profile handles/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New Quick Tag" })
    ).toBeInTheDocument();
    expect(screen.getByText("@frens")).toBeInTheDocument();
  });

  it("uses the shared selected-profile chips in the editor", () => {
    renderQuickTags();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.getAllByText("@bob")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Remove @bob" })
    ).toBeInTheDocument();
  });

  it("does not render on another profile or while acting as a proxy", () => {
    const { rerender } = renderQuickTags({
      connectedProfileId: "profile-2",
    });

    expect(screen.queryByTestId("quick-tags-page")).toBeNull();

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

    expect(screen.queryByTestId("quick-tags-page")).toBeNull();
  });
});
