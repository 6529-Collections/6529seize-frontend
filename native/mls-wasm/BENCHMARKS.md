# Benchmarks (contract section 11, P35 S3 gate)

Recorded 2026-10-12 with the committed module
`public/e2ee/mls-wasm-7a2e38d7f1430794.wasm`.

## Setup

- Machine: AWS EC2 r8i.12xlarge, Intel Xeon 6975P-C (24 cores, 48 threads),
  378 GB RAM, Windows Server 2025 Datacenter (10.0.26100). Shared with other
  build and test jobs during the runs: timings moved by up to 2x between
  sessions, so read them as orders of magnitude.
- Toolchain: rustc/cargo 1.96.0, OpenMLS 0.9.1, openmls_rust_crypto 0.6.0,
  wasm-bindgen 0.2.129, Node v24.16.0 (V8). No wasm-opt.
- Ciphersuite 0x0001 (X25519, AES-128-GCM, SHA-256, Ed25519), PURE_CIPHERTEXT,
  ratchet tree inline in Welcomes.
- Scenario (`src/bin/bench.rs` and `bench/bench.mjs`, identical): for N
  leaves, the creator adds N-1 members in one commit, and separately in
  commits of at most 200; one member joins from the Welcome; 50 messages with
  a 200-byte body go creator to member; the creator removes one other member
  (the first commit with an UpdatePath after creation, so most parent nodes
  are still blank and the path is encrypted to many leaves); the member then
  self-updates. Times include this module's work around OpenMLS (exports,
  K_n signature, wrap and padding, JSON). Every value is the median of 3 runs.
- Commands:

```sh
node native/mls-wasm/bench/bench.mjs --reps 3                       # wasm
cargo run --profile bench-native --bin bench -- --reps 3            # native, opt-level 3
cargo run --release --bin bench -- --reps 3                         # native, opt-level z
```

## Module size

| File                                         |         Raw |   gzip -9 |
| -------------------------------------------- | ----------: | --------: |
| `mls-wasm-7a2e38d7f1430794.wasm`             | 1,706,483 B | 542,100 B |
| `lib/e2ee/wasm/generated/mls_wasm.js` (glue) |    51,331 B |   6,421 B |

For comparison, the same crate at opt-level `s` is 1,867,504 B (586 KB gzip)
and at opt-level 3 is 2,236,324 B (722 KB gzip). In this environment their
wasm timings were not distinguishable from opt-level `z` (V8 optimizes the
wasm itself), so the size profile stays.

## Results

### wasm (Node 24, V8), single thread

| Measure                                           |    N=2 |    N=87 |   N=174 |    N=1024 |
| ------------------------------------------------- | -----: | ------: | ------: | --------: |
| Create commit adding N-1 members (one commit), ms |   2.10 |      72 |     145 |      1931 |
| Merge that commit (creator), ms                   |   0.37 |    1.51 |    2.48 |        12 |
| Add commit, MLS bytes (unpadded)                  |    594 |  34,428 |  69,054 |   407,354 |
| Add commit, entry bytes (padded bucket)           |  2,048 | 131,072 | 131,072 |   524,288 |
| Welcome bytes (ratchet tree inline)               |  1,135 |  36,163 |  72,009 |   422,209 |
| Join from Welcome (stage + accept), ms            |   1.86 |      19 |      35 |       196 |
| Adds split into commits of 200: commits           |      1 |       1 |       1 |         6 |
| Split: create + merge all commits, ms             |   2.27 |      69 |     146 |      1560 |
| Split: largest entry bytes                        |  2,048 | 131,072 | 131,072 |   131,072 |
| Split: largest Welcome bytes                      |  1,135 |  36,163 |  72,009 |   318,333 |
| Remove 1 member: create commit, ms                |    n/a |      22 |      43 |       237 |
| Remove 1 member: entry bytes                      |    n/a |   8,192 |  32,768 |   131,072 |
| Remove 1 member: member processes + accepts, ms   |    n/a |    5.52 |    9.32 |        39 |
| Self-update: create commit, ms                    |   1.95 |      23 |      43 |       239 |
| Self-update: entry bytes                          |  2,048 |   8,192 |  32,768 |   131,072 |
| Self-update: member processes + accepts, ms       |   1.93 |    6.36 |      11 |        48 |
| Message (200-byte body): wrapped bytes            |    512 |     512 |     512 |       512 |
| Message encrypt, ms (mean of 50)                  |   0.34 |    0.30 |    0.30 |      0.36 |
| Message decrypt + verify, ms (mean of 50)         |   0.47 |    0.42 |    0.43 |      0.49 |
| Creator exportState() bytes                       | 18,222 | 272,029 | 527,439 | 2,978,150 |

### native, opt-level 3 (`--profile bench-native`), rayon threads

