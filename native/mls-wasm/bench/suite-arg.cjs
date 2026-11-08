/**
 * Parses the benchmark's `--suite` value: a ciphersuite code point in decimal
 * (`78`) or 0x-prefixed hex (`0x004e`). Undefined keeps the module's default
 * suite (0x004F). Anything else throws, so a typo never benchmarks the wrong
 * suite.
 */
function parseSuiteArg(value) {
  if (value === undefined) {
    return undefined;
  }
  const text = String(value).trim();
  if (!/^(?:\d+|0x[0-9a-f]+)$/i.test(text)) {
    throw new Error(
      `--suite must be a code point such as 78 or 0x004e, got ${value}`
    );
  }
  const code = Number(text);
  if (!Number.isInteger(code) || code < 0 || code > 0xffff) {
    throw new Error(`--suite must be a uint16 code point, got ${value}`);
  }
  return code;
}

module.exports = { parseSuiteArg };
