import { readFileSync } from "node:fs";
import path from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { chapterById } from "@/components/explained/shell/chapters";
import { lintNumbers, lintVoice } from "@/lib/explained/voice";
import { CARD } from "@/app/explained/validators/hardware/_lib/card";
import {
  DEFAULT_ANSWERS,
  asksSpare,
  suggest,
  type Answer,
} from "@/app/explained/validators/hardware/_lib/chooser";
import {
  CLOUD,
  NODE_ROWS,
} from "@/app/explained/validators/hardware/_lib/cloud";
import {
  FACTS,
  MACHINES,
  USE_ROWS,
} from "@/app/explained/validators/hardware/_lib/data";
import { withPageFacts } from "@/app/explained/validators/hardware/_lib/facts";
import { SOURCES } from "@/app/explained/validators/hardware/_lib/sources";
import {
  Datacenter,
  EveryValidator,
  HomeOffice,
  LargeHolders,
} from "@/app/explained/validators/hardware/CardSections";
import { shownRows } from "@/app/explained/validators/hardware/CloudTable";
import Detail from "@/app/explained/validators/hardware/Detail";
import Hero from "@/app/explained/validators/hardware/Hero";

/**
 * Validators · Hardware (`/explained/validators/hardware`): the owner's card
 * is printed as written, the chooser points home first, every number has a
 * source and a day, the cloud totals add up, and the copy passes the lints.
 */
const MESSAGES = path.resolve(
  __dirname,
  "../../i18n/messages/explainedValidatorsHardware.en-US.json"
);
const messages = JSON.parse(readFileSync(MESSAGES, "utf8")) as Record<
  string,
  string
>;

const dollars = (text: string) => Number(text.replace(/[^0-9.]/g, ""));

describe("the owner's card", () => {
  it("keeps the approved sentences word for word", () => {
    expect(CARD.lede).toBe(
      "Validators are how the 6529 network decentralizes. Release 0.1 starts with their first job: every day, each validator computes TDH from Ethereum with two independently written programs, signs the result with keys your wallet authorizes, and agrees on it with the others. Each release adds more of the network’s work."
    );
    expect(`${CARD.testing.lead} ${CARD.testing.body}`).toBe(
      "None of this matters yet. Run it on any machine you have, from an old laptop to your current computer to a Raspberry Pi to a cloud VM, and tell us what works. These are guides for later, not requirements for the test phase."
    );
    expect(CARD.holders.note).toBe(
      "For those who can afford to run multiple validators, it improves network decentralization. This is not necessary in this test phase."
    );
    expect(CARD.holders.items.map((item) => item.title)).toEqual([
      "Keep one account",
      "Run several validators in distinct locations",
      "Spread them out",
      "One key, one machine",
    ]);
    expect(CARD.every.facts.map((fact) => `${fact.bold}${fact.rest}`)).toEqual([
      "No ETH needed at any tier. Nothing is staked.",
      "Keys can’t move your NFTs or funds. They only sign the day’s results.",
      "About 50 GB a month of Ethereum data.",
      "Light work: Uptime matters more than power.",
    ]);
  });

  it("never claims the network is decentralized (D149)", () => {
    const all = JSON.stringify(CARD) + JSON.stringify(messages);
    expect(all).not.toMatch(/\bis decentrali[sz]ed\b/i);
    expect(all).not.toMatch(/\bdecentrali[sz]ed network\b/i);
  });
});

describe("the copy", () => {
  it("passes the voice and number lints", () => {
    expect(lintVoice(messages)).toEqual([]);
    expect(lintNumbers(messages)).toEqual([]);
  });

  it("uses none of the filler words, exclamation marks or em dashes", () => {
    const banned =
      /\b(seamless|robust|leverage|unlock|empower|elevate|delve|cutting-edge|game-changer|effortless|journey|simply|blazing|rock-solid)\b/i;
    for (const [key, text] of Object.entries(messages)) {
      expect([key, banned.test(text)]).toEqual([key, false]);
      expect([key, text.includes("!")]).toEqual([key, false]);
      expect([key, text.includes("—")]).toEqual([key, false]);
    }
  });
});

describe("the chooser", () => {
  const answers: Answer[] = ["yes", "no"];

  it("opens on the recommended tier", () => {
    expect(suggest(DEFAULT_ANSWERS)).toBe("good");
  });

  it("sends only readers who can't run at home to a datacenter", () => {
    for (const node of answers) {
      for (const spare of answers) {
        expect(suggest({ where: "no", node, spare })).toBe(
          node === "yes" ? "rack" : "cloud"
        );
        expect(
          ["acceptable", "good", "great"].includes(
            suggest({ where: "yes", node, spare })
          )
        ).toBe(true);
      }
    }
    expect(suggest({ where: "yes", node: "yes", spare: "no" })).toBe("great");
    expect(suggest({ where: "yes", node: "no", spare: "yes" })).toBe(
      "acceptable"
    );
  });

  it("asks about a spare computer only at home without a node", () => {
    expect(asksSpare({ where: "yes", node: "no", spare: "no" })).toBe(true);
    expect(asksSpare({ where: "yes", node: "yes", spare: "no" })).toBe(false);
    expect(asksSpare({ where: "no", node: "no", spare: "no" })).toBe(false);
  });

  it("shows the suggestion the answers lead to", () => {
    const { container } = render(<Hero locale="en-US" version={null} />);
    const visible = () =>
      [...container.querySelectorAll("[data-suggestion]")].filter(
        (el) => !el.hasAttribute("hidden")
      );
    expect(visible().map((el) => el.getAttribute("data-suggestion"))).toEqual([
      "good",
    ]);
    const where = container.querySelector('[data-q="where"]') as HTMLElement;
    fireEvent.click(within(where).getByRole("button", { name: "No" }));
    expect(visible().map((el) => el.getAttribute("data-suggestion"))).toEqual([
      "cloud",
    ]);
    expect(container.querySelector('[data-q="spare"]')).toBeNull();
  });
});

