# mls-wasm

OpenMLS (RFC 9420) device for 6529 end-to-end encrypted DMs and groups
(decision D109), compiled to WebAssembly for the web app. The normative
interface is the shared E2EE contract, sections 1, 3, 10 and 11.

- `src/codec.rs`: `H()`/`TAG()`, entry/message/revoke/roster digests,
  bucketed AES-256-GCM wrap, inner message envelope.
- `src/device.rs`: the device (Ed25519 signature key, BasicCredential, all
  groups). Target independent; native tests and the native benchmark use it.
- `src/wasm.rs`: wasm-bindgen surface (`MlsDevice` and helpers).
- `tests/`: end-to-end flows through a simulated delivery service.
- `src/bin/bench.rs`, `bench/bench.mjs`: section 11 benchmark, native and wasm.
- `BENCHMARKS.md`: last recorded results.

All cryptography comes from libraries: OpenMLS 0.9.1 with
`openmls_rust_crypto` 0.6.0 for MLS, `ed25519-dalek` (K_n and inner message
signatures), `aes-gcm` (wraps) and `sha3` (keccak256).

The only ciphersuite is 0x004F,
`MLS_128_MLKEM768X25519_AES128GCM_SHA256_Ed25519` (`device::CIPHERSUITE`):
X-Wing hybrid post-quantum key exchange (ML-KEM-768 with X25519) through the
OpenMLS cargo feature `draft-ietf-mls-pq-ciphersuites`, AES-128-GCM, SHA-256
and Ed25519 signatures. It must equal `E2EE_CIPHERSUITE` in
`lib/e2ee/grant.ts` (the grant signs it) and the backend's pinned value.
0x004F is a draft code point: if it changes, every device re-enrolls and every
group is re-created; the engine drops a stored device whose grant names
another suite.

## Build

Prerequisites, all pinned:

- Rust 1.96.0 with the `wasm32-unknown-unknown` target. `rust-toolchain.toml`
  selects both, so `rustup` installs them on first use.
- `wasm-bindgen-cli` matching the `wasm-bindgen` version in `Cargo.lock`
  (currently 0.2.129):
  `cargo install wasm-bindgen-cli --version 0.2.129 --locked`.

From the repository root:

```sh
6529 run build:mls-wasm            # or: ./bin/6529 run build:mls-wasm
```

`scripts/build-mls-wasm.cjs` then:

1. runs `cargo build --release --lib --locked --target wasm32-unknown-unknown`
   with `--remap-path-prefix` for the home, cargo, rustup, repository and crate
   directories, so no local path is embedded;
2. runs `wasm-bindgen --target web` into `lib/e2ee/wasm/generated/` and
   replaces both the glue's default `new URL(..., import.meta.url)` and its
   fetch of a URL or Request with an error (the loader always passes
   verified bytes, and bundlers must not ship a second copy);
3. writes the binary to `public/e2ee/mls-wasm-<first 16 hex of sha256>.wasm`,
   deletes older hashed files, and writes `lib/e2ee/wasm/manifest.ts`
   (`file`, `sha256`, `bytes`);
4. fails if the binary or glue contains a local path fragment (`Users\`,
   `C:\`, `/home/`, the home directory or user name).

`--wasm-opt` additionally runs binaryen's `wasm-opt -Oz` if it is on `PATH`
(not used for the committed build).

The hash depends on the toolchain, the dependency lock and the host path
separator (remapped registry paths keep `\` on Windows), so rebuild on the
same kind of host to reproduce a committed binary byte for byte.

## Tests

```sh
cd native/mls-wasm
cargo test                    # unit + end-to-end flows (native)
cargo clippy --all-targets    # lint
```

Jest loads the built `.wasm` in Node (from the repository root):

```sh
./bin/6529 run test --testPathPatterns=__tests__/lib/e2ee/wasm
```

## Benchmarks

```sh
cd native/mls-wasm
cargo run --release --bin bench -- [sizes...] [--reps N]           # release (opt-level z)
cargo run --profile bench-native --bin bench -- [sizes...] [--reps N]  # opt-level 3
node bench/bench.mjs [sizes...] [--reps N]                       # the committed wasm
```

## Behaviour notes for the engine

- Every method returns a JSON string in the shapes of contract section 10, or
  throws `Error("E2EE_WASM:<CODE>: <message>")`. Codes: `BAD_INPUT`,
  `NO_GROUP`, `GROUP_EXISTS`, `PENDING_EXISTS`, `NO_PENDING`, `STAGED_EXISTS`,
  `NO_STAGED`, `NO_STAGED_WELCOME`, `BAD_ENTRY`, `BAD_SIGNATURE`,
  `WRONG_EPOCH`, `DECRYPT_FAILED`, `BAD_MESSAGE`, `OWN_MESSAGE`, `TOO_LARGE`,
  `NOT_MEMBER`, `BAD_WELCOME`, `NO_KEY_PACKAGE`, `BAD_KEY_PACKAGE`,
  `BAD_METADATA`, `NO_CREDENTIAL`, `PENDING_PROPOSALS`, `MLS_ERROR`,
  `BAD_STATE`, `INTERNAL`.
- `exportState()` holds the signer, credential, the full OpenMLS storage, the
  pending own commit, a staged incoming commit, retained message keys of the
  last two epochs and this module's bookkeeping. Staged Welcomes are not
  exported: call `joinWelcome` again after a reload (the KeyPackage is only
  consumed by `acceptWelcome`).
- Decrypting consumes ratchet secrets. Persist state after decrypting and
  keep the plaintext; a second `decryptMessage` of the same item fails with
  `DECRYPT_FAILED`. Own messages throw `OWN_MESSAGE` (MLS cannot decrypt
  them); keep sent plaintext in the outbox.
- Own proposals stay out of the local proposal store until `processEntry`
  sees them in the log, so a proposal the server never sequenced cannot end
  up in a later commit.
- `processEntry` stores only Remove proposals; `dropProposals(g, deviceKey)`
  (an addition to contract 10) removes pending Remove proposals the engine's
  policy rejects (8.1.2). `encryptMessage` throws `PENDING_PROPOSALS` while
  any proposal is pending (commit-before-send, 8.3).
- Joining skips the lifetime check of leaves already in the tree (members who
  never updated keep their KeyPackage lifetime); KeyPackages being added are
  still checked.
