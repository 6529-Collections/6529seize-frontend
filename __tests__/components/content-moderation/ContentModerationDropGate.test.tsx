import ContentModerationDropGate from "@/components/content-moderation/ContentModerationDropGate";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import { unhideDrop } from "@/services/api/content-moderation-api";
import {
  resetContentModerationStateForTests,
  setDropHiddenOverride,
  setProfileBlockedOverride,
} from "@/services/content-moderation/content-moderation-state";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

let mockConnectedProfileId = "viewer-1";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { id: mockConnectedProfileId },
    requestAuth: jest.fn().mockResolvedValue({ success: true }),
    setToast: jest.fn(),
  }),
}));

jest.mock("@/services/api/content-moderation-api", () => ({
  unhideDrop: jest.fn().mockResolvedValue(undefined),
}));

const renderGate = (element: ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(element, { wrapper: Wrapper });
};

const createDrop = (
  overrides: Partial<Pick<ApiDrop, "viewer_context" | "moderation">> = {}
): Pick<ApiDrop, "id" | "author" | "viewer_context" | "moderation"> => ({
  id: "drop-1",
  author: { id: "author-1" } as ApiDrop["author"],
  ...overrides,
});

describe("ContentModerationDropGate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectedProfileId = "viewer-1";
    resetContentModerationStateForTests();
  });

  it("never exposes globally removed content", () => {
    renderGate(
      <ContentModerationDropGate
        drop={createDrop({
          moderation: {
            status: ApiDropModerationStatus.ModeratorRemoved,
            can_view: false,
          },
        })}
      >
        <p>Secret post content</p>
      </ContentModerationDropGate>
    );

    expect(screen.queryByText("Secret post content")).not.toBeInTheDocument();
    expect(
      screen.getByText("This post was removed by a moderator.")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show post" })
    ).not.toBeInTheDocument();
  });

  it("fails closed when a drop has no moderation presentation", () => {
    renderGate(
      <ContentModerationDropGate drop={createDrop()}>
        <p>Unclassified post content</p>
      </ContentModerationDropGate>
    );

    expect(
      screen.queryByText("Unclassified post content")
    ).not.toBeInTheDocument();
    const tombstoneMessage = screen.getByText(
      "This post is unavailable while it is being checked."
    );
    expect(tombstoneMessage).toBeInTheDocument();
    expect(tombstoneMessage).not.toHaveAttribute("role", "status");
  });

  it("allows authors to view their own moderated content", () => {
    mockConnectedProfileId = "author-1";
    renderGate(
      <ContentModerationDropGate
        drop={createDrop({
          moderation: {
            status: ApiDropModerationStatus.AiQuarantined,
            can_view: true,
          },
        })}
      >
        <p>Author post content</p>
      </ContentModerationDropGate>
    );

    expect(screen.getByText("Author post content")).toBeInTheDocument();
  });

  it("persists unhide for personally hidden content", async () => {
    renderGate(
      <ContentModerationDropGate
        drop={createDrop({
          viewer_context: { author_blocked: false, drop_hidden: true },
          moderation: {
            status: ApiDropModerationStatus.Visible,
            can_view: true,
          },
        })}
      >
        <p>Personally hidden post</p>
      </ContentModerationDropGate>
    );

    const hiddenContent = screen.getByTestId(
      "content-moderation-hidden-content"
    );
    expect(hiddenContent).toHaveAttribute("aria-hidden", "true");
    expect(hiddenContent).toHaveAttribute("inert");
    expect(screen.getByText("Personally hidden post")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Unhide" }));
    expect(
      screen.queryByTestId("content-moderation-tombstone-hidden")
    ).not.toBeInTheDocument();
    await waitFor(() => expect(unhideDrop).toHaveBeenCalledWith("drop-1"));
    expect(
      await screen.findByText("Personally hidden post")
    ).toBeInTheDocument();
  });

  it("does not carry a temporary reveal across profile switches", () => {
    setProfileBlockedOverride("viewer-1", "author-1", true);
    setProfileBlockedOverride("viewer-2", "author-1", true);
    const drop = createDrop({
      moderation: {
        status: ApiDropModerationStatus.Visible,
        can_view: true,
      },
    });
    const { rerender } = renderGate(
      <ContentModerationDropGate drop={drop}>
        <p>Blocked author post</p>
      </ContentModerationDropGate>
    );

    fireEvent.click(screen.getByRole("button", { name: "Show post" }));
    expect(screen.getByText("Blocked author post")).toBeInTheDocument();

    mockConnectedProfileId = "viewer-2";
    rerender(
      <ContentModerationDropGate drop={drop}>
        <p>Blocked author post</p>
      </ContentModerationDropGate>
    );

    expect(screen.queryByText("Blocked author post")).not.toBeInTheDocument();
    expect(
      screen.getByText("This post is hidden because you blocked its author.")
    ).toBeInTheDocument();
  });

  it("ends a blocked-post reveal when the viewer hides that post", () => {
    setProfileBlockedOverride("viewer-1", "author-1", true);
    renderGate(
      <ContentModerationDropGate
        drop={createDrop({
          moderation: {
            status: ApiDropModerationStatus.Visible,
            can_view: true,
          },
        })}
      >
        <p>Temporarily revealed post</p>
      </ContentModerationDropGate>
    );

    fireEvent.click(screen.getByRole("button", { name: "Show post" }));
    expect(screen.getByText("Temporarily revealed post")).toBeInTheDocument();

    act(() => setDropHiddenOverride("viewer-1", "drop-1", true));

    expect(
      screen.queryByText("Temporarily revealed post")
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("This post is hidden because you blocked its author.")
    ).toBeInTheDocument();
  });
});
