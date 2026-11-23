import { fireEvent, render, screen, within } from "@testing-library/react";
import PhoneWaveTabs, {
  type PhoneWaveTab,
} from "@/components/brain/my-stream/tabs/PhoneWaveTabs";

const PRIMARY_KEYS = ["chat", "leaderboard", "winners", "votes", "polls"];
const EXAMPLE_TABS: PhoneWaveTab[] = [
  { key: "chat", label: "Chat", onSelect: jest.fn() },
  { key: "leaderboard", label: "Leaderboard", onSelect: jest.fn() },
  { key: "winners", label: "Winners", onSelect: jest.fn() },
  { key: "votes", label: "Votes", onSelect: jest.fn() },
  { key: "polls", label: "Polls", onSelect: jest.fn() },
  { key: "faq", label: "FAQ", onSelect: jest.fn() },
  {
    key: "decisions",
    label: "Decisions",
    badgeCount: 4,
    onSelect: jest.fn(),
  },
];

describe("PhoneWaveTabs", () => {
  it("keeps four primary sections and offers every other section in the sheet", async () => {
    render(
      <PhoneWaveTabs
        tabs={EXAMPLE_TABS}
        primaryKeys={PRIMARY_KEYS}
        activeKey="chat"
      />
    );

    expect(screen.getAllByRole("button").map((tab) => tab.textContent)).toEqual(
      ["Chat", "Leaderboard", "Winners", "Votes", "More"]
    );
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    const sheet = await screen.findByRole("dialog", { name: "Wave sections" });
    expect(within(sheet).getByRole("button", { name: "Polls" })).toBeVisible();
    expect(within(sheet).getByRole("button", { name: "FAQ" })).toBeVisible();
    fireEvent.click(within(sheet).getByRole("button", { name: "Decisions 4" }));
    expect(EXAMPLE_TABS.at(-1)?.onSelect).toHaveBeenCalledTimes(1);
  });

  it("shows the active overflow label and decision count on the trigger", () => {
    render(
      <PhoneWaveTabs
        tabs={EXAMPLE_TABS}
        primaryKeys={PRIMARY_KEYS}
        activeKey="decisions"
      />
    );

    expect(screen.getByRole("button", { name: "Decisions 4" })).toHaveAttribute(
      "aria-current",
      "true"
    );
  });
});
