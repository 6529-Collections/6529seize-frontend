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
  SPEC_ROWS,
  USE_ROWS,
} from "@/app/explained/validators/hardware/_lib/data";
import {
  partFacts,
  withPageFacts,
} from "@/app/explained/validators/hardware/_lib/facts";
import {
  DRIVES,
  IDLE,
  PARTS,
  type PartId,
  type PartTier,
} from "@/app/explained/validators/hardware/_lib/partGuide";
import { nb } from "@/app/explained/validators/hardware/_lib/nb";
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
import PartGuide from "@/app/explained/validators/hardware/PartGuide";

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

  it("opens on the computer you have, and suggests no purchase", () => {
    expect(suggest(DEFAULT_ANSWERS)).toBe("acceptable");
    expect(suggest({ ...DEFAULT_ANSWERS, spare: "no" })).toBe("good");
  });

  it("asks where and what you own as two different questions", () => {
    expect(messages["explained.validators.hardware.chooser.where"]).toMatch(
      /home or office/
    );
    expect(messages["explained.validators.hardware.chooser.spare"]).toMatch(
      /already have a computer/
    );
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
      "acceptable",
    ]);
    expect(visible()[0]).toHaveTextContent(/\$0 to buy, its power only/);
    const spare = container.querySelector('[data-q="spare"]') as HTMLElement;
    fireEvent.click(within(spare).getByRole("button", { name: "No" }));
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
    for (const row of [...MACHINES, ...NODE_ROWS, ...USE_ROWS, ...DRIVES]) {
      expect(known.has(row.source)).toBe(true);
    }
    for (const [id, said] of partFacts()) {
      expect([id, known.has(said.source)]).toEqual([id, true]);
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
        "hw.part.gpu.answer",
        "hw.part.memory.tier.good",
        "hw.part.power.sleep",
        "hw.drive.hdd",
        "hw.idle.pi5",
        "hw.spend.1",
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
        <PartGuide locale="en-US" />
        <Detail locale="en-US" />
      </>
    );
    const facts = [...container.querySelectorAll("[data-fact]")];
    expect(facts.length).toBeGreaterThan(150);
    for (const el of facts) {
      expect([el.getAttribute("data-fact"), el.getAttribute("title")]).toEqual([
        el.getAttribute("data-fact"),
        expect.stringMatching(/^Source: .+(2026|estimate)/),
      ]);
    }
  });

  it("shows the parts after the card's tiers, and the cloud table after both", () => {
    const { container } = render(
      <>
        <Hero locale="en-US" version={null} />
        <HomeOffice locale="en-US" />
        <Datacenter locale="en-US" />
        <EveryValidator locale="en-US" />
        <PartGuide locale="en-US" />
        <Detail locale="en-US" />
      </>
    );
    const order = [
      ...container.querySelectorAll(
        "#home, #datacenter, #parts, [data-lens='cloud']"
      ),
    ].map((el) => el.id || el.getAttribute("data-lens"));
    expect(order).toEqual(["home", "datacenter", "parts", "cloud"]);
  });
});

describe("numbers on a line", () => {
  it("keeps a range and its unit together", () => {
    const { container } = render(
      <p>{nb("About $10–13 a month, 1.5–2 GB at the peak, 12 W idle.")}</p>
    );
    const kept = [...container.querySelectorAll(".tw-whitespace-nowrap")].map(
      (el) => el.textContent
    );
    expect(kept).toEqual(["$10–13", "1.5–2 GB", "12 W"]);
    expect(container.textContent).toBe(
      "About $10–13 a month, 1.5–2 GB at the peak, 12 W idle."
    );
  });

  it("prints every cloud total with cents", () => {
    for (const provider of CLOUD) {
      for (const row of provider.rows) {
        expect([row.id, /^\$\d[\d,]*\.\d{2}$/.test(row.total)]).toEqual([
          row.id,
          true,
        ]);
      }
    }
  });
});

