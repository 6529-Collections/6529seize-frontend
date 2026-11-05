import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SubscriptionCoveragePreview, {
  SubscriptionPreviewProvider,
  SubscriptionSettingsPreview,
  SubscriptionCoverageNoticePreview,
  SubscriptionTopUpPreview,
} from "@/components/user/subscriptions/coverage/dev/SubscriptionCoveragePreview";
import { coveragePreviewFixtures } from "@/components/user/subscriptions/coverage/dev/coveragePreviewFixtures";
import { getSubscriptionCoveragePresentation } from "@/components/user/subscriptions/coverage/subscriptionCoverage.helpers";
import { ApiSubscriptionCoverageStatus as Status } from "@/generated/models/ApiSubscriptionCoverageStatus";

jest.mock("@/services/api/common-api", () => ({ commonApiPost: jest.fn() }));
jest.mock("@/components/user/subscriptions/UserPageSubscriptionsTopUp", () => ({
  __esModule: true,
  default: () => <div>Real payment form</div>,
}));
jest.mock(
  "@/components/user/subscriptions/UserPageSubscriptionsUpcoming",
  () => ({
    __esModule: true,
    default: () => null,
  })
);
jest.mock(
  "@/components/user/subscriptions/UserPageSubscriptionsResponsivePanel",
  () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <section>{children}</section>
    ),
  })
);
import { commonApiPost } from "@/services/api/common-api";
import { AuthContext } from "@/components/auth/Auth";
import { createMockAuthContext } from "@/__tests__/utils/testContexts";

const actualAuth = jest.fn().mockResolvedValue({ success: true });
const address = {
  address: "0x7d88f221e9ecef9eef118e0d0e8a47f81b37e0b6",
  ens: "gpebbles.eth",
};

