import ContentModerationDropGate from "@/components/content-moderation/ContentModerationDropGate";
import ReportDropModal from "@/components/content-moderation/ReportDropModal";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import {
  blockProfile,
  hideDrop,
  reportDrop,
} from "@/services/api/content-moderation-api";
import {
  getDropHiddenOverride,
  getProfileBlockedOverride,
  resetContentModerationStateForTests,
} from "@/services/content-moderation/content-moderation-state";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";

const mockRequestAuth = jest.fn();
const mockSetToast = jest.fn();
let mockConnectedProfileId: string | null = "viewer-1";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: mockConnectedProfileId
      ? { id: mockConnectedProfileId }
      : null,
    requestAuth: mockRequestAuth,
    setToast: mockSetToast,
  }),
}));

jest.mock("@/services/api/content-moderation-api", () => ({
  blockProfile: jest.fn(),
  hideDrop: jest.fn(),
  reportDrop: jest.fn(),
  unhideDrop: jest.fn(),
}));

jest.mock("@headlessui/react", () => ({
  Dialog: ({ children, open, ...props }: any) =>
    open ? (
      <div role="dialog" {...props}>
        {children}
      </div>
    ) : null,
  DialogBackdrop: (props: any) => <div {...props} />,
  DialogPanel: (props: any) => <div {...props} />,
  DialogTitle: (props: any) => <h2 {...props} />,
}));

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
};

const createDrop = (id: string): ApiDrop =>
  ({
    id,
    author: { id: "author-1" },
    moderation: {
      status: ApiDropModerationStatus.Visible,
      can_view: true,
    },
    viewer_context: {
      author_blocked: false,
      drop_hidden: false,
    },
  }) as ApiDrop;

const renderModal = ({
  children,
  drop = createDrop("drop-1"),
  onClose = jest.fn(),
}: {
  readonly children?: ReactNode;
  readonly drop?: ApiDrop;
  readonly onClose?: () => void;
} = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    onClose,
    ...render(
      <QueryClientProvider client={queryClient}>
        {children}
        <ReportDropModal drop={drop} isOpen onClose={onClose} />
      </QueryClientProvider>
    ),
  };
};

describe("ReportDropModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectedProfileId = "viewer-1";
    resetContentModerationStateForTests();
    mockRequestAuth.mockResolvedValue({ success: true });
    jest.mocked(reportDrop).mockResolvedValue({
      id: "report-1",
      status: "OPEN" as never,
      drop_status: ApiDropModerationStatus.Visible,
    });
    jest.mocked(hideDrop).mockResolvedValue(undefined);
    jest.mocked(blockProfile).mockResolvedValue(undefined);
  });

  it("starts with no action selected and submits a report when selected", async () => {
    const { onClose } = renderModal();

    expect(
      screen.getByRole("heading", { name: "Flag Content" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Report this post or change what you see.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Report this post" })
    ).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();

    await userEvent.click(
      screen.getByRole("checkbox", { name: "Report this post" })
    );
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(reportDrop).toHaveBeenCalledWith("drop-1", {
        reason: "SCAM_OR_PHISHING",
        notes: null,
        hide_drop: false,
        block_author: false,
      })
    );
    expect(hideDrop).not.toHaveBeenCalled();
    expect(blockProfile).not.toHaveBeenCalled();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("allows hide-only and updates presentation before the request settles", async () => {
    const deferred = createDeferred<void>();
    jest.mocked(hideDrop).mockReturnValue(deferred.promise);
    const { onClose } = renderModal();

    await userEvent.click(
      screen.getByRole("checkbox", { name: "Hide this post for me" })
    );
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(getDropHiddenOverride("viewer-1", "drop-1")).toBe(true);
    await waitFor(() => expect(hideDrop).toHaveBeenCalledWith("drop-1"));
    expect(reportDrop).not.toHaveBeenCalled();
    expect(blockProfile).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    deferred.resolve(undefined);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("immediately hides the mounted post even before viewer state is available", async () => {
    mockConnectedProfileId = null;
    const deferred = createDeferred<void>();
    jest.mocked(hideDrop).mockReturnValue(deferred.promise);
    const drop = createDrop("drop-1");
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const onClose = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <ContentModerationDropGate drop={drop}>
          <p>Post to hide immediately</p>
          <ReportDropModal drop={drop} isOpen onClose={onClose} />
        </ContentModerationDropGate>
      </QueryClientProvider>
    );

    await userEvent.click(
      screen.getByRole("checkbox", { name: "Hide this post for me" })
    );
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(
      screen.getByTestId("content-moderation-tombstone-hidden")
    ).toBeInTheDocument();
    expect(screen.getByText("Post to hide immediately")).toBeInTheDocument();
    await waitFor(() => expect(hideDrop).toHaveBeenCalledWith("drop-1"));

    deferred.resolve(undefined);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("combines reporting and personal choices in the report request", async () => {
    renderModal();

    await userEvent.click(
      screen.getByRole("checkbox", { name: "Report this post" })
    );
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Hide this post for me" })
    );
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(reportDrop).toHaveBeenCalledWith("drop-1", {
        reason: "SCAM_OR_PHISHING",
        notes: null,
        hide_drop: true,
        block_author: false,
      })
    );
    expect(hideDrop).not.toHaveBeenCalled();
    expect(getDropHiddenOverride("viewer-1", "drop-1")).toBe(true);
  });

  it("allows block-only and immediately hides every visible post by the author", async () => {
    const deferred = createDeferred<void>();
    jest.mocked(blockProfile).mockReturnValue(deferred.promise);
    const firstDrop = createDrop("drop-1");
    const secondDrop = createDrop("drop-2");
    const { onClose } = renderModal({
      drop: firstDrop,
      children: (
        <>
          <ContentModerationDropGate drop={firstDrop}>
            <p>First author post</p>
          </ContentModerationDropGate>
          <ContentModerationDropGate drop={secondDrop}>
            <p>Second author post</p>
          </ContentModerationDropGate>
        </>
      ),
    });

    await userEvent.click(
      screen.getByRole("checkbox", { name: "Block this author" })
    );
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(
        screen.getAllByText(
          "This post is hidden because you blocked its author."
        )
      ).toHaveLength(2)
    );
    expect(screen.queryByText("First author post")).not.toBeInTheDocument();
    expect(screen.queryByText("Second author post")).not.toBeInTheDocument();
    expect(reportDrop).not.toHaveBeenCalled();
    expect(hideDrop).not.toHaveBeenCalled();
    await waitFor(() => expect(blockProfile).toHaveBeenCalledWith("author-1"));
    expect(onClose).not.toHaveBeenCalled();

    deferred.resolve(undefined);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("rolls back only the failed action after a partial failure", async () => {
    jest.mocked(hideDrop).mockRejectedValue(new Error("hide failed"));
    jest.mocked(blockProfile).mockResolvedValue(undefined);
    const { onClose } = renderModal();

    await userEvent.click(
      screen.getByRole("checkbox", { name: "Hide this post for me" })
    );
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Block this author" })
    );
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(mockSetToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Couldn't complete every selected action.",
          type: "error",
        })
      )
    );
    expect(getDropHiddenOverride("viewer-1", "drop-1")).toBeUndefined();
    expect(getProfileBlockedOverride("viewer-1", "author-1")).toBe(true);
    expect(
      screen.getByRole("checkbox", { name: "Hide this post for me" })
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Block this author" })
    ).not.toBeChecked();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("requires at least one selected action", async () => {
    renderModal();

    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });
});
