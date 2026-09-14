/* eslint-disable security/detect-non-literal-fs-filename -- Explicit CLI input files; outputs require a new directory, contained paths and exclusive writes. */
import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { Contract, JsonRpcProvider } from "ethers";
import { sha256 } from "js-sha256";
import {
  CmsRecoveryError,
  formatCmsRecoveryError,
} from "../../lib/profile-cms/recovery/errors";

import {
  cmsPublicationSchema,
  recoverCmsPublication,
  type CmsContractSignatureVerifier,
} from "../../lib/profile-cms/recovery/publication";
import {
  cmsRecoveryFilePath,
  independentCmsUri,
  renderRecoveredCmsSite,
} from "../../lib/profile-cms/recovery/static-site";

const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      manifest: { type: "string" },
      "manifest-file": { type: "string" },
      "manifest-hash": { type: "string" },
      "content-file": { type: "string" },
      "expected-signer": { type: "string" },
      rpc: { type: "string" },
      out: { type: "string" },
      help: { type: "boolean" },
    },
    strict: true,
    allowPositionals: false,
  });
  if (values.help) {
    process.stdout.write(
      "Usage: seize exec tsx ops/scripts/profile-cms-recover.ts (--manifest ar://ID | --manifest-file FILE) --out NEW_DIRECTORY [--content-file FILE] [--manifest-hash sha256:HASH] [--expected-signer ADDRESS] [--rpc URL]\n"
    );
    return;
  }
  if (
    !values.out ||
    Boolean(values.manifest) === Boolean(values["manifest-file"])
  ) {
    throw new CmsRecoveryError(
      "Provide --out and exactly one of --manifest or --manifest-file"
    );
  }
  const manifestBytes = values["manifest-file"]
    ? await readBoundedFile(values["manifest-file"])
    : await readDecentralized(values.manifest ?? "");
  const expectedHash = values["manifest-hash"];
  if (expectedHash && expectedHash !== `sha256:${sha256(manifestBytes)}`) {
    throw new CmsRecoveryError("Publication manifest hash mismatch");
  }
  const manifest = cmsPublicationSchema.parse(
    JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(manifestBytes))
  );
  const expectedSigner = values["expected-signer"];
  if (
    expectedSigner &&
    expectedSigner.toLowerCase() !== manifest.signer_address.toLowerCase()
  ) {
    throw new CmsRecoveryError(
      "Publication signer differs from the expected wallet"
    );
  }
  const contentBytes = values["content-file"]
    ? await readBoundedFile(values["content-file"])
    : await readDecentralized(manifest.package_uri);
  const provider = values.rpc ? new JsonRpcProvider(values.rpc) : undefined;
  try {
    const recovered = await recoverCmsPublication(
      manifest,
      contentBytes,
      provider ? contractVerifier(provider) : undefined
    );
    const files = renderRecoveredCmsSite(recovered.cmsPackage);
    const output = resolve(values.out);
    // Require a new output directory: never overwrite an existing export or follow its symlinks.
    await mkdir(output);
    await writeFile(resolve(output, "publication.json"), manifestBytes, {
      flag: "wx",
    });
    await writeFile(resolve(output, "content.json"), contentBytes, {
      flag: "wx",
    });
    await writeFile(
      resolve(output, "package.json"),
      JSON.stringify(recovered.cmsPackage, null, 2),
      { flag: "wx" }
    );
    for (const [file, html] of files) {
      const target = resolve(output, file);
      const within = relative(output, target);
      if (isAbsolute(within) || within.startsWith(".."))
        throw new CmsRecoveryError("Unsafe recovery output path");
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, html, { flag: "wx" });
    }
    process.stdout.write(
      `${JSON.stringify(
        {
          verification: recovered.verification,
          signer: recovered.signer,
          package_hash: manifest.package_hash,
          pages: files.size,
          index: resolve(
            output,
            cmsRecoveryFilePath(
              `/${recovered.cmsPackage.profile.handle}/index.html`
            )
          ),
          profile_registry_verified: false,
          current_primary_verified: false,
        },
        null,
        2
      )}\n`
    );
  } finally {
    provider?.destroy();
  }
}

async function readBoundedFile(path: string): Promise<Uint8Array> {
  // Local input paths are explicitly selected by the CLI operator, not by a
  // remote request or recovered manifest. This command promises no input root.
  // Read at most the limit plus one byte, including if the file grows while read.
  const stream = createReadStream(path, { end: MAX_DOCUMENT_BYTES }); // NOSONAR S8707: intentional operator-selected local input, not an agent filesystem sandbox.
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of stream) {
    if (!(chunk instanceof Uint8Array))
      throw new CmsRecoveryError("CMS recovery requires binary file content");
    size += chunk.length;
    if (size > MAX_DOCUMENT_BYTES)
      throw new CmsRecoveryError("CMS recovery document exceeds 8 MiB");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size);
}

async function readDecentralized(uri: string): Promise<Uint8Array> {
  if (!/^(ar|arweave|ipfs):\/\//i.test(uri)) {
    throw new CmsRecoveryError(
      "CMS recovery requires an ar:// or ipfs:// content address"
    );
  }
  const gatewayUri = independentCmsUri(uri);
  if (!gatewayUri)
    throw new CmsRecoveryError("Invalid decentralized content address");
  const url = new URL(gatewayUri);
  // Fetch exact transaction bytes without the gateway's browser sandbox redirect.
  if (url.hostname === "arweave.net") url.pathname = `/raw${url.pathname}`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
    redirect: "error",
  });
  if (response.status !== 200 || !response.body)
    throw new CmsRecoveryError(
      `CMS artifact retrieval failed (HTTP ${response.status})`
    );
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    let chunk = await reader.read();
    while (!chunk.done) {
      const { value } = chunk;
      size += value.length;
      if (size > MAX_DOCUMENT_BYTES)
        throw new CmsRecoveryError("CMS recovery document exceeds 8 MiB");
      chunks.push(value);
      chunk = await reader.read();
    }
  } finally {
    await reader.cancel();
  }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function contractVerifier(
  provider: JsonRpcProvider
): CmsContractSignatureVerifier {
  return async ({ chainId, signer, digest, signature }) => {
    const network = await provider.getNetwork();
    if (network.chainId !== BigInt(chainId))
      throw new CmsRecoveryError("RPC chain does not match publication chain");
    if ((await provider.getCode(signer)) === "0x") return false;
    const contract = new Contract(
      signer,
      [
        "function isValidSignature(bytes32 hash, bytes signature) view returns (bytes4)",
      ],
      provider
    );
    const result: unknown = await contract.getFunction("isValidSignature")(
      digest,
      signature
    );
    return result === "0x1626ba7e";
  };
}

async function run(): Promise<void> {
  try {
    await main();
  } catch (error: unknown) {
    // Do not print transport errors, which may contain credential-bearing RPC URLs.
    process.stderr.write(`${formatCmsRecoveryError(error)}\n`);
    process.exitCode = 1;
  }
}

void run();
