/* eslint-disable security/detect-non-literal-fs-filename -- Build inputs and outputs below are fixed repository-relative URLs. No file path comes from a client, environment variable or command argument. */
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const source = new URL("./", import.meta.url);
const root = new URL("../../", import.meta.url);
const destination = new URL("public/profile-cms/agent/v1/", root);
const check = process.argv.includes("--check");
const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const sha256 = (bytes) =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ ((crc & 1) === 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipFiles(files) {
  const entries = [];
  const directory = [];
  let offset = 0;
  for (const [name, bytes] of files) {
    const fileName = Buffer.from(name);
    const crc = crc32(bytes);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x21, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(bytes.length, 18);
    local.writeUInt32LE(bytes.length, 22);
    local.writeUInt16LE(fileName.length, 26);
    entries.push(local, fileName, bytes);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(bytes.length, 20);
    central.writeUInt32LE(bytes.length, 24);
    central.writeUInt16LE(fileName.length, 28);
    central.writeUInt32LE(offset, 42);
    directory.push(central, fileName);
    offset += local.length + fileName.length + bytes.length;
  }
  const central = Buffer.concat(directory);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(files.size, 8);
  end.writeUInt16LE(files.size, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...entries, central, end]);
}

async function emit(url, bytes) {
  if (check) {
    const existing = await readFile(url).catch(() => null);
    if (!existing?.equals(bytes))
      throw new Error(
        `Generated CMS agent asset is stale: ${fileURLToPath(url).split(/[\\/]/).pop()}`
      );
  } else {
    await writeFile(url, bytes);
  }
}

async function main() {
  const packageSchema = JSON.parse(
    await readFile(
      new URL(
        "ops/workstreams/profile-native-cms-roadmap/phase-1/schemas/cms-package-v1.schema.json",
        root
      ),
      "utf8"
    )
  );
  const contract = JSON.parse(
    await readFile(
      new URL("lib/profile-cms/agent-kit-contract.json", root),
      "utf8"
    )
  );
  const schemas = jsonBytes({
    schema: "6529.cms.agent_schema_bundle.v1",
    proposal_schema: "6529.cms.agent_candidate.v1",
    package_schema: packageSchema,
    file_proposal_schema: contract.proposal_schema,
    constraints: contract.constraints,
    instructions: contract.instructions,
  });
  const files = new Map();
  for (const name of [
    "main.mjs",
    "api.mjs",
    "tools.mjs",
    "server.mjs",
    "README.md",
  ]) {
    files.set(
      name,
      Buffer.from(
        (await readFile(new URL(name, source), "utf8")).replaceAll("\r\n", "\n")
      )
    );
  }
  files.set("schemas.json", schemas);
  const manifest = jsonBytes({
    schema: "6529.cms.agent_download.v1",
    version: "1.0.0",
    mcp_protocol_versions: ["2025-11-25"],
    node_minimum_major: 22,
    files: [...files].map(([name, bytes]) => ({
      name,
      bytes: bytes.length,
      hash: sha256(bytes),
    })),
  });
  files.set("manifest.json", manifest);
  const zip = zipFiles(files);
  if (!check) await mkdir(destination, { recursive: true });
  await emit(new URL("schemas.json", source), schemas);
  await emit(new URL("6529-cms-agent.zip", destination), zip);
  await emit(
    new URL("manifest.json", destination),
    jsonBytes({
      ...JSON.parse(manifest),
      archive: {
        name: "6529-cms-agent.zip",
        bytes: zip.length,
        hash: sha256(zip),
      },
    })
  );
  await emit(new URL("README.md", destination), files.get("README.md"));
  await emit(
    new URL("cms-package-v1.schema.json", destination),
    jsonBytes(packageSchema)
  );
  await emit(
    new URL("agent-file-proposal-v1.schema.json", destination),
    jsonBytes(contract.proposal_schema)
  );
  process.stdout.write(
    `CMS agent download ${check ? "verified" : "generated"}.\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
