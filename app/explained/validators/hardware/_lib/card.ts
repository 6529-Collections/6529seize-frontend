/**
 * The owner's approved hardware card of October 31, 2026, word for word. The
 * page prints these sentences exactly as written and in the card's order:
 * the lede, the testing period, Home / Office, Datacenter, Large TDH
 * holders, For every validator. They are quoted, so they live here and not
 * in the message file: the lede keeps the owner's "independently written"
 * (the voice lint's "separately written" rule is for the pages' own copy),
 * and the card's numbers print as one sourced fact, the card itself.
 *
 * Costs are not here. The card's prices were checked again on October 31, 2026
 * and the page prints today's, each with its source (`data.ts`).
 */
export const CARD = {
  title: "6529 Validator Hardware Recommendation",
  lede: "Validators are how the 6529 network decentralizes. Release 0.1 starts with their first job: every day, each validator computes TDH from Ethereum with two independently written programs, signs the result with keys your wallet authorizes, and agrees on it with the others. Each release adds more of the network’s work.",
  testing: {
    tag: "Testing period",
    lead: "None of this matters yet.",
    body: "Run it on any machine you have, from an old laptop to your current computer to a Raspberry Pi to a cloud VM, and tell us what works. These are guides for later, not requirements for the test phase.",
  },
  home: {
    kicker: "Home / Office",
    title: "Three tiers",
    note: "Tor on by default, your location stays private",
  },
  tiers: {
    acceptable: {
      name: "Acceptable",
      what: "A PC you already own, or a Raspberry Pi 5.",
      chips: ["4 cores", "8 GB RAM", "256–512 GB SSD"],
      data: "checked reads from public servers",
    },
    good: {
      name: "Good",
      what: "A mini PC (Intel N150 or a small Ryzen) on wired Ethernet, with a small UPS.",
      chips: ["4–8 cores", "16 GB RAM", "1–2 TB NVMe", "8–20 W"],
      data: "checked reads from public servers",
    },
    great: {
      name: "Great",
      what: "A home server that also runs its own Ethereum node.",
      chips: ["8 cores", "32 GB RAM", "4 TB NVMe", "UPS", "15–30 W"],
      data: "your own node",
    },
  },
  recommended: "Recommended",
  dataLabel: "Ethereum data:",
  datacenter: {
    kicker: "Datacenter",
    title: "Two options",
    note: "Rack mode: always on, can also serve as a bootstrap node",
  },
  dc: {
    rack: {
      name: "Rack",
      what: "A bare-metal server racked in a datacenter, rented or colocated, with redundant power and network.",
      chips: [
        "8–16 cores",
        "32–64 GB RAM",
        "NVMe in RAID",
        "4–8 TB with its own Ethereum node",
      ],
    },
    cloud: {
      name: "Cloud VM",
      what: "A virtual machine at a cloud provider: AWS EC2, Google Cloud, Azure, Hetzner, DigitalOcean and their equivalents.",
      chips: ["2–4 vCPU", "8–16 GB RAM", "100–200 GB SSD"],
    },
  },
  holders: {
    kicker: "Large TDH holders",
    title: "One account, several machines",
    note: "For those who can afford to run multiple validators, it improves network decentralization. This is not necessary in this test phase.",
    items: [
      {
        title: "Keep one account",
        body: "Keep your wallets consolidated. Splitting does not create any decentralization or economic benefit.",
      },
      {
        title: "Run several validators in distinct locations",
        body: "One account can authorize up to 16 keys, each with its own share of your TDH weight.",
      },
      {
        title: "Spread them out",
        body: "Home and datacenter, different providers, countries and Ethereum data sources.",
      },
      {
        title: "One key, one machine",
        body: "Never use the same key for different machines, as it could accidentally lead to a double vote, excluding your whole account.",
      },
    ],
  },
  every: {
    label: "For every validator",
    facts: [
      { bold: "No ETH needed", rest: " at any tier. Nothing is staked." },
      {
        bold: "Keys can’t move",
        rest: " your NFTs or funds. They only sign the day’s results.",
      },
      { bold: "About 50 GB a month", rest: " of Ethereum data." },
      { bold: "Light work:", rest: " Uptime matters more than power." },
    ],
  },
  fine: "Costs are estimates; home and office monthly costs spread the hardware over four years, plus power.",
} as const;

export type TierId = keyof typeof CARD.tiers;
export type DcId = keyof typeof CARD.dc;
