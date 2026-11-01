/**
 * Where every number on the hardware page comes from, and when it was read.
 * Prices were read by hand on one day from each provider's own page, price
 * API or order catalog; the few third-party sources say so. A month is 730
 * hours, prices are on-demand and before tax, and euros are converted at
 * the ECB rate of the day before.
 */
const READ_ON = "2026-10-31";

export interface HwSource {
  /** What it is, as a reader would name it. */
  readonly name: string;
  /** The public page, when there is one. */
  readonly url?: string;
  /** The day this page's value was read (ISO date). */
  readonly read: string;
  /** A source that is not the provider or the project itself. */
  readonly thirdParty?: boolean;
  /** A value worked out from other values, not read from one page. */
  readonly estimate?: boolean;
}

const read = READ_ON;

export const SOURCES = {
  card: {
    name: "the hardware card the owner approved",
    read,
  },
  p53: {
    name: "6529chain P53, design/validator-v1.md at c46d027 (sections 11.2, 15.1 and 15.2a)",
    read,
  },
  modes: {
    name: "6529chain P53 section 8.1 and the validator's operations guide, 0.1.0",
    read,
  },
  docs: {
    name: "the validator's install guide and READMEs, 0.1.0",
    read,
  },
  measured: {
    name: "measured on the validator 0.1.0, and on PublicNode and dRPC with and without gzip (24 blocks)",
    read,
    estimate: true,
  },
  economics: {
    name: "6529chain validator economics study, design/evidence/validator-economics-2026-10-11.md",
    read: "2026-10-11",
  },
  homePrices: {
    name: "store prices (PiShop.us, GMKtec, Beelink, samsung.com, datacenterdisk.com), hardware spread over 48 months, power at the EIA's US average; the UPS is estimated",
    read,
    estimate: true,
  },
  pishop: {
    name: "PiShop.us, a Raspberry Pi reseller",
    url: "https://www.pishop.us/",
    read,
  },
  adafruit: {
    name: "Adafruit",
    url: "https://www.adafruit.com/product/5813",
    read,
  },
  gmktec: {
    name: "GMKtec's store",
    url: "https://www.gmktec.com/",
    read,
  },
  beelink: {
    name: "Beelink's store",
    url: "https://www.bee-link.com/",
    read,
  },
  samsung: {
    name: "samsung.com",
    url: "https://www.samsung.com/us/computing/memory-storage/solid-state-drives/",
    read,
  },
  drives: {
    name: "datacenterdisk.com's 4 TB drive rankings",
    url: "https://datacenterdisk.com/",
    read,
    thirdParty: true,
  },
  ups: {
    name: "an estimate for a 600-850 VA UPS, not read from a store",
    read,
    estimate: true,
  },
  eia: {
    name: "EIA Electric Power Monthly, table 5.6.A: 18.16 cents a kWh, the US residential average for August 2026",
    url: "https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a",
    read,
  },
  ecb: {
    name: "the ECB euro reference rate of October 30, 2026",
    url: "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html",
    read,
  },
  aws: {
    name: "AWS EC2 on-demand price list for US East (N. Virginia), published October 29, 2026, with AWS's EBS and VPC price pages",
    url: "https://aws.amazon.com/ec2/pricing/on-demand/",
    read,
  },
  gcp: {
    name: "gcloud-compute.com, built from Google's billing catalog and updated October 25, 2026, with Google's disk, IP and network price pages",
    url: "https://gcloud-compute.com/",
    read,
    thirdParty: true,
  },
  azure: {
    name: "the Azure Retail Prices API, East US",
    url: "https://prices.azure.com/api/retail/prices",
    read,
  },
  hetzner: {
    name: "Hetzner's cloud plan pages; whether CPX and CCX can be ordered comes from third-party checks of October 13 and 20, 2026",
    url: "https://www.hetzner.com/cloud",
    read,
  },
  digitalocean: {
    name: "DigitalOcean's droplet price page",
    url: "https://www.digitalocean.com/pricing/droplets",
    read,
  },
  vultr: {
    name: "Vultr's public plans API",
    url: "https://api.vultr.com/v2/plans",
    read,
  },
  akamai: {
    name: "Akamai's public Linode API (instance types and transfer prices)",
    url: "https://api.linode.com/v4/linode/types",
    read,
  },
  ovh: {
    name: "OVHcloud's public order catalog, US",
    url: "https://us.ovhcloud.com/vps/",
    read,
  },
  oracle: {
    name: "Oracle Cloud's public price list (updated October 8, 2026) and its Always Free documentation (read again November 1, 2026), which disagree on what a pay-as-you-go account gets free",
    url: "https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm",
    read,
  },
  cloudAll: {
    name: "each cloud provider's own price page, price API or order catalog; pick a provider to see its source",
    read,
  },
  rented: {
    name: "Hetzner's dedicated server pages and OVHcloud's public order catalogs (EU and US)",
    url: "https://www.hetzner.com/dedicated-rootserver/matrix-ax",
    read,
  },
  colo: {
    name: "6529chain P53 section 15.1, for colocation and the server's price",
    read,
    estimate: true,
  },
  remoteCheck: {
    name: "measured against 6529's own node (5 h 05 min); for a remote server, 6529chain P53 section 11.4 (1.6-2.2 TB) and the validator's eth crate README (2-3 TB)",
    read,
  },
  readDay: {
    name: "the day every price and measurement on this page was read",
    read,
  },
  awsNode: {
    name: "AWS EC2 on-demand price list for US East, with AWS's data transfer prices",
    url: "https://aws.amazon.com/ec2/pricing/on-demand/",
    read,
  },
  azureNode: {
    name: "the Azure Retail Prices API, East US, with Azure's bandwidth prices",
    url: "https://prices.azure.com/api/retail/prices",
    read,
  },
  hetznerDedicated: {
    name: "Hetzner's dedicated server pages (AX and EX); the AX102's €259 is its own page's price, in Falkenstein or Helsinki, with two 1.92 TB drives",
    url: "https://www.hetzner.com/dedicated-rootserver/matrix-ax",
    read,
  },
  ovhDedicated: {
    name: "OVHcloud's public order catalogs (EU and US)",
    url: "https://www.ovhcloud.com/en/bare-metal/",
    read,
  },
  ethOrg: {
    name: "ethereum.org, Spin up your own Ethereum node (updated August 17, 2026)",
    url: "https://ethereum.org/en/developers/docs/nodes-and-clients/run-a-node/",
    read,
  },
  eip7870: {
    name: "EIP-7870, hardware and bandwidth recommendations",
    url: "https://eips.ethereum.org/EIPS/eip-7870",
    read,
  },
  ethdocker: {
    name: "eth-docker's resource use page (September 2026)",
    url: "https://ethdocker.com/Usage/ResourceUsage",
    read,
    thirdParty: true,
  },
  ownNode: {
    name: "6529's own Ethereum node, measured while it was syncing (6529chain design/ethereum-node-and-rpc.md section 8)",
    read,
  },
  paradigm: {
    name: "Paradigm, How to Raise the Gas Limit, parts 1 and 2 (March and May 2024)",
    url: "https://www.paradigm.xyz/2024/03/how-to-raise-the-gas-limit-1",
    read,
    thirdParty: true,
  },

  // The part-by-part guide.
  bench: {
    name: "measured on the validator 0.1.0: a test network of four validators replaying ten real days on one 48-thread server, and a home-mode validator with Tor",
    read,
  },
  benchEstimate: {
    name: "worked out from the validator 0.1.0's measured use and its code",
    read,
    estimate: true,
  },
  code: {
    name: "the validator's code and release builds, 0.1.0: its package list, its build targets, and the release check on an emulated 2010 Intel processor",
    read: "2026-11-01",
  },
  proofs: {
    name: "6529chain decision D119, P53 section 8.6 and design/ethereum-input-pipeline.md",
    read: "2026-11-01",
  },
  power: {
    name: "published idle measurements of a Raspberry Pi 5, Intel N150 mini PCs, business mini PCs and older desktops, and Apple's Mac mini power page; priced at the EIA's US average",
    url: "https://support.apple.com/en-us/103253",
    read,
    thirdParty: true,
  },
  sleep: {
    name: "the validator's macOS guide, Microsoft's powercfg documentation and Windows' lid settings, and systemd's sleep targets",
    url: "https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/powercfg-command-line-options",
    read,
  },
  rpiOs: {
    name: "Raspberry Pi's operating system page (Raspberry Pi OS of October 6, 2026, on Debian Trixie)",
    url: "https://www.raspberrypi.com/software/operating-systems/",
    read,
  },
  geth: {
    name: "Geth's database documentation (edited January 12, 2024) and the validator's own crash-safe stores",
    url: "https://geth.ethereum.org/docs/fundamentals/databases",
    read,
  },
  ethdockerHw: {
    name: "eth-docker's hardware page (2026)",
    url: "https://ethdocker.com/Usage/Hardware",
    read,
    thirdParty: true,
  },
} as const satisfies Readonly<Record<string, HwSource>>;

export type SourceId = keyof typeof SOURCES;
