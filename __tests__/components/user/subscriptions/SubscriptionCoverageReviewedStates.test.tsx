import { act, render, screen } from "@testing-library/react";
import SubscriptionCoverageSummary from "@/components/user/subscriptions/coverage/SubscriptionCoverageSummary";
import SubscriptionCoverageNotice from "@/components/user/subscriptions/coverage/SubscriptionCoverageNotice";
import { useSubscriptionAllocationStatus } from "@/components/user/subscriptions/useSubscriptionAllocationStatus";
import { subscriptionCoverageFixture } from "@/tests/support/subscriptionFixtures";
import { ApiSubscriptionCoverageStatus as Status } from "@/generated/models/ApiSubscriptionCoverageStatus";

jest.mock(
  "@/components/user/subscriptions/useSubscriptionAllocationStatus",
  () => ({
    useSubscriptionAllocationStatus: jest.fn(),
  })
);
const allocation = jest.mocked(useSubscriptionAllocationStatus);
const emptyAllocation = {
  final: null,
  isLoading: false,
  isError: false,
  hasNoAllocation: false,
};
const beforeDeadline = Date.parse("2026-11-16T14:29:59Z");
function coverage() {
  const original = subscriptionCoverageFixture();
  return {
    ...original,
    calculated_at: new Date("2026-11-16T10:00:00Z"),
    next_unfunded: {
      ...original.next_unfunded!,
      token_id: 575,
      mint_at: new Date("2026-11-16T15:40:00Z"),
      top_up_deadline: new Date("2026-11-16T14:30:00Z"),
      requested_mints: 1,
      funded_mints: 0,
      missing_mints: 1,
    },
  };
}
function topUp(primary: boolean, future = false) {
  return (
    <button data-primary={primary}>
      {future ? "Top up for future drops" : "Top up"}
    </button>
  );
}
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(beforeDeadline);
  allocation.mockReturnValue(emptyAllocation);
  allocation.mockClear();
});
afterEach(() => jest.useRealTimers());

it("switches at the authoritative cutoff without navigation and separates future top-ups", () => {
  render(
    <SubscriptionCoverageSummary
      coverage={coverage()}
      profileKey="profile-key"
      isOwner
      isLoading={false}
      topUpAction={topUp}
    />
  );
  expect(
    screen.getByRole("heading", { name: "Today’s mint isn’t covered" })
  ).toBeVisible();
  expect(screen.getByText(/Top up by/)).toHaveTextContent(
    "Top up by Nov 16, 2026, 14:30 UTC to receive The Memes #575."
  );
  act(() => jest.advanceTimersByTime(1000));
  expect(allocation).toHaveBeenLastCalledWith(
    expect.objectContaining({ waitForRefresh: true })
  );
  expect(screen.getByText("Deadline passed", { exact: true })).toHaveClass(
    "tw-text-iron-400"
  );
  expect(
    screen.getByRole("heading", { name: "The Memes #575 isn’t covered" })
  ).toBeVisible();
  expect(screen.getByText(/Top-up deadline:/)).toHaveTextContent(
    "Top-up deadline: Nov 16, 2026, 14:30 UTC."
  );
  expect(screen.getByRole("link", { name: "View history" })).toHaveAttribute(
    "href",
    "#profile-subscriptions-history"
  );
  expect(
    screen.queryByRole("button", { name: "Top up", exact: true })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Top up for future drops" })
  ).toHaveAttribute("data-primary", "false");
});

it("uses the current UTC day rather than the forecast calculation day", () => {
  jest.setSystemTime(Date.parse("2026-11-16T23:59:59Z"));
  const data = coverage();
  data.next_unfunded.mint_at = new Date("2026-11-17T00:10:00Z");
  data.next_unfunded.top_up_deadline = new Date("2026-11-17T00:05:00Z");
  render(
    <SubscriptionCoverageSummary
      coverage={data}
      profileKey="profile-key"
      isOwner
      isLoading={false}
    />
  );
  expect(
    screen.getByRole("heading", { name: "The Memes #575 isn’t covered" })
  ).toBeVisible();
  expect(allocation).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(1000));
  expect(
    screen.getByRole("heading", { name: "Today’s mint isn’t covered" })
  ).toBeVisible();
  expect(allocation).toHaveBeenCalled();
});

it("gives confirmed payment priority after an expired cutoff, including a past mint day", () => {
  jest.setSystemTime(Date.parse("2026-11-18T10:00:00Z"));
  allocation.mockReturnValue({
    ...emptyAllocation,
    final: {
      consolidation_key: "profile-key",
      contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
      token_id: 575,
      subscribed_count: 1,
      redeemed_count: 1,
      balance: 0.06529,
      airdrop_address: "0x0000000000000000000000000000000000000529",
    },
  });
  render(
    <SubscriptionCoverageSummary
      coverage={coverage()}
      profileKey="profile-key"
      isOwner
      isLoading={false}
      topUpAction={topUp}
    />
  );
  expect(
    screen.getByRole("heading", { name: "Subscription paid" })
  ).toBeVisible();
  expect(screen.queryByText("Deadline passed")).not.toBeInTheDocument();
  expect(
    screen.queryByText(/Top up by|Top-up deadline:/)
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Top up", exact: true })
  ).toHaveAttribute("data-primary", "false");
});

