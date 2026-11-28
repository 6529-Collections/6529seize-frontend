import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type AbiEntry = { readonly type: string; readonly name?: string };
type Allow = { readonly functions: readonly string[]; readonly events: readonly string[] };

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { writeAddresses, filterAbi, formatAbiModule } = require("../../scripts/stream/sync-stream-abis.cjs") as {
  writeAddresses: (args: { source: string; record: string; gate: string | null; outDir: string; commit: string }) => void;
  filterAbi: (abi: readonly AbiEntry[], allow: Allow, name?: string) => AbiEntry[];
  formatAbiModule: (exportName: string, abi: readonly AbiEntry[], header: string) => string;
};

const NAMES = [
  "Accounts", "ContentStore", "EconomicsResolver", "EnglishAuction", "UniformEditionAuction",
  "IndependentEditionAuction", "IndependentStreamRegistry", "IndependentStream721Deployer",
  "IndependentStreamEditionsDeployer", "PackageRegistry", "Renderer", "SaleStarter", "SplitFactory",
  "Stream6529", "StreamDirectory6529", "StreamEditions6529", "StreamWorkFacts6529", "MuseumVault",
];

function setup(record: Record<string, unknown>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sync-stream-"));
  fs.writeFileSync(path.join(dir, "record.json"), JSON.stringify(record));
  return dir;
}

const full = Object.fromEntries([
  ...NAMES.map((name, index) => [name, `0x${(index + 1).toString(16).padStart(40, "0")}`]),
  ["chainId", 11155111],
  ["confirmed", true],
  ["startBlock", 12227835],
]);

describe("sync-stream-abis writeAddresses", () => {
  it("writes the addresses and start block of a confirmed Sepolia record", () => {
    const dir = setup(full);
    writeAddresses({ source: dir, record: "record.json", gate: "0x843d8DCdD279215225f39AFCA33a5Fd4E84370Ac", outDir: dir, commit: "abc" });
    const out = fs.readFileSync(path.join(dir, "addresses.ts"), "utf8");
    expect(out).toContain("export const startBlock = 12227835n;");
    expect(out).toContain('openGate: "0x843d8DCdD279215225f39AFCA33a5Fd4E84370Ac"');
    expect(out).toContain('splitLedger: "0x');
  });
  it("refuses an unconfirmed record", () => {
    const dir = setup({ ...full, confirmed: false });
    expect(() => writeAddresses({ source: dir, record: "record.json", gate: null, outDir: dir, commit: "abc" })).toThrow(/not confirmed/);
  });
  it("refuses another chain", () => {
    const dir = setup({ ...full, chainId: 1 });
    expect(() => writeAddresses({ source: dir, record: "record.json", gate: null, outDir: dir, commit: "abc" })).toThrow(/not a Sepolia/);
  });
  it("refuses a record missing a contract", () => {
    const { Renderer: _omitted, ...missing } = full;
    const dir = setup(missing);
    expect(() => writeAddresses({ source: dir, record: "record.json", gate: null, outDir: dir, commit: "abc" })).toThrow(/Renderer/);
  });
});

describe("sync-stream-abis filterAbi", () => {
  const abi: AbiEntry[] = [
    { type: "constructor" },
    { type: "function", name: "bid" },
    { type: "error", name: "SaleClosed" },
    { type: "function", name: "owner" },
    { type: "event", name: "BidPlaced" },
    { type: "function", name: "bid" },
    { type: "event", name: "Transfer" },
    { type: "error", name: "NotOwner" },
    { type: "fallback" },
  ];

  it("keeps the allowed functions (every overload) and events and every error, in source order", () => {
    expect(filterAbi(abi, { functions: ["bid"], events: ["BidPlaced"] })).toEqual([
      { type: "function", name: "bid" },
      { type: "error", name: "SaleClosed" },
      { type: "event", name: "BidPlaced" },
      { type: "function", name: "bid" },
      { type: "error", name: "NotOwner" },
    ]);
  });
  it("refuses an allowed name the ABI does not have", () => {
    expect(() => filterAbi(abi, { functions: ["bid", "settle"], events: [] }, "EnglishAuction")).toThrow(
      /EnglishAuction has no function settle/
    );
    expect(() => filterAbi(abi, { functions: [], events: ["Settled"] })).toThrow(/no event Settled/);
  });
  it("does not treat Object.prototype names as allowed types", () => {
    expect(filterAbi([{ type: "constructor" }, { type: "toString" }], { functions: [], events: [] })).toEqual([]);
  });
  it("writes one entry per line", () => {
    const out = formatAbiModule("testAbi", filterAbi(abi, { functions: ["owner"], events: [] }), "// header");
    expect(out).toBe(
      [
        "// header",
        "export const testAbi = [",
        '  {"type":"error","name":"SaleClosed"},',
        '  {"type":"function","name":"owner"},',
        '  {"type":"error","name":"NotOwner"},',
        "] as const;",
        "",
      ].join("\n")
    );
  });
});