describe("part by part", () => {
  const partOf = (id: PartId) => {
    const part = PARTS.find((entry) => entry.id === id);
    if (!part) throw new Error(id);
    return part;
  };
  const tierText = (id: PartId, tier: PartTier) => {
    const tiers = partOf(id).tiers;
    return "text" in tiers ? tiers.text : tiers[tier].text;
  };
  const usesOf = (id: PartId) =>
    partOf(id)
      .uses.map((said) => said.text)
      .join(" ");

  it("covers each part, the answer first and short", () => {
    expect(PARTS.map((part) => part.id)).toEqual([
      "cpu",
      "gpu",
      "memory",
      "storage",
      "network",
      "power",
      "system",
    ]);
    for (const part of PARTS) {
      const words = part.answer.text.split(/\s+/).length;
      expect([part.id, words <= 8]).toEqual([part.id, true]);
      expect([part.id, part.uses.length > 0]).toEqual([part.id, true]);
      // Every part says what not to buy, except one that is not needed.
      expect([part.id, (part.avoid?.text.length ?? 0) > 0]).toEqual([
        part.id,
        part.answer.text !== "Not needed.",
      ]);
    }
  });

  it("says a GPU is not needed, and where 6529 uses GPUs", () => {
    expect(partOf("gpu").answer.text).toBe("Not needed.");
    expect(usesOf("gpu")).toMatch(
      /zero-knowledge proofs[^.]*\. Making proofs is not a validator’s job\./
    );
    // Said once, not three times.
    expect(tierText("gpu", "good")).toBe(
      "None. A machine without a graphics card draws less power."
    );
  });

  it("agrees with the card's chips at every tier", () => {
    const chipPart = (chip: string): [PartId, string] => {
      if (/cores|vCPU/.test(chip)) return ["cpu", chip];
      if (/ RAM$/.test(chip)) return ["memory", chip.replace(/ RAM$/, "")];
      if (/ W$/.test(chip) || chip === "UPS") return ["power", chip];
      return ["storage", chip.replace(/ with its own Ethereum node$/, "")];
    };
    const cards: [PartTier, readonly string[]][] = [
      ["acceptable", CARD.tiers.acceptable.chips],
      ["good", CARD.tiers.good.chips],
      ["great", CARD.tiers.great.chips],
      ["rack", CARD.dc.rack.chips],
      ["cloud", CARD.dc.cloud.chips],
    ];
    for (const [tier, chips] of cards) {
      for (const chip of chips) {
        const [part, value] = chipPart(chip);
        expect([tier, chip, tierText(part, tier).includes(value)]).toEqual([
          tier,
          chip,
          true,
        ]);
      }
    }
  });

  it("prints the fixed build's figures, never the old ones", () => {
    const all = JSON.stringify([PARTS, FACTS, SPEC_ROWS, USE_ROWS, MACHINES]);
    expect(all).not.toMatch(/560 MB|2\.6 GB|ADX|BMI2|OS \(Bookworm\)/);
    // Round 1's corrections: no "at rest", no "at worst", no 00:30 run, no
    // drive that a node must not use setting a price.
    expect(all).not.toMatch(/at rest|at worst|00:30|NM790|1\.7–5\.7/);
    expect(usesOf("memory")).toMatch(
      /About 47 MB at start[^]*1\.5–2 GB at the daily peak/
    );
    expect(usesOf("cpu")).toMatch(
      /any 64-bit x86 processor, old ones included, and on 64-bit Arm/
    );
    expect(usesOf("system")).toMatch(
      /Not supported: 32-bit systems, and Windows on Arm\./
    );
  });

  it("writes its lines plainly", () => {
    const lines: Record<string, string> = Object.fromEntries([
      ...partFacts().map(([id, said]) => [id, said.text]),
      ...DRIVES.map((row) => [row.id, `${row.alone} ${row.node}`]),
      ...IDLE.map((row) => [row.id, row.machine]),
    ]);
    expect(lintVoice(lines)).toEqual([]);
    const banned =
      /\b(seamless|robust|leverage|unlock|empower|elevate|delve|cutting-edge|game-changer|effortless|journey|simply|blazing|rock-solid)\b/i;
    for (const [id, text] of Object.entries(lines)) {
      expect([
        id,
        banned.test(text),
        text.includes("!"),
        text.includes("—"),
      ]).toEqual([id, false, false, false]);
    }
  });

  it("shows each part's answer, and opens to the tiers with Good recommended", () => {
    const { container } = render(<PartGuide locale="en-US" />);
    const rows = [...container.querySelectorAll("[data-part]")];
    expect(rows.map((row) => row.getAttribute("data-part"))).toEqual(
      PARTS.map((part) => part.id)
    );
    const gpu = container.querySelector('[data-part="gpu"]') as HTMLElement;
    expect(gpu.querySelector("summary")).toHaveTextContent(
      "Graphics card (GPU)Not needed.Nothing in the validator uses a GPU."
    );
    const memory = container.querySelector(
      '[data-part="memory"]'
    ) as HTMLElement;
    expect(memory.hasAttribute("open")).toBe(false);
    expect(within(memory).getByText("Recommended")).toBeInTheDocument();
    expect(
      container.querySelector('[data-fact="hw.part.memory.tier.good"]')
    ).toHaveTextContent(/^16\sGB: room/);
  });
});
