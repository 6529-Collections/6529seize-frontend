/** @jest-environment node */
import fs from "node:fs";
import path from "node:path";

import { STREAM_MESSAGES } from "@/i18n/messages/stream";

type MessagesModule = typeof import("@/i18n/messages");
type EnUsModule = typeof import("@/i18n/messages/en-US");

const ROOT = process.cwd();
const SECTION_CODE = /^(app\/stream|components\/stream|lib\/stream)\//;
const SOURCE_ROOTS = [
  "app",
  "components",
  "config",
  "contexts",
  "helpers",
  "hooks",
  "lib",
  "services",
  "utils",
];

/** The proposal's writing rules (fe-stream PROPOSAL section 5, rule 9). */
const BANNED = [
  "being developed",
  "designed to",
  "intended",
  "still needs",
  "remains",
  "candidate",
  "snapshot",
  "evidence",
  "help shape",
  "robust",
  "seamless",
  "ecosystem",
  "leverage",
  "it's important to note",
];

function listSourceFiles(): string[] {
  const files: string[] = [];
  const visit = (relativeDir: string) => {
    for (const entry of fs.readdirSync(path.join(ROOT, relativeDir), {
      withFileTypes: true,
    })) {
      const relativePath = `${relativeDir}/${entry.name}`;
      if (entry.isDirectory()) {
        visit(relativePath);
      } else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
        files.push(relativePath);
      }
    }
  };
  SOURCE_ROOTS.forEach(visit);
  return files;
}

describe("the stream.* message namespace", () => {
  it("keeps section copy out of the shared en-US dictionary", () => {
    jest.isolateModules(() => {
      const { EN_US_MESSAGES } = jest.requireActual<EnUsModule>(
        "@/i18n/messages/en-US"
      );
      // The production /stream placeholder (flag off) is shared copy.
      expect(
        Object.keys(EN_US_MESSAGES).filter(
          (key) =>
            key.startsWith("stream.") && !key.startsWith("stream.placeholder.")
        )
      ).toEqual([]);
      expect(
        Object.keys(STREAM_MESSAGES).filter((key) => key in EN_US_MESSAGES)
      ).toEqual([]);
    });
  });

  it("adds only stream keys", () => {
    expect(
      Object.keys(STREAM_MESSAGES).filter((key) => !key.startsWith("stream."))
    ).toEqual([]);
  });

  it("registers its copy for every locale when the namespace loads", () => {
    jest.isolateModules(() => {
      const { t } = jest.requireActual<MessagesModule>("@/i18n/messages");
      expect(() => t("en-US", "stream.status.core")).toThrow(
        "Missing source message"
      );
      jest.requireActual("@/i18n/namespaces/stream");
      expect(t("en-US", "stream.status.core")).toBe(
        "Pre-audit · Sepolia testnet · mock data"
      );
      expect(t("fr-FR", "stream.status.federated")).toBe(
        "Federated · v1.1 design · mock"
      );
      expect(t("en-US", "stream.eth.amount", { amount: "0.0511" })).toBe(
        "0.0511 ETH"
      );
    });
  });

  it("is imported only by the section's own code", () => {
    const importers = listSourceFiles().filter((file) =>
      fs
        .readFileSync(path.join(ROOT, file), "utf8")
        .includes('"@/i18n/namespaces/stream"')
    );
    expect(importers.length).toBeGreaterThan(0);
    expect(importers.filter((file) => !SECTION_CODE.test(file))).toEqual([]);
  });

  it("follows the writing rules' banned list", () => {
    const offending = Object.entries(STREAM_MESSAGES).filter(([, value]) =>
      BANNED.some((word) => value.toLowerCase().includes(word))
    );
    expect(offending).toEqual([]);
  });
});
