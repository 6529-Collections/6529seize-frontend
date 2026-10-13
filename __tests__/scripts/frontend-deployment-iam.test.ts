import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

describe.each(["staging", "production", "delegation-docs"])(
  "%s deployment IAM manifest",
  (environment) => {
    it("matches the exact compact policy document", () => {
      const directory = path.join(
        process.cwd(),
        "ops",
        "iam",
        `frontend-${environment}`
      );
      const manifest = JSON.parse(
        fs.readFileSync(path.join(directory, "manifest.json"), "utf8")
      ) as {
        policies: { file: string; characters: number; sha256: string }[];
      };

      expect(manifest.policies.length).toBeGreaterThan(0);
      for (const policy of manifest.policies) {
        const compact = JSON.stringify(
          JSON.parse(fs.readFileSync(path.join(directory, policy.file), "utf8"))
        );
        expect(compact.length).toBe(policy.characters);
        expect(createHash("sha256").update(compact).digest("hex")).toBe(
          policy.sha256
        );
      }
    });
  }
);
