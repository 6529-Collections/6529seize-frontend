import { render, screen } from "@testing-library/react";
import UserPageStatsActivityDistributionsTable from "@/components/user/stats/activity/distributions/UserPageStatsActivityDistributionsTable";
import { getDistributionsMessage } from "@/components/user/stats/activity/distributions/distributions.messages";

jest.mock(
  "@/components/user/stats/activity/distributions/UserPageStatsActivityDistributionsTableItem",
  () => (props: any) => (
    <tr data-testid="item" data-locale={props.locale}>
      <td>{props.item.name}</td>
    </tr>
  )
);

const items = [
  {
    card_id: 1,
    contract: "0x33FD426905F149f8376e227d0C9D3340AaD17aF1",
    wallet: "0x1",
    wallet_display: "A",
    card_name: "Card1",
    mint_date: "2020-01-01",
    airdrops: 1,
    total_spots: 0,
    minted: 2,
    allowlist: [{ phase: "phase1", spots: 3 }],
    total_count: 5,
    phases: ["phase1", "AIRDROP"],
  },
  {
    card_id: 2,
    contract: "0x0C58Ef43fF3032005e472cB5709f8908aCb00205",
    wallet: "0x2",
    wallet_display: "B",
    card_name: "Card2",
    mint_date: "2020-01-02",
    airdrops: 0,
    total_spots: 0,
    minted: 1,
    allowlist: [],
    total_count: 3,
    phases: ["phase1"],
  },
];

const profile = { wallets: [{ wallet: "0x1", display: "disp1" }] } as any;

test("renders rows, phase headers, and a named table", () => {
  render(
    <UserPageStatsActivityDistributionsTable
      items={items}
      profile={profile}
      loading={false}
    />
  );
  expect(
    screen.getByRole("table", {
      name: getDistributionsMessage(
        "user.collected.stats.distributions.tableCaption"
      ),
    })
  ).toBeInTheDocument();
  expect(screen.getAllByTestId("item")).toHaveLength(2);
  expect(screen.getByText("Phase1")).toBeInTheDocument();
  expect(
    screen.getByText(
      getDistributionsMessage(
        "user.collected.stats.distributions.phases.airdrop"
      )
    )
  ).toBeInTheDocument();
  expect(
    screen.queryByText(
      getDistributionsMessage("user.collected.stats.distributions.loading")
    )
  ).not.toBeInTheDocument();
});

test("renders the loading label only while loading", () => {
  render(
    <UserPageStatsActivityDistributionsTable
      items={items}
      profile={profile}
      loading={true}
    />
  );
  expect(
    screen.getByText(
      getDistributionsMessage("user.collected.stats.distributions.loading")
    )
  ).toBeInTheDocument();
});

test("passes active locale to distribution table items", () => {
  render(
    <UserPageStatsActivityDistributionsTable
      items={items}
      profile={profile}
      loading={false}
      locale="de-DE"
    />
  );

  expect(screen.getAllByTestId("item")[0]).toHaveAttribute(
    "data-locale",
    "de-DE"
  );
});
