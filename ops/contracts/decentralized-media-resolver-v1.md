# Decentralized Media Resolver Contract v1

## Ownership

Frontend owns this contract under `ops/contracts/`. Backend implements the API surface and shared parsing semantics. The resolver layer is `https://media.6529.io`.

## Goals

- Store and pass native decentralized references first.
- Resolve native references through the 6529 resolver for web rendering.
- Keep third-party DNS gateways as explicit external fallbacks for compatibility, copy/share, and debugging.
- Never treat a third-party gateway URL as canonical storage when it can be parsed back to a native reference.

## Canonical Native Forms

The canonical stored and exchanged values are:

- `ipfs://<cid>/<path?>`
- `ipns://<name>/<path?>`
- `ar://<txid>/<path?>`

The optional `path` is slash-delimited. Query strings and fragments are not canonical and must be stripped during parsing with an item-level warning.

## 6529 Resolver Forms

The 6529 web resolver forms are:

- `https://media.6529.io/ipfs/<cid>/<path?>`
- `https://media.6529.io/ipns/<name>/<path?>`
- `https://media.6529.io/arweave/<txid>/<path?>`

Implementations may allow a configurable resolver origin for local and staged environments, but production defaults to `https://media.6529.io`.

## Recognized External Fallback Gateways

Recognized external gateway URLs must be parsed back to native form when possible.

IPFS path gateways:

- `ipfs.io`
- `cf-ipfs.com`
- `cloudflare-ipfs.com`
- `gateway.pinata.cloud`
- `ipfs.6529.io`

IPFS subdomain gateways:

- `<cid>.ipfs.nftstorage.link`
- `<cid>.ipfs.dweb.link`
- `<cid>.ipfs.cf-ipfs.com`

Arweave gateways:

- `arweave.net`
- `gateway.arweave.net`
- `gateway.ar.io`
- `ar-io.net`
- `ardrive.net`

Arweave transaction subdomains:

- `<txid>.arweave.net`
- `<txid>.ar.io`

## API

`POST /api/media/resolve`

Request:

```json
{
  "inputs": [
    "ipfs://bafybeigdyrzt5sfp7udm7hu76mjts3sfb44oixwkw55rmpbc6g6wuigv3i/image.png",
    "https://ipfs.io/ipfs/bafybeigdyrzt5sfp7udm7hu76mjts3sfb44oixwkw55rmpbc6g6wuigv3i/image.png",
    "ar://OI6-rpJ2C3Ab4HiZRWt5A1SumhjnYigmSPBPX0ICBj8"
  ],
  "include_external_fallbacks": true
}
```

Response:

```json
{
  "items": [
    {
      "input": "ipfs://bafybeigdyrzt5sfp7udm7hu76mjts3sfb44oixwkw55rmpbc6g6wuigv3i/image.png",
      "recognized": true,
      "protocol": "ipfs",
      "native_uri": "ipfs://bafybeigdyrzt5sfp7udm7hu76mjts3sfb44oixwkw55rmpbc6g6wuigv3i/image.png",
      "id": "bafybeigdyrzt5sfp7udm7hu76mjts3sfb44oixwkw55rmpbc6g6wuigv3i",
      "path": "image.png",
      "resolver_url": "https://media.6529.io/ipfs/bafybeigdyrzt5sfp7udm7hu76mjts3sfb44oixwkw55rmpbc6g6wuigv3i/image.png",
      "external_fallback_urls": [
        "https://ipfs.io/ipfs/bafybeigdyrzt5sfp7udm7hu76mjts3sfb44oixwkw55rmpbc6g6wuigv3i/image.png"
      ],
      "warnings": []
    }
  ]
}
```

Unrecognized HTTP(S) URLs return `recognized=false` and preserve `input`. Invalid URLs return an item-level warning such as `invalid_url` or `unsupported_scheme`; one invalid item must not fail the whole batch.

## UX Contract

Copy/share surfaces should offer:

- Native URI copy: `ipfs://...`, `ipns://...`, or `ar://...`
- Web URL copy/open: `https://media.6529.io/...`
- External fallback copy/open only where fallback or debug UI already exists.

## v1 Non-Goals

- This API does not proxy media bytes.
- No database migration is required.
- DNS/CDN/edge provisioning for `media.6529.io` is outside this repo work.
