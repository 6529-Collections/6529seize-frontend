import type { SourceId } from "./sources";

/**
 * The hardware page's facts: every number it prints, each with the source
 * it was read from (`sources.ts`). The message file holds the sentences and
 * a placeholder where a number goes; the number comes from here, printed
 * with its source (`facts.tsx`), the 6529 Explained facts-layer pattern. An
 * id that is not here fails the typecheck.
 *
 * All prices were read on Oct 31, 2026: US dollars, on-demand, before tax,
 * a month of 730 hours, euros at the ECB rate of Oct 30.
 */
interface FactDef {
  readonly text: string;
  readonly source: SourceId;
}

const f = (text: string, source: SourceId): FactDef => ({ text, source });

export const FACTS = {
  // The day it was all read.
  "read.day": f("Oct 31, 2026", "readDay"),

  // What each tier costs today: to buy, and a month over four years with power.
  "tier.acceptable.own": f("$0", "homePrices"),
  "tier.acceptable.buy": f("$0–300", "homePrices"),
  "tier.acceptable.month": f("$7", "homePrices"),
  "tier.good.buy": f("$400–550", "homePrices"),
  "tier.good.month": f("$10–13", "homePrices"),
  "tier.great.buy": f("$2,000–2,200", "homePrices"),
  "tier.great.month": f("$44–49", "homePrices"),
  "dc.rack.month": f("$95–320", "rented"),
  "dc.cloud.month": f("$10–80", "cloudAll"),
  "dc.cloud.bigThree": f("$61–63", "cloudAll"),
  "dc.cloud.egress": f("50 GB", "cloudAll"),
  "dc.colo.month": f("$100–300", "colo"),
  "dc.colo.server": f("$2,000–5,000", "colo"),

  // The tiers' own numbers, as the card gives them.
  "spec.bits": f("64-bit", "code"),
  "spec.acceptable.cores": f("4 cores", "card"),
  "spec.acceptable.ram": f("8 GB", "card"),
  "spec.good.watts": f("12 W", "p53"),
  "spec.great.ram": f("32 GB", "card"),
  "spec.great.disk": f("4 TB", "card"),
  "spec.cloud.vcpu": f("2–4 vCPUs", "card"),
  "spec.cloud.ram": f("8–16 GB", "card"),
  "spec.cloud.ram8": f("8 GB", "card"),
  "power.good.month": f("$1.60", "eia"),
  "power.kwh": f("18.16 cents", "eia"),

  // What one validator uses, and its day.
  "use.wire": f("15–20 GB", "measured"),
  "use.upload": f("under 1 GB", "benchEstimate"),
  "use.windowOpen": f("00:15 UTC", "p53"),
  "use.windowClose": f("19:00 UTC", "p53"),

  // Large holders.
  "holders.keys": f("16", "p53"),

  // Your own Ethereum node.
  "node.disk": f("4 TB", "ethOrg"),
  "node.db": f("1.5–2 TiB", "ethdocker"),
  "node.tooSmall": f("2 TB", "ethOrg"),
  "node.tooSmallBy": f("2027", "ethOrg"),
  "node.ram": f("32 GB", "eip7870"),
  "node.cpu": f("4 cores, 8 threads", "eip7870"),
  "node.down": f("50 Mbps", "eip7870"),
  "node.up": f("15 Mbps", "eip7870"),
  "node.upload": f("1.6–2.5 TB", "ownNode"),
  "node.consensus": f("15–90 GiB", "ethdocker"),
  "node.growthYear": f("2024", "paradigm"),
  "node.rented": f("$95–320", "rented"),
  "node.cloud": f("$475–645", "awsNode"),

  // How the page's numbers were read.
  "use.blocks": f("24", "measured"),
  "month.hours": f("730 hours", "readDay"),
  "eur.rate": f("1 EUR = 1.1172 USD", "ecb"),
  "home.months": f("48 months", "homePrices"),

  // Systems the validator is built for.
  "os.pi": f("64-bit Raspberry Pi OS (Trixie or Bookworm)", "rpiOs"),
  "os.linux": f(
    "64-bit Linux on x86 or Arm with glibc 2.35 or newer: Ubuntu 22.04, Debian 12, Fedora 36 or 64-bit Raspberry Pi OS (Trixie or Bookworm)",
    "docs"
  ),
  "os.mac": f("macOS 11 or newer, Apple silicon or Intel", "docs"),
  "os.windows": f("Windows 10 (version 1809 or newer) or Windows 11", "docs"),

  // Oracle's free tier.
  "oracle.free": f("2 Arm cores, 12 GB of memory and 200 GB of disk", "oracle"),
  "oracle.halvedOn": f("June 15, 2026", "oracle"),
  "oracle.paygFree": f("4 Arm cores and 24 GB of memory", "oracle"),
} as const satisfies Readonly<Record<string, FactDef>>;

