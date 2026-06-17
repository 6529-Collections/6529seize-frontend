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
pending implementation
```

### Vector 2: Unicode String

Input:

```json
{"title":"6529 Museum"}
```

Expected hash:

```text
pending implementation
```

### Vector 3: Minimal Profile Homepage Payload

Input:

- `fixtures/valid/minimal-profile-homepage.package.json#/payload`

Expected payload hash:

```text
pending implementation
```

Expected package hash:

```text
pending implementation
```

## Validator Requirements

Hash validator must:

- Reject non-canonical package hash after payload mutation.
- Reject uppercase hash hex.
- Reject non-`sha256:` prefixes for V1.
- Treat CDN delivery URL changes as non-canonical if outside signed package, but
  reject storage receipt mutations inside signed package.

