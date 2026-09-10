import { fireEvent, render, renderHook, screen } from "@testing-library/react";
import { FaqSection } from "@/app/join/FaqSection";
import { FocusSections } from "@/app/join/FocusSections";
import { JourneyTimelineSection } from "@/app/join/JourneyTimelineSection";
import { buildJoinJourneyProgress } from "@/app/join/journeyProgress";
import { useJoin6529Journey } from "@/app/join/useJoin6529Journey";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { handle: "prxt0" },
    fetchingProfile: false,
    requestAuth: jest.fn(),
  }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: "0x123",
    hasActiveWalletAddress: true,
    hasValidWalletAuth: true,
    seizeConnectFresh: jest.fn(),
  }),
}));
jest.mock("@/app/join/useJoin6529Facts", () => ({
  useJoin6529Facts: () => ({ hasParticipated: true, hasCollected: true }),
}));

const links = {
  profileHref: "/prxt0",
  subscriptionsHref: "/prxt0/subscriptions",
};
const facts = { hasParticipated: true, hasCollected: true };

it("removes the restricted Collect step and counts only visible progress", () => {
  const progress = buildJoinJourneyProgress("loggedIn", facts, true);
  const { container } = render(
    <JourneyTimelineSection
      links={links}
      locale="en-US"
      pageState="loggedIn"
      timelineProgress={progress}
      hideNftPurchasing
    />
  );
  expect(container.querySelector("#join-step-collect")).toBeNull();
  expect(container.querySelector("#join-step-message")).toBeInTheDocument();
  expect(progress).toMatchObject({ total: 4, completed: 4, percent: 100 });
});

it("omits the subscription card without leaving a placeholder", () => {
  const { container } = render(
    <FocusSections links={links} locale="en-US" hideNftPurchasing />
  );
  expect(screen.queryByText("Subscriptions")).toBeNull();
  expect(container.querySelector('a[href="/prxt0/subscriptions"]')).toBeNull();
  expect(container.querySelector('a[href="/waves"]')).toBeInTheDocument();
  expect(container).not.toHaveTextContent(/not available/i);
});

it("removes purchasing FAQs and gives the wallet question non-purchasing copy", () => {
  const { container } = render(
    <FaqSection links={links} locale="en-US" hideNftPurchasing />
  );
  expect(
    screen.queryByText("What does it cost to collect a Meme Card?")
  ).toBeNull();
  expect(screen.queryByText(/How does subscription minting/)).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Do I need a wallet or ETH to start?" })
  );
  expect(
    screen.getByText(/You do not need ETH for these activities/)
  ).toBeInTheDocument();
  expect(container).not.toHaveTextContent(/subscription minting|mint price/i);
});

it("removes the logged-in subscription action only when restricted", () => {
  const { result, rerender } = renderHook(
    ({ restricted }) => useJoin6529Journey("en-US", restricted),
    { initialProps: { restricted: true } }
  );
  expect(result.current.secondaryAction).toBeNull();
  rerender({ restricted: false });
  expect(result.current.secondaryAction).toMatchObject({
    href: "/prxt0/subscriptions",
  });
});