export type HwFactId = keyof typeof FACTS;

/** The three home tiers in full: one row per spec, one cell per tier. */
interface SpecRow {
  readonly id:
    | "cpu"
    | "memory"
    | "storage"
    | "disk"
    | "internet"
    | "power"
    | "systems"
    | "connections"
    | "uptime"
    | "cost";
  readonly source: SourceId;
  readonly acceptable: string;
  readonly good: string;
  readonly great: string;
}

const VALIDATOR_DISK =
  "Under 1 GB in the first year and about 2 GB after six years: Ethereum history, the day's TDH weights and the network's votes";

export const SPEC_ROWS: readonly SpecRow[] = [
  {
    id: "cpu",
    source: "card",
    acceptable: "4 cores (2 will do). Any 64-bit processor, old ones included",
    good: "4–8 cores: an Intel N150 or a small Ryzen",
    great: "8 cores, for the Ethereum node",
  },
  {
    id: "memory",
    source: "card",
    acceptable: "8 GB. The validator peaks at about 2 GB, once a day",
    good: "16 GB",
    great: "32 GB, most of it for the Ethereum node",
  },
  {
    id: "storage",
    source: "card",
    acceptable: "256–512 GB SSD",
    good: "1–2 TB NVMe. 512 GB is enough for the validator alone; a node needs 4 TB",
    great:
      "4 TB NVMe, TLC with DRAM: ethereum.org expects 2 TB to be too small by 2027",
  },
  {
    id: "disk",
    source: "benchEstimate",
    acceptable: VALIDATOR_DISK,
    good: VALIDATOR_DISK,
    great:
      "The validator stays under 1 GB a year. The node adds 1.5–2 TiB for a full node in September 2026, and grows",
  },
  {
    id: "internet",
    source: "measured",
    acceptable: "About 0.5 GB a day, 15–20 GB a month",
    good: "About 0.5 GB a day, 15–20 GB a month",
    great:
      "The node sends 1.6–2.5 TB a month to its peers and wants 50 Mbps down and 15 Mbps up",
  },
  {
    id: "power",
    source: "power",
    acceptable:
      "What your computer draws: about 3 W for a Pi 5, up to 75 W for an older desktop tower",
    good: "8–20 W: about $1.60 a month at 12 W",
    great: "15–30 W: about $2–4 a month",
  },
  {
    id: "systems",
    source: "docs",
    acceptable:
      "Linux, macOS or Windows. A Raspberry Pi needs the 64-bit Raspberry Pi OS (Trixie or Bookworm)",
    good: "Linux, macOS or Windows",
    great:
      "Linux, macOS or Windows, beside an execution and a consensus client",
  },
  {
    id: "connections",
    source: "modes",
    acceptable:
      "Outbound only, no port to open. Tor is built in and on, Ethereum calls included",
    good: "Outbound only, no port to open, on wired Ethernet. Tor is built in and on",
    great:
      "Outbound only for the validator, through Tor. The node keeps its own peer connections",
  },
  {
    id: "uptime",
    source: "p53",
    acceptable:
      "About three hours a day inside the signing window, 00:15 to 19:00 UTC, with sleep turned off",
    good: "Always on, with a small UPS for short power cuts",
    great:
      "Always on, with a UPS, so a short power cut doesn't stop the node mid-write",
  },
  {
    id: "cost",
    source: "homePrices",
    acceptable: "$0 if you own it; about $300 for a new Pi 5 with an SSD",
    good: "About $400–550 with a UPS; about $10–13 a month",
    great:
      "About $2,000–2,200 with a UPS and a 4 TB TLC drive with DRAM; about $44–49 a month",
  },
];

/** Machines that fit each tier, with the store and the price on Oct 31. */
interface MachineRow {
  readonly id: string;
  readonly tier: "acceptable" | "good" | "great" | "all";
  readonly machine: string;
  readonly price: string;
  readonly where: string;
  readonly source: SourceId;
}

