import {
  buildCsv,
  buildCsvFromRecords,
  readCsvCell,
  toCsvCell,
} from "@/helpers/csv-export.helpers";

describe("toCsvCell", () => {
  it.each([
    ["=SUM(A1:A2)", "'=SUM(A1:A2)"],
    ["+1+1", "'+1+1"],
    ["-2+3", "'-2+3"],
    ["@cmd", "'@cmd"],
    ["\tcell", "'\tcell"],
    ["\rcell", '"\'\rcell"'],
    ["-", "'-"],
    ["-Infinity", "'-Infinity"],
  ])("writes formula-like %j as text", (value, expected) => {
    expect(toCsvCell(value)).toBe(expected);
  });

  it.each([
    [-5, "-5"],
    ["-5", "-5"],
    [-0.25, "-0.25"],
    ["-1e-7", "-1e-7"],
    ["+7", "+7"],
    [0, "0"],
    [12, "12"],
  ])("keeps the plain number %j numeric", (value, expected) => {
    expect(toCsvCell(value)).toBe(expected);
  });

  it("keeps ordinary values and addresses unchanged", () => {
    expect(toCsvCell(`0x${"a".repeat(40)}`)).toBe(`0x${"a".repeat(40)}`);
    expect(toCsvCell("Phase 1")).toBe("Phase 1");
    expect(toCsvCell(true)).toBe("true");
    expect(toCsvCell(null)).toBe("");
    expect(toCsvCell(undefined)).toBe("");
    expect(toCsvCell({ id: 1 })).toBe('"{""id"":1}"');
  });

  it("quotes cells with commas, quotes and line breaks", () => {
    expect(toCsvCell("a,b")).toBe('"a,b"');
    expect(toCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(toCsvCell("two\nlines")).toBe('"two\nlines"');
    expect(toCsvCell("=1,2")).toBe('"\'=1,2"');
  });
});

describe("buildCsv", () => {
  it("joins cells and rows", () => {
    expect(
      buildCsv([
        ["address", "value"],
        ["0xabc", -1],
        ["=evil()", 2],
      ])
    ).toBe("address,value\n0xabc,-1\n'=evil(),2");
  });

  it("builds a header from the first record", () => {
    expect(
      buildCsvFromRecords([
        { wallet: "0xabc", phaseName: "Phase, one" },
        { wallet: "0xdef", phaseName: "+bonus" },
      ])
    ).toBe('wallet,phaseName\n0xabc,"Phase, one"\n0xdef,\'+bonus');
    expect(buildCsvFromRecords([])).toBe("");
  });

  it("keeps columns aligned when a record misses or adds a field", () => {
    const records: object[] = [
      { wallet: "0xabc", amount: 1, phase: "a" },
      { amount: 2, phase: "b" },
      { phase: "c", extra: "=x", wallet: "0xdef", amount: 3 },
    ];
    expect(buildCsvFromRecords(records)).toBe(
      "wallet,amount,phase\n0xabc,1,a\n,2,b\n0xdef,3,c"
    );
  });
});

describe("readCsvCell", () => {
  it("removes only the prefix added before formula-like text", () => {
    expect(readCsvCell("'=SUM(1)")).toBe("=SUM(1)");
    expect(readCsvCell("'-x")).toBe("-x");
    expect(readCsvCell("'quoted")).toBe("'quoted");
    expect(readCsvCell("-5")).toBe("-5");
    expect(readCsvCell(`0x${"b".repeat(40)}`)).toBe(`0x${"b".repeat(40)}`);
  });

  it("round-trips every exported cell", () => {
    for (const value of ["=1", "+a", "-b", "@c", "\td", "0xabc", "-7", "x"]) {
      expect(readCsvCell(toCsvCell(value))).toBe(value);
    }
  });
});
