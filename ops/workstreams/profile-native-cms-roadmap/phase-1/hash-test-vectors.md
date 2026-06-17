# Phase 1 Hash Test Vectors

Last updated: 2026-06-17.

## Canonicalization Decision

- Canonicalization: RFC 8785 JSON Canonicalization Scheme.
- Encoding: UTF-8.
- Digest: SHA-256.
- String format: `sha256:<64-lowercase-hex>`.

## Placeholder Fixture Status

The Phase 1 fixture package hashes are placeholders. They intentionally use
valid hash string shapes so schema and route work can begin.

Before Phase 2 publish work, implementation must generate real vectors:

- Canonical payload bytes.
- Payload hash.
- Canonical package bytes for signed package fields.
- Package hash.
- Mutation examples that change hash.

## Required Vectors

### Vector 1: Minimal Object Ordering

Input:

```json
{"b":2,"a":1}
```

Canonical bytes:

```json
{"a":1,"b":2}
```

Expected hash:

```text
sha256:43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777
```

### Vector 2: Unicode String

Input:

```json
{"title":"6529 Museum"}
```

Expected hash:

```text
sha256:3c518ebe06d42949bc66db07f8ea911d1fbf5f75e06e998df4ef34bbc38f0b81
```

### Vector 3: Minimal Profile Homepage Payload

Input:

- `fixtures/valid/minimal-profile-homepage.package.json#/payload`

Expected payload hash:

```text
sha256:ad8d45da7c8810c3b3096cf0290b853a946e39cf579bfa05f7a9d20e30fa7d80
```

Expected package hash:

```text
sha256:16395e1fece98a76de58fcc4fc42569661b7a3fc88bf33272d5ee2be0c6c4f91
```

Package hash input rule for Wave 0:

- Compute and set `integrity.payload_hash` first.
- Compute package hash over the package with `integrity.package_hash`,
  `signatures`, and `storage` omitted.
- Production signatures should attest to the payload/package hash commitment
  through the EIP-712 publish flow, not to a package hash that contains their
  own signature envelope.
- Storage receipts are verification/delivery evidence and must be verified
  against their own content IDs and content hashes in the publish/storage wave.

## Validator Requirements

Hash validator must:

- Reject non-canonical package hash after payload mutation.
- Reject uppercase hash hex.
- Reject non-`sha256:` prefixes for V1.
- Treat CDN delivery URL changes as non-canonical if outside signed package, but
  reject storage receipt mutations inside signed package.
