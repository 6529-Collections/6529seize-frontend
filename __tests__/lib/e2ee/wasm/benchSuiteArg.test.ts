// eslint-disable-next-line @typescript-eslint/no-var-requires
const { parseSuiteArg, parseSuiteOption } =
  require("../../../../native/mls-wasm/bench/suite-arg.cjs") as {
    parseSuiteArg: (value: string | undefined) => number | undefined;
    parseSuiteOption: (args: readonly string[]) => number | undefined;
  };

describe("mls-wasm benchmark --suite", () => {
  it("accepts decimal and 0x-hex code points", () => {
    expect(parseSuiteArg("78")).toBe(0x004e);
    expect(parseSuiteArg("0x004e")).toBe(78);
    expect(parseSuiteArg("0x004E")).toBe(78);
    expect(parseSuiteArg("79")).toBe(0x004f);
    expect(parseSuiteArg("0x4f")).toBe(79);
    expect(parseSuiteArg(undefined)).toBeUndefined();
  });

  it("refuses anything that is not a uint16 code point", () => {
    for (const bad of [
      "",
      "x",
      "0x",
      "78abc",
      "-1",
      "1.5",
      "0x10000",
      "65536",
    ]) {
      expect(() => parseSuiteArg(bad)).toThrow(/--suite must be/);
    }
  });

  it("reads --suite from the arguments and refuses it without a value", () => {
    expect(parseSuiteOption(["2", "256"])).toBeUndefined();
    expect(parseSuiteOption(["2", "--suite", "0x004e"])).toBe(78);
    expect(parseSuiteOption(["--suite", "78", "--reps", "5"])).toBe(78);
    expect(() => parseSuiteOption(["2", "--suite"])).toThrow(
      /--suite needs a value/
    );
    expect(() => parseSuiteOption(["--suite", "--reps", "5"])).toThrow(
      /--suite needs a value/
    );
  });
});