describe("sources", () => {
  it("gives every source a day it was read", () => {
    for (const [id, source] of Object.entries(SOURCES)) {
      expect([id, /^\d{4}-\d{2}-\d{2}$/.test(source.read)]).toEqual([id, true]);
    }
  });

  it("links every cloud provider's own price source", () => {
    for (const provider of CLOUD) {
      expect([provider.id, "url" in SOURCES[provider.source]]).toEqual([
        provider.id,
        true,
      ]);
    }
  });

  it("names a source for every fact and every table row", () => {
    const known = new Set(Object.keys(SOURCES));
    for (const fact of Object.values(FACTS)) {
      expect(known.has(fact.source)).toBe(true);
    }
    for (const row of [...MACHINES, ...NODE_ROWS, ...USE_ROWS]) {
      expect(known.has(row.source)).toBe(true);
    }
  });

  it("adds the page's facts to the snapshot for the JSON download", () => {
    const snapshot = withPageFacts(
      { asOf: "2026-10-31T12:00:00Z", facts: {} },
      "en-US"
    );
    expect(Object.keys(snapshot.facts)).toEqual(
      expect.arrayContaining([
        "hw.tier.good.buy",
        "hw.card.lede",
        "hw.cloud.aws.t4g.large",
        "hw.machine.pi5",
        "hw.node.ax102",
      ])
    );
  });
});

describe("cloud prices", () => {
  const ipv4 = 3.65;

  it("adds up: machine, disk and a public address at AWS and Azure", () => {
    for (const id of ["aws", "azure"]) {
      const provider = CLOUD.find((entry) => entry.id === id);
      for (const row of provider?.rows ?? []) {
        const disk = dollars(row.disk.split(",")[1] ?? "");
        expect([
          row.id,
          (dollars(row.machine) + disk + ipv4).toFixed(2),
        ]).toEqual([row.id, row.totalUsd.toFixed(2)]);
      }
    }
  });

  it("lists the cheapest type that can be ordered at each provider, cheapest first", () => {
    const rows = shownRows(CLOUD, "all", "any");
    expect(rows).toHaveLength(CLOUD.length);
    const totals = rows.map((entry) => entry.row?.totalUsd ?? Infinity);
    expect([...totals].sort((a, b) => a - b)).toEqual(totals);
    const hetzner = rows.find((entry) => entry.provider.id === "hetzner");
    expect(hetzner?.row?.type).toBe("CPX32");
  });

  it("says when a provider has no Arm types", () => {
    const rows = shownRows(CLOUD, "digitalocean", "arm");
    expect(rows).toEqual([
      { provider: expect.objectContaining({ id: "digitalocean" }), row: null },
    ]);
    const arm = shownRows(CLOUD, "all", "arm")
      .filter((entry) => entry.row !== null)
      .map((entry) => entry.provider.id)
      .sort();
    expect(arm).toEqual(["aws", "azure", "gcp", "oracle"]);
  });
});

describe("the page", () => {
  it("is the first live page of a chapter that is still coming", () => {
    const chapter = chapterById("validators");
    expect(chapter.status).toBe("coming");
    expect(chapter.href).toBeNull();
    expect(chapter.read.map((page) => page.href)).toEqual([
      "/explained/validators/hardware",
    ]);
  });

  it("prints the card in its order, home first, Good recommended", () => {
    const { container } = render(
      <>
        <HomeOffice locale="en-US" />
        <Datacenter locale="en-US" />
        <LargeHolders locale="en-US" />
        <EveryValidator locale="en-US" />
      </>
    );
    const headings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);
    expect(headings).toEqual([
      "Three tiers",
      "Two options",
      "One account, several machines",
      "For every validator",
    ]);
    const good = container.querySelector("#tier-good") as HTMLElement;
    expect(within(good).getByText("Recommended")).toBeInTheDocument();
    expect(good).toHaveTextContent(CARD.tiers.good.what);
  });

  it("prints every number with its source", () => {
    const { container } = render(
      <>
        <HomeOffice locale="en-US" />
        <Datacenter locale="en-US" />
        <Detail locale="en-US" />
      </>
    );
    const facts = [...container.querySelectorAll("[data-fact]")];
    expect(facts.length).toBeGreaterThan(80);
    for (const el of facts) {
      expect([el.getAttribute("data-fact"), el.getAttribute("title")]).toEqual([
        el.getAttribute("data-fact"),
        expect.stringMatching(/^Source: .+(2026|estimate)/),
      ]);
    }
  });

  it("shows the cloud table after the home tiers, never first", () => {
    const { container } = render(
      <>
        <Hero locale="en-US" version={null} />
        <HomeOffice locale="en-US" />
        <Datacenter locale="en-US" />
        <Detail locale="en-US" />
      </>
    );
    const order = [
      ...container.querySelectorAll("#home, #datacenter, [data-lens='cloud']"),
    ].map((el) => el.id || el.getAttribute("data-lens"));
    expect(order).toEqual(["home", "datacenter", "cloud"]);
  });
});
