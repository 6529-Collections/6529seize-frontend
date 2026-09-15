import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const validatorPath = path.join(
  process.cwd(),
  "ops",
  "scripts",
  "validate-ethereum-rpc-url.cjs"
);

function validate(value: string) {
  return spawnSync(process.execPath, [validatorPath], {
    encoding: "utf8",
    input: value,
  });
}

describe("Ethereum RPC deployment URL validation", () => {
  it.each([
    "https://eth-mainnet.example.test/v2/key?network=mainnet",
    "http://127.0.0.1:8545",
  ])("accepts a complete HTTP(S) URL: %s", (value) => {
    const result = validate(value);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });

  it.each(["", "https://", "ws://eth-mainnet.example.test", "not-a-url"])(
    "rejects an invalid endpoint without echoing it: %s",
    (value) => {
      const result = validate(value);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "ETHEREUM_RPC_URL must be a complete HTTP(S) URL"
      );
      expect(result.stderr).not.toContain(value || "not-present");
    }
  );

  it("does not print a valid URL", () => {
    const value = "https://eth-mainnet.example.test/private-key";
    const result = validate(value);

    expect(`${result.stdout}${result.stderr}`).not.toContain(value);
  });

  it("is present in the repository", () => {
    expect(fs.existsSync(validatorPath)).toBe(true);
  });
});