| Measure                                           |    N=2 |    N=87 |   N=174 |    N=1024 |
| ------------------------------------------------- | -----: | ------: | ------: | --------: |
| Create commit adding N-1 members (one commit), ms |   0.76 |      24 |      54 |       749 |
| Merge that commit (creator), ms                   |   0.13 |    1.10 |    1.66 |        12 |
| Add commit, MLS bytes (unpadded)                  |    594 |  34,428 |  69,054 |   407,354 |
| Add commit, entry bytes (padded bucket)           |  2,048 | 131,072 | 131,072 |   524,288 |
| Welcome bytes (ratchet tree inline)               |  1,135 |  36,163 |  72,009 |   422,209 |
| Join from Welcome (stage + accept), ms            |   0.79 |    8.10 |      14 |        90 |
| Adds split into commits of 200: commits           |      1 |       1 |       1 |         6 |
| Split: create + merge all commits, ms             |   0.71 |      27 |      55 |       608 |
| Split: largest entry bytes                        |  2,048 | 131,072 | 131,072 |   131,072 |
| Split: largest Welcome bytes                      |  1,135 |  36,163 |  72,009 |   318,333 |
| Remove 1 member: create commit, ms                |    n/a |    3.09 |    4.92 |        16 |
| Remove 1 member: entry bytes                      |    n/a |   8,192 |  32,768 |   131,072 |
| Remove 1 member: member processes + accepts, ms   |    n/a |    2.20 |    3.66 |        17 |
| Self-update: create commit, ms                    |   0.52 |    2.93 |    5.17 |        19 |
| Self-update: entry bytes                          |  2,048 |   8,192 |  32,768 |   131,072 |
| Self-update: member processes + accepts, ms       |   0.81 |    2.70 |    4.93 |        21 |
| Message (200-byte body): wrapped bytes            |    512 |     512 |     512 |       512 |
| Message encrypt, ms (mean of 50)                  |   0.11 |    0.11 |    0.10 |      0.12 |
| Message decrypt + verify, ms (mean of 50)         |   0.13 |    0.14 |    0.14 |      0.15 |
| Creator exportState() bytes                       | 18,172 | 271,490 | 526,918 | 2,977,462 |

### native, release profile (opt-level z, `--release`), rayon threads

| Measure                                           |    N=2 |    N=87 |   N=174 |    N=1024 |
| ------------------------------------------------- | -----: | ------: | ------: | --------: |
| Create commit adding N-1 members (one commit), ms |   6.08 |     616 |    1503 |      7940 |
| Merge that commit (creator), ms                   |   0.17 |    1.61 |    2.77 |        24 |
| Add commit, MLS bytes (unpadded)                  |    594 |  34,428 |  69,054 |   407,354 |
| Add commit, entry bytes (padded bucket)           |  2,048 | 131,072 | 131,072 |   524,288 |
| Welcome bytes (ratchet tree inline)               |  1,135 |  36,163 |  72,009 |   422,209 |
| Join from Welcome (stage + accept), ms            |   9.01 |     284 |     651 |      3255 |
| Adds split into commits of 200: commits           |      1 |       1 |       1 |         6 |
| Split: create + merge all commits, ms             |   6.15 |     835 |    1738 |      7055 |
| Split: largest entry bytes                        |  2,048 | 131,072 | 131,072 |   131,072 |
| Split: largest Welcome bytes                      |  1,135 |  36,163 |  72,009 |   318,333 |
| Remove 1 member: create commit, ms                |    n/a |    4.96 |      27 |        29 |
| Remove 1 member: entry bytes                      |    n/a |   8,192 |  32,768 |   131,072 |
| Remove 1 member: member processes + accepts, ms   |    n/a |      12 |      30 |        43 |
| Self-update: create commit, ms                    |   0.93 |      11 |    8.35 |        33 |
| Self-update: entry bytes                          |  2,048 |   8,192 |  32,768 |   131,072 |
| Self-update: member processes + accepts, ms       |   8.70 |      13 |      16 |        69 |
| Message (200-byte body): wrapped bytes            |    512 |     512 |     512 |       512 |
| Message encrypt, ms (mean of 50)                  |   0.22 |    0.24 |    0.41 |      0.30 |
| Message decrypt + verify, ms (mean of 50)         |   6.59 |    5.48 |    7.67 |      5.80 |
| Creator exportState() bytes                       | 18,130 | 271,467 | 526,918 | 2,977,714 |

## Observations

- Browser-relevant numbers are the wasm ones (one thread; OpenMLS's rayon
  parallelism only helps native builds). A 1,024-leaf group costs about
  0.2 to 0.5 s per path commit to create, about 50 ms to process, and about
  0.2 to 0.3 s for a joiner. Messages stay below 1 ms either way.
- One commit adding 1,023 members needs the 512 KiB entry bucket and takes
  1.9 to 3.3 s in wasm. Splitting into commits of at most 200 (contract 3.3)
  keeps every entry at 128 KiB or less, but costs about as much in total.
- Welcomes grow with the inline tree (422 KB at 1,024 leaves), well inside the
  3.5 MiB welcome limit.
- The native `--release` profile (opt-level `z`) is 5 to 40 times slower than
  opt-level 3 on x86 (curve25519 and HPKE arithmetic suffers most, for example
  decrypt at 5.8 ms vs 0.15 ms). The size profile is only meant for the wasm.
  A native client should build with `--profile bench-native` or plain opt-level 3.
- `exportState()` grows linearly with the tree (about 2.9 KB per leaf for the
  creator). That is the IndexedDB blob size per group the engine stores (8.7).