export const MACHINES: readonly MachineRow[] = [
  {
    id: "owned",
    tier: "acceptable",
    machine: "A computer you already own",
    price: "$0",
    where: "",
    source: "homePrices",
  },
  {
    id: "pi5",
    tier: "acceptable",
    machine: "Raspberry Pi 5, 8 GB, board only",
    price: "$175",
    where: "PiShop.us, in stock ($200 at Adafruit)",
    source: "pishop",
  },
  {
    id: "pi5kit",
    tier: "acceptable",
    machine:
      "The same Pi with a 27 W power supply ($12.95), a 256 GB SSD kit ($99), a cooler and a case",
    price: "about $300",
    where: "PiShop.us; the SSD kit was out of stock",
    source: "pishop",
  },
  {
    id: "g3plus",
    tier: "good",
    machine: "GMKtec NucBox G3 Plus: Intel N150, 16 GB, 512 GB",
    price: "$329.99",
    where: "GMKtec, out of stock",
    source: "gmktec",
  },
  {
    id: "eq14",
    tier: "good",
    machine: "Beelink EQ14: Intel N150, 16 GB, 500 GB, two 2.5 GbE ports",
    price: "$385",
    where: "Beelink, pre-order",
    source: "beelink",
  },
  {
    id: "m8",
    tier: "good",
    machine: "GMKtec M8: Ryzen 5 PRO 6650H, 16 GB, 1 TB",
    price: "$419.99",
    where: "GMKtec, in stock",
    source: "gmktec",
  },
  {
    id: "ser8",
    tier: "great",
    machine: "Beelink SER8: 8-core Ryzen 7 8745HS, 32 GB, 1 TB",
    price: "$829",
    where: "Beelink",
    source: "beelink",
  },
  {
    id: "k8plus",
    tier: "great",
    machine: "GMKtec K8 Plus: 8-core Ryzen 7 8845HS, 32 GB, 1 TB",
    price: "$919.99",
    where: "GMKtec, in stock",
    source: "gmktec",
  },
  {
    id: "990pro",
    tier: "great",
    machine: "Samsung 990 PRO 4 TB for the node, TLC with DRAM",
    price: "$1,099.99",
    where: "samsung.com, list price",
    source: "samsung",
  },
  {
    id: "ups",
    tier: "all",
    machine: "A small UPS, 600–850 VA",
    price: "about $70–150",
    where: "an estimate, not read from a store",
    source: "ups",
  },
];

/** Home and datacenter: how a validator connects in each mode. */
interface ModeRow {
  readonly id: "listen" | "tor" | "identity" | "publish" | "bootstrap";
  readonly home: string;
  readonly rack: string;
}

export const MODE_ROWS: readonly ModeRow[] = [
  {
    id: "listen",
    home: "Outbound only. No port to open, nothing to forward on your router",
    rack: "Listens in public: open the TCP port you set in [p2p] listen, and the same UDP port if you list a QUIC address",
  },
  {
    id: "tor",
    home: "Built in and on by default, Ethereum calls included",
    rack: "Off by default",
  },
  {
    id: "identity",
    home: "A fresh peer identity each session",
    rack: "One peer identity that stays across restarts",
  },
  {
    id: "publish",
    home: "Votes go out after a random delay of up to two hours",
    rack: "Votes go out right away, best through sentry nodes",
  },
  {
    id: "bootstrap",
    home: "No",
    rack: "Can serve as a bootstrap node, so new validators find the network",
  },
];

/**
 * A validator's day, from reading Ethereum to its vote, each with its
 * basis. What it uses of each part (memory, disk, internet) is in the part
 * guide (`partGuide.ts`), not repeated here.
 */
interface UseRow {
  readonly id:
    | "read"
    | "sign"
    | "publish"
    | "catchup"
    | "offline"
    | "start"
    | "full";
  readonly value: string;
  readonly source: SourceId;
}

export const USE_ROWS: readonly UseRow[] = [
  {
    id: "read",
    value:
      "It reads each Ethereum block as it finalizes, through the day, and checks every answer against Ethereum’s block headers",
    source: "docs",
  },
  {
    id: "sign",
    value:
      "From about 00:15 UTC, once Ethereum has finalized the day’s last block, it computes TDH with both programs and signs, within minutes. A vote counts until 19:00 UTC",
    source: "docs",
  },
  {
    id: "publish",
    value:
      "At home, after a random wait of up to two hours, never later than 18:00 UTC, so the time it sends doesn’t point to where it is. In a datacenter, at once",
    source: "modes",
  },
  {
    id: "catchup",
    value:
      "After a sleep or a day off, it first reads the blocks it missed: about 10 minutes for each day, from public servers",
    source: "docs",
  },
  {
    id: "offline",
    value:
      "Seven days without a signature before the account leaves the roster. Its next vote brings it back, with no penalty",
    source: "p53",
  },
  {
    id: "start",
    value: "A minute or two the first time, while Tor connects",
    source: "docs",
  },
  {
    id: "full",
    value:
      "Optional. With your own node: 5 h 05 min on a 48-thread machine. Through a remote server: 1.6–3 TB of receipts, once",
    source: "remoteCheck",
  },
];

/** What a validator with its own node costs a month, for the figure. */
interface CostBar {
  readonly id: "home" | "rented" | "cloud";
  readonly fact: HwFactId;
  readonly low: number;
  readonly high: number;
}

export const NODE_COST_BARS: readonly CostBar[] = [
  { id: "home", fact: "tier.great.month", low: 44, high: 49 },
  { id: "rented", fact: "node.rented", low: 95, high: 320 },
  { id: "cloud", fact: "node.cloud", low: 475, high: 645 },
];

/** The figure's axis: dollars a month. */
export const NODE_COST_AXIS = { max: 700, ticks: [0, 200, 400, 600] } as const;