describe("local coverage preview", () => {
  const refresh = jest.fn();
  const payment = jest.fn();
  const renderPreview = () =>
    render(
      <AuthContext.Provider
        value={createMockAuthContext({ requestAuth: actualAuth })}
      >
        <SubscriptionPreviewProvider>
          <SubscriptionCoverageNoticePreview show={false} />
          <SubscriptionCoveragePreview
            coverage={coveragePreviewFixtures[Status.Covered]}
            isOwner
            isLoading={false}
            action={<span>Actual balance</span>}
            topUpAction={<button onClick={payment}>Actual payment</button>}
          />
          <SubscriptionSettingsPreview
            profileKey="actual-profile"
            readonly
            refresh={refresh}
            details={undefined}
            airdrop={{ tdh_wallet: address, airdrop_address: address }}
            fetchingAirdrop={false}
          />
          <SubscriptionTopUpPreview
            expanded
            onCancel={jest.fn()}
            onTransactionConfirmed={payment}
          />
        </SubscriptionPreviewProvider>
      </AuthContext.Provider>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState(
      {},
      "",
      "/gpebbles/subscriptions?coveragePreview=1"
    );
  });
  afterEach(() => window.history.replaceState({}, "", "/"));

  it("requires explicit opt-in and leaves the real summary untouched", () => {
    window.history.replaceState({}, "", "/gpebbles/subscriptions");
    renderPreview();
    expect(
      screen.queryByRole("group", { name: "Preview coverage state" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Actual balance")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "24 drops funded Covered" })
    ).toBeVisible();
  });

  it("isolates sample payment and refresh actions and provides an exit to the real profile", async () => {
    const user = userEvent.setup();
    renderPreview();
    await user.click(
      screen.getByRole("button", { name: "Top up", exact: true })
    );
    const sampleModal = await screen.findByRole("dialog", {
      name: "Top up",
      exact: true,
    });
    await user.click(
      within(sampleModal).getByRole("radio", { name: "1 Card", exact: true })
    );
    await user.click(
      within(sampleModal).getByRole("button", {
        name: "Top up 0.06529 ETH",
        exact: true,
      })
    );
    expect(
      within(sampleModal).getByText(
        "Preview only. No account changes or payments are made."
      )
    ).toHaveAttribute("role", "status");
    await user.click(
      within(sampleModal).getByRole("button", { name: "Close", exact: true })
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    await user.click(screen.getByRole("button", { name: "Refresh balance" }));
    await user.click(
      screen.getByRole("button", { name: "Action required", exact: true })
    );
    await user.click(
      screen.getByRole("button", { name: "Top up", exact: true })
    );
    const warningModal = await screen.findByRole("dialog", {
      name: "Top up",
      exact: true,
    });
    expect(
      within(warningModal).queryByText(/Top up by/)
    ).not.toBeInTheDocument();
    expect(
      within(warningModal).getByRole("radio", { name: /Recommended/ })
    ).toBeVisible();
    await user.click(
      within(warningModal).getByRole("button", { name: "Close", exact: true })
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(
      screen.queryByRole("link", { name: "Top up subscriptions" })
    ).not.toBeInTheDocument();
    expect(window.location.hash).toBe("");
    expect(refresh).not.toHaveBeenCalled();
    expect(payment).not.toHaveBeenCalled();
    expect(screen.queryByText("Actual balance")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Toggle preview perspective" })
    );
    expect(
      screen.queryByRole("button", { name: "Top up", exact: true })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Refresh balance" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Actual profile" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Exit preview" })).toHaveAttribute(
      "href",
      "/gpebbles/subscriptions#profile-subscriptions-overview"
    );
    expect(screen.queryByText("Real payment form")).not.toBeInTheDocument();
  });

  it("keeps stale coverage and its owner retry above the summary", async () => {
    const user = userEvent.setup();
    renderPreview();
    await user.click(
      screen.getByRole("button", { name: "Refresh failed", exact: true })
    );
    const notice = screen.getByRole("status");
    expect(notice).toHaveTextContent(
      "Last known coverage is shown and may be out of date."
    );
    const heading = screen.getByRole("heading", {
      name: "24 drops funded Covered",
    });
    expect(
      notice.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Refresh coverage" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Refresh balance" })
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Refresh coverage" }));
    expect(refresh).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "Toggle preview perspective" })
    );
    expect(
      screen.queryByRole("button", { name: "Refresh coverage" })
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Covered", exact: true })
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("reopens the sample modal with its draft and never calls payment or account actions", async () => {
    const user = userEvent.setup();
    renderPreview();
    await user.click(
      screen.getByRole("button", { name: "Top up", exact: true })
    );
    const modal = await screen.findByRole("dialog", {
      name: "Top up",
      exact: true,
    });
    await user.type(
      within(modal).getByRole("spinbutton", {
        name: "Other card count",
        exact: true,
      }),
      "2"
    );
    await user.click(
      within(modal).getByRole("button", {
        name: "Show Deep Time Subscriptions",
        exact: true,
      })
    );
    await user.click(
      within(modal).getByRole("button", {
        name: "Top up 0.13058 ETH",
        exact: true,
      })
    );
    await user.click(
      within(modal).getByRole("button", { name: "Close", exact: true })
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    await user.click(
      screen.getByRole("button", { name: "Top up", exact: true })
    );
    const reopened = await screen.findByRole("dialog", {
      name: "Top up",
      exact: true,
    });
    expect(
      within(reopened).getByRole("spinbutton", {
        name: "Other card count",
        exact: true,
      })
    ).toHaveValue(2);
    expect(
      within(reopened).getByRole("button", {
        name: "Hide Deep Time Subscriptions",
        exact: true,
      })
    ).toHaveAttribute("aria-expanded", "true");
    expect(commonApiPost).not.toHaveBeenCalled();
    expect(actualAuth).not.toHaveBeenCalled();
    expect(payment).not.toHaveBeenCalled();
    expect(screen.queryByText("Real payment form")).not.toBeInTheDocument();
  });

  it("shows matching owner settings and prevents sample actions from saving", async () => {
    const user = userEvent.setup();
    renderPreview();
    expect(
      screen.queryByRole("link", { name: "Choose drops" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Review settings" })
    ).not.toBeInTheDocument();
    const mode = screen.getByRole("switch", {
      name: "Automatic subscription mode",
    });
    expect(mode).toBeChecked();
    const edition = screen.getByRole("switch", {
      name: "All eligible editions",
    });
    expect(edition).toBeChecked();
    const edit = screen.getByRole("link", { name: "Change airdrop address" });
    expect(edit).toBeVisible();
    await user.click(mode);
    await user.click(edition);
    await user.click(edit);
    expect(screen.getByRole("status")).toHaveTextContent("Preview only");
    expect(commonApiPost).not.toHaveBeenCalled();
    expect(actualAuth).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe("/gpebbles/subscriptions");
    await user.click(
      screen.getByRole("button", { name: "Toggle preview perspective" })
    );
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Change airdrop address" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Automatic", { exact: true })).toBeVisible();
    await user.click(
      screen.getByRole("button", {
        name: "No upcoming drops selected",
        exact: true,
      })
    );
    expect(screen.getByText("Manual", { exact: true })).toBeVisible();
    expect(screen.getByText("One edition", { exact: true })).toBeVisible();
  });

  it("allows every API state and the one-funded-drop warning to be reviewed", async () => {
    const user = userEvent.setup();
    renderPreview();

    for (const status of Object.values(Status)) {
      const tab = screen.getByRole("button", {
        name: getSubscriptionCoveragePresentation("en-US", status).label,
        exact: true,
      });
      await user.click(tab);
      expect(tab).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("heading", { level: 2 })).toBeVisible();
    }
    await user.click(
      screen.getByRole("button", { name: "Action required · 1 funded" })
    );
    expect(
      screen.getByRole("heading", { name: "1 drop funded Action required" })
    ).toBeVisible();
    expect(
      screen.queryByText(
        "One selected drop is fully funded. Add funds to cover more upcoming drops."
      )
    ).not.toBeInTheDocument();
  });
});
