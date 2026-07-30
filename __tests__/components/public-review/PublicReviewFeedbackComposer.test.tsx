import PublicReviewFeedbackComposer from "@/components/public-review/PublicReviewFeedbackComposer";
import type { PublicReviewReferenceIntegrityStatus } from "@/components/public-review/PublicReviewFeedbackComposer";
import { FeedbackConnectPrompt } from "@/components/public-review/PublicReviewFeedbackComposerStatus";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { fetchWaveById } from "@/services/api/waves-v2-api";
import {
  PUBLIC_REVIEW_EXPLOITABLE_SECURITY_TYPE,
  PUBLIC_REVIEW_FEEDBACK_SCHEMA_VERSION,
  PUBLIC_REVIEW_INITIAL_VERSION,
  type PublicReviewDiscussionDestination,
  type PublicReviewFeedbackConfig,
  type PublicReviewFeedbackSubmitter,
  type PublicReviewReferenceSelection,
} from "@/services/api/public-review/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/components/drops/view/part/DropPartMarkdown", () => ({
  __esModule: true,
  default: ({ partContent }: { readonly partContent: string }) => (
    <div>{partContent}</div>
  ),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

jest.mock("@/services/api/waves-v2-api", () => ({
  fetchWaveById: jest.fn(),
}));

const useAuthMock = jest.mocked(useAuth);
const useSeizeConnectContextMock = jest.mocked(useSeizeConnectContext);
const fetchWaveByIdMock = jest.mocked(fetchWaveById);
const setToastMock = jest.fn();

const destination: PublicReviewDiscussionDestination = {
  logicalKey: "stream-review",
  environment: "staging",
  waveId: "22222222-2222-4222-8222-222222222222",
};
const config: PublicReviewFeedbackConfig = {
  reviewId: "stream-contract",
  reviewVersion: PUBLIC_REVIEW_INITIAL_VERSION,
  reviewTitle: "Stream Contract",
  feedbackSchemaVersion: PUBLIC_REVIEW_FEEDBACK_SCHEMA_VERSION,
  submissionsOpen: true,
  acceptsPublicExploitReports: true,
  categories: [
    { value: "general", label: "General comment" },
    {
      value: PUBLIC_REVIEW_EXPLOITABLE_SECURITY_TYPE,
      label: "Possible exploitable security vulnerability",
    },
  ],
  severityOptions: [{ value: "suggestion", label: "Suggestion" }],
  pages: [{ value: "architecture", label: "Architecture" }],
  source: {
    repository: "6529-Collections/6529Stream",
    commit: "a".repeat(40),
    files: [
      {
        path: "smart-contracts/StreamCore.sol",
        lineCount: 200,
        sha256: `sha256:${"b".repeat(64)}`,
      },
    ],
  },
};

function renderComposer(
  submitter: PublicReviewFeedbackSubmitter,
  referenceSelection?: PublicReviewReferenceSelection,
  referenceIntegrityStatus: PublicReviewReferenceIntegrityStatus = "ready"
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const getComposer = (
    currentReferenceSelection?: PublicReviewReferenceSelection,
    currentReferenceIntegrityStatus: PublicReviewReferenceIntegrityStatus = "ready"
  ) => (
    <PublicReviewFeedbackComposer
      locale="en-US"
      config={config}
      destination={destination}
      page={{
        pageId: "architecture",
        pageTitle: "Architecture",
        canonicalPath: "/stream/review/architecture",
      }}
      referenceSelection={currentReferenceSelection}
      referenceIntegrityMessage={
        currentReferenceIntegrityStatus === "pending"
          ? "Calculating exact source checksum."
          : undefined
      }
      referenceIntegrityStatus={currentReferenceIntegrityStatus}
      submitter={submitter}
    />
  );
  const result = render(
    getComposer(referenceSelection, referenceIntegrityStatus),
    { wrapper: Wrapper }
  );
  return {
    ...result,
    queryClient,
    rerenderSelection: (
      nextReferenceSelection?: PublicReviewReferenceSelection,
      nextReferenceIntegrityStatus: PublicReviewReferenceIntegrityStatus = "ready"
    ) =>
      result.rerender(
        getComposer(nextReferenceSelection, nextReferenceIntegrityStatus)
      ),
  };
}

describe("PublicReviewFeedbackComposer", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useAuthMock.mockReturnValue({
      connectedProfile: { id: "profile-1" },
      requestAuth: jest.fn(),
      setToast: setToastMock,
    } as unknown as ReturnType<typeof useAuth>);
    useSeizeConnectContextMock.mockReturnValue({
      address: "0x000000000000000000000000000000000000dEaD",
      hasValidWalletAuth: true,
      isSafeWallet: false,
      seizeConnectFresh: jest.fn(),
      seizeConnectOpen: false,
    } as unknown as ReturnType<typeof useSeizeConnectContext>);
    fetchWaveByIdMock.mockResolvedValue({
      wave: { type: ApiWaveType.Chat },
      chat: {
        enabled: true,
        authenticated_user_eligible: true,
      },
    } as Awaited<ReturnType<typeof fetchWaveById>>);
  });

  it("keeps primary feedback text and actions on AA-contrast tokens", async () => {
    renderComposer(jest.fn());

    const comment = await screen.findByLabelText("Comment (required)", {
      selector: "textarea",
    });
    expect(comment).toHaveClass("placeholder:tw-text-iron-400");
    expect(comment).toHaveClass("tw-ring-white/[0.08]");
    expect(
      screen.getByRole("button", { name: "Post to review Wave" })
    ).toHaveClass("tw-bg-primary-600", "hover:tw-ring-primary-300/60");
  });

  it("keeps the wallet connection action on AA-contrast tokens", () => {
    render(
      <FeedbackConnectPrompt
        busy={false}
        connected={false}
        connecting={false}
        handleConnect={jest.fn(async () => undefined)}
        locale="en-US"
        visible
      />
    );

    expect(
      screen.getByRole("button", { name: "Connect wallet to comment" })
    ).toHaveClass("tw-bg-primary-600", "hover:tw-ring-primary-300/60");
  });

  it("preserves the draft after a recoverable submission failure", async () => {
    const user = userEvent.setup();
    const submitter = jest.fn().mockRejectedValue(new Error("API unavailable"));
    renderComposer(submitter);

    const comment = await screen.findByLabelText("Comment (required)", {
      selector: "textarea",
    });
    await user.type(comment, "Do not lose this exploit report.");
    await user.click(
      screen.getByRole("button", { name: "Post to review Wave" })
    );

    await waitFor(() => expect(submitter).toHaveBeenCalledTimes(1));
    expect(comment).toHaveValue("Do not lose this exploit report.");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your draft has been preserved"
    );
  });

  it("awaits the returned drop before clearing the draft", async () => {
    const user = userEvent.setup();
    let resolveDrop: (value: unknown) => void = () => undefined;
    const submitter = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveDrop = resolve;
        })
    ) as unknown as PublicReviewFeedbackSubmitter;
    const { queryClient } = renderComposer(submitter);
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");

    const comment = await screen.findByLabelText("Comment (required)", {
      selector: "textarea",
    });
    await user.type(comment, "Keep this until the API confirms.");
    const submitButton = screen.getByRole("button", {
      name: "Post to review Wave",
    });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(comment).toHaveValue("Keep this until the API confirms.");

    resolveDrop({
      id: "drop-1",
      serial_no: 12,
      wave: { id: destination.waveId },
      drop_type: ApiDropType.Chat,
    });

    await waitFor(() => expect(comment).toHaveValue(""));
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [
        QueryKey.PUBLIC_REVIEW_LEDGER,
        expect.objectContaining({
          environment: destination.environment,
          waveId: destination.waveId,
        }),
      ],
    });
    expect(setToastMock).toHaveBeenCalledWith({
      message: "Feedback posted successfully.",
      type: "success",
    });
    expect(
      screen.queryByRole("link", {
        name: "Open your feedback in the Wave",
      })
    ).not.toBeInTheDocument();
  });

  it("does not erase a newer draft when an earlier submission resolves", async () => {
    const user = userEvent.setup();
    let resolveFirstDrop: (value: unknown) => void = () => undefined;
    const submitterMock = jest
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirstDrop = resolve;
          })
      )
      .mockResolvedValueOnce({
        id: "drop-2",
        serial_no: 13,
        wave: { id: destination.waveId },
        drop_type: ApiDropType.Chat,
      });
    const submitter = submitterMock as PublicReviewFeedbackSubmitter;
    const sourceSelection = {
      kind: "code",
      path: "smart-contracts/StreamCore.sol",
      sourceSha256: `sha256:${"b".repeat(64)}`,
      lineStart: 10,
      lineEnd: 12,
      snippetSha256: `sha256:${"c".repeat(64)}`,
    } as const;
    const { rerenderSelection } = renderComposer(submitter, sourceSelection);

    const comment = await screen.findByLabelText("Comment (required)", {
      selector: "textarea",
    });
    await user.type(comment, "First submitted draft.");
    await user.click(
      screen.getByRole("button", { name: "Post to review Wave" })
    );
    rerenderSelection({
      ...sourceSelection,
      lineStart: 20,
      lineEnd: 20,
      snippetSha256: `sha256:${"d".repeat(64)}`,
    });
    await user.clear(comment);
    await user.type(
      comment,
      "New draft written while the first post is pending."
    );

    resolveFirstDrop({
      id: "drop-1",
      serial_no: 12,
      wave: { id: destination.waveId },
      drop_type: ApiDropType.Chat,
    });

    await waitFor(() =>
      expect(comment).toHaveValue(
        "New draft written while the first post is pending."
      )
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Post to review Wave" })
      ).toBeEnabled()
    );
    await user.click(
      screen.getByRole("button", { name: "Post to review Wave" })
    );
    await waitFor(() => expect(submitterMock).toHaveBeenCalledTimes(2));

    const firstPayload = JSON.parse(
      submitterMock.mock.calls[0]![0].payload.metadata[3]!.data_value
    );
    const secondPayload = JSON.parse(
      submitterMock.mock.calls[1]![0].payload.metadata[3]!.data_value
    );
    expect(firstPayload.submissionId).not.toBe(secondPayload.submissionId);
    expect(submitterMock.mock.calls[1]![0].payload.parts[0]!.content).toContain(
      "New draft written while the first post is pending."
    );
    expect(secondPayload.reference).toMatchObject({
      lineStart: 20,
      lineEnd: 20,
    });
  });

  it("fails closed when the active authenticated address is unavailable", () => {
    const submitter = jest.fn();
    useSeizeConnectContextMock.mockReturnValue({
      address: undefined,
      hasValidWalletAuth: true,
      isSafeWallet: false,
      seizeConnectFresh: jest.fn(),
      seizeConnectOpen: false,
    } as unknown as ReturnType<typeof useSeizeConnectContext>);

    renderComposer(submitter);

    expect(
      screen.getByRole("button", { name: "Re-authenticate wallet" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Post to review Wave" })
    ).not.toBeInTheDocument();
    expect(fetchWaveByIdMock).not.toHaveBeenCalled();
  });

  it("hides a preview when the attached source selection changes", async () => {
    const user = userEvent.setup();
    const submitter = jest.fn();
    const sourceSelection = {
      kind: "code",
      path: "smart-contracts/StreamCore.sol",
      sourceSha256: `sha256:${"b".repeat(64)}`,
      lineStart: 10,
      lineEnd: 12,
      snippetSha256: `sha256:${"c".repeat(64)}`,
    } as const;
    const { rerenderSelection } = renderComposer(submitter, sourceSelection);

    await user.type(
      await screen.findByLabelText("Comment (required)", {
        selector: "textarea",
      }),
      "Check this exact range."
    );
    await user.click(
      screen.getByRole("button", { name: "Preview Wave message" })
    );
    const previewHeading = screen.getByRole("heading", {
      name: "Wave message preview",
    });
    expect(previewHeading).toBeInTheDocument();
    await waitFor(() => expect(previewHeading).toHaveFocus());
    expect(previewHeading.closest("section")).not.toHaveAttribute("aria-live");
    expect(previewHeading.closest("section")).not.toHaveAttribute(
      "role",
      "status"
    );
    expect(screen.getByText(/lines 10-12/)).toBeInTheDocument();

    rerenderSelection({
      ...sourceSelection,
      lineStart: 20,
      lineEnd: 20,
      snippetSha256: `sha256:${"d".repeat(64)}`,
    });

    expect(
      screen.queryByRole("heading", { name: "Wave message preview" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Source: smart-contracts/StreamCore.sol, lines 20–20")
    ).toBeInTheDocument();
  });

  it("preserves the draft while a changed source range is being hashed", async () => {
    const user = userEvent.setup();
    const submitter = jest.fn();
    const sourceSelection = {
      kind: "code",
      path: "smart-contracts/StreamCore.sol",
      sourceSha256: `sha256:${"b".repeat(64)}`,
      lineStart: 10,
      lineEnd: 12,
      snippetSha256: `sha256:${"c".repeat(64)}`,
    } as const;
    const { rerenderSelection } = renderComposer(submitter, sourceSelection);
    const comment = await screen.findByLabelText("Comment (required)", {
      selector: "textarea",
    });
    await user.type(comment, "Keep this draft across a new line range.");

    rerenderSelection(undefined, "pending");

    expect(comment).toHaveValue("Keep this draft across a new line range.");
    expect(
      screen.getByRole("button", { name: "Preview Wave message" })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Post to review Wave" })
    ).toBeDisabled();
    expect(
      screen.getByText("Calculating exact source checksum.")
    ).toHaveAttribute("aria-live", "polite");

    rerenderSelection(
      {
        ...sourceSelection,
        lineStart: 20,
        lineEnd: 20,
        snippetSha256: `sha256:${"d".repeat(64)}`,
      },
      "ready"
    );

    expect(comment).toHaveValue("Keep this draft across a new line range.");
    expect(
      screen.getByRole("button", { name: "Preview Wave message" })
    ).toBeEnabled();
  });

  it("focuses and describes the required comment after validation", async () => {
    const user = userEvent.setup();
    renderComposer(jest.fn());
    const comment = await screen.findByLabelText("Comment (required)", {
      selector: "textarea",
    });
    const submit = screen.getByRole("button", {
      name: "Post to review Wave",
    });
    expect(comment).toBeRequired();
    expect(document.querySelector(`label[for="${comment.id}"]`)).toHaveClass(
      "tw-sr-only"
    );
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => expect(comment).toHaveFocus());
    expect(comment).toHaveAttribute("aria-invalid", "true");
    const describedBy = comment.getAttribute("aria-describedby");
    expect(describedBy).toContain("comment-hint");
    expect(describedBy).toContain("comment-error");
    const requiredMessage = screen.getByText("Enter a comment.");
    expect(requiredMessage).toHaveAttribute("aria-live", "polite");
    expect(requiredMessage).toHaveClass("tw-text-red-300");
    expect(requiredMessage).not.toHaveClass("tw-sr-only");
    expect(comment).toHaveClass("aria-[invalid=true]:tw-ring-red-400");
  });

  it("explains how to recover when the rendered Wave message is too long", async () => {
    const user = userEvent.setup();
    renderComposer(jest.fn());
    const comment = await screen.findByLabelText("Comment (required)", {
      selector: "textarea",
    });
    fireEvent.change(comment, {
      target: { value: "x".repeat(25_000) },
    });

    await user.click(
      screen.getByRole("button", { name: "Preview Wave message" })
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Shorten the comment or technical-detail fields and try again."
    );
  });
});
