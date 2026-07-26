import PublicReviewFeedbackComposer from "@/components/public-review/PublicReviewFeedbackComposer";
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
} from "@/services/api/public-review/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
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
  categories: [
    { value: "general", label: "General comment" },
    {
      value: PUBLIC_REVIEW_EXPLOITABLE_SECURITY_TYPE,
      label: "Possible exploitable security vulnerability",
    },
  ],
  severityOptions: [{ value: "suggestion", label: "Suggestion" }],
  pages: [{ value: "architecture", label: "Architecture" }],
};

function renderComposer(submitter: PublicReviewFeedbackSubmitter) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const result = render(
    <PublicReviewFeedbackComposer
      locale="en-US"
      config={config}
      destination={destination}
      page={{
        pageId: "architecture",
        pageTitle: "Architecture",
        canonicalPath: "/stream/review/architecture",
      }}
      submitter={submitter}
    />,
    { wrapper: Wrapper }
  );
  return { ...result, queryClient };
}

describe("PublicReviewFeedbackComposer", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useAuthMock.mockReturnValue({
      connectedProfile: { id: "profile-1" },
      requestAuth: jest.fn(),
    } as ReturnType<typeof useAuth>);
    useSeizeConnectContextMock.mockReturnValue({
      address: "0x000000000000000000000000000000000000dEaD",
      hasValidWalletAuth: true,
      isSafeWallet: false,
      seizeConnectFresh: jest.fn(),
      seizeConnectOpen: false,
    } as ReturnType<typeof useSeizeConnectContext>);
    fetchWaveByIdMock.mockResolvedValue({
      wave: { type: ApiWaveType.Chat },
      chat: {
        enabled: true,
        authenticated_user_eligible: true,
      },
    } as Awaited<ReturnType<typeof fetchWaveById>>);
  });

  it("preserves the draft after a recoverable submission failure", async () => {
    const user = userEvent.setup();
    const submitter = jest.fn().mockRejectedValue(new Error("API unavailable"));
    renderComposer(submitter);

    const comment = await screen.findByLabelText("Comment", {
      selector: "textarea",
    });
    await user.type(comment, "Do not lose this exploit report.");
    await user.click(
      screen.getByRole("button", { name: "Post feedback to the Wave" })
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
    ) as PublicReviewFeedbackSubmitter;
    const { queryClient } = renderComposer(submitter);
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");

    const comment = await screen.findByLabelText("Comment", {
      selector: "textarea",
    });
    await user.type(comment, "Keep this until the API confirms.");
    const submitButton = screen.getByRole("button", {
      name: "Post feedback to the Wave",
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
    const successLink = screen.getByRole("link", {
      name: "Open your feedback in the Wave",
    });
    expect(successLink).toHaveAttribute(
      "href",
      expect.stringContaining("serialNo=12")
    );
    await waitFor(() => expect(successLink.closest("output")).toHaveFocus());
  });

  it("fails closed when the active authenticated address is unavailable", () => {
    const submitter = jest.fn();
    useSeizeConnectContextMock.mockReturnValue({
      address: undefined,
      hasValidWalletAuth: true,
      isSafeWallet: false,
      seizeConnectFresh: jest.fn(),
      seizeConnectOpen: false,
    } as ReturnType<typeof useSeizeConnectContext>);

    renderComposer(submitter);

    expect(
      screen.getByRole("button", { name: "Re-authenticate wallet" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Post feedback to the Wave" })
    ).not.toBeInTheDocument();
    expect(fetchWaveByIdMock).not.toHaveBeenCalled();
  });
});