it("does not infer a missed deadline when the payment read fails", () => {
  jest.setSystemTime(Date.parse("2026-11-18T10:00:00Z"));
  allocation.mockReturnValue({
    ...emptyAllocation,
    final: undefined,
    isError: true,
  });
  render(
    <SubscriptionCoverageSummary
      coverage={coverage()}
      profileKey="profile-key"
      isOwner
      isLoading={false}
      topUpAction={topUp}
    />
  );
  expect(
    screen.getByRole("heading", { name: "Coverage unavailable" })
  ).toBeVisible();
  expect(
    screen.getAllByText("Coverage unavailable", { exact: true })
  ).toHaveLength(1);
  expect(screen.queryByText("Deadline passed")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Top up", exact: true })
  ).toHaveAttribute("data-primary", "false");
});

it("keeps stale coverage neutral with its calculation timestamp and refresh", () => {
  jest.setSystemTime(Date.parse("2026-11-18T10:00:00Z"));
  const data = coverage();
  render(
    <SubscriptionCoverageSummary
      coverage={data}
      profileKey="profile-key"
      isOwner
      isLoading={false}
      isStale
      topUpAction={topUp}
    >
      <SubscriptionCoverageNotice
        show
        calculatedAt={data.calculated_at}
        onRefresh={jest.fn()}
      />
    </SubscriptionCoverageSummary>
  );
  expect(allocation).not.toHaveBeenCalled();
  expect(screen.getByText("Last known coverage", { exact: true })).toHaveClass(
    "tw-text-iron-400"
  );
  expect(
    screen.getByText(
      "Last updated Nov 16, 2026, 10:00 UTC. May be out of date."
    )
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Refresh coverage" })
  ).toBeVisible();
  expect(screen.queryByText("Deadline passed")).not.toBeInTheDocument();
  expect(screen.queryByText("Action required")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Top up", exact: true })
  ).toHaveAttribute("data-primary", "false");
});

it.each([1, 2])(
  "keeps %i remaining editions in the deadline box without a repeated owner line",
  (missing) => {
    const data = coverage();
    data.next_unfunded.requested_mints = 3;
    data.next_unfunded.funded_mints = 3 - missing;
    data.next_unfunded.missing_mints = missing;
    render(
      <SubscriptionCoverageSummary
        coverage={data}
        profileKey="profile-key"
        isOwner
        isLoading={false}
      />
    );
    expect(
      screen.getByRole("heading", { name: "Today’s mint isn’t fully covered" })
    ).toBeVisible();
    expect(screen.getByText(/Top up by/)).toHaveTextContent(
      `Top up by Nov 16, 2026, 14:30 UTC to receive the remaining ${missing} ${missing === 1 ? "edition" : "editions"} of The Memes #575.`
    );
    expect(screen.queryByText(/of 3 editions funded/)).not.toBeInTheDocument();
  }
);

it("keeps partial edition facts visible for visitors without instructions or actions", () => {
  const data = coverage();
  data.next_unfunded.requested_mints = 3;
  data.next_unfunded.funded_mints = 1;
  data.next_unfunded.missing_mints = 2;
  render(
    <SubscriptionCoverageSummary
      coverage={data}
      profileKey="profile-key"
      isOwner={false}
      isLoading={false}
      topUpAction={topUp}
    />
  );
  expect(
    screen.getByRole("heading", { name: "The Memes #575 isn’t fully covered" })
  ).toBeVisible();
  expect(screen.getByText("1 of 3 editions funded")).toBeVisible();
  expect(screen.queryByText("Action required")).not.toBeInTheDocument();
  expect(screen.queryByText(/Top up by/)).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Top up" })
  ).not.toBeInTheDocument();
});

it.each([
  [Status.EarlyWarning, 5, false],
  [Status.RunningLow, 2, true],
  [Status.ActionRequired, 1, true],
] as const)(
  "preserves funding action emphasis for %s with %i drops funded",
  (status, count, primary) => {
    const data = { ...coverage(), status, fully_funded_drops: count };
    render(
      <SubscriptionCoverageSummary
        coverage={data}
        isOwner
        isLoading={false}
        topUpAction={topUp}
      />
    );
    expect(screen.getByRole("button", { name: "Top up" })).toHaveAttribute(
      "data-primary",
      String(primary)
    );
    expect(screen.queryByText(/is not fully funded\./)).not.toBeInTheDocument();
  }
);
