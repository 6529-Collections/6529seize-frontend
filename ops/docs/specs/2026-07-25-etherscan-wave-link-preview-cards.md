# Etherscan Wave Link Preview Cards

**Status:** Proposed

**Created:** 2026-07-25

**Owners:** Frontend / Waves

**Target:** 6529 Seize frontend

**Decision type:** Product, UX, frontend, server route, data, security

## Summary

Waves should render Etherscan links as first-class, read-only Ethereum cards.
The card should answer, in order:

1. What is this?
2. What happened, or what is its current state?
3. Who and what are involved?
4. What provenance, uncertainty, or risk caveat matters?
5. Where can the user inspect the source?

The implementation must recognize the current public `etherscan.io` URL
surface, normalize it into a small set of semantic card kinds, and degrade
safely for new or unknown Etherscan routes. Entity URLs receive structured
onchain data. Collection, analytics, and tool URLs receive compact,
route-aware page cards rather than an expensive or misleading reproduction of
an Etherscan table.

This also corrects an existing routing error: every valid
`etherscan.io/tx/{hash}` currently reaches the Compound preview resolver and is
returned as `compound.tx`, even when the transaction has no Compound action.
The UI then labels it **Compound Transaction**. Etherscan becomes the owner of
generic Etherscan transaction and address URLs. Compound remains an optional
protocol enrichment for transactions that actually contain recognized
Compound activity.

## Decision

- Add one Etherscan provider with a strict URL parser and a discriminated
  `etherscan.*` response model.
- Support Etherscan Ethereum mainnet, Sepolia, and Hoodi as current networks.
- Recognize retired Etherscan testnet hosts, but label them as legacy and never
  query them against mainnet.
- Treat every current Etherscan route as one of:
  - a structured entity card;
  - an entity card with route context;
  - a compact filtered-list or analytics card;
  - a compact tool or service card;
  - a safe generic Etherscan page card.
- Fetch blockchain data from network RPC and documented APIs. Do not scrape
  Etherscan HTML.
- Keep the card read-only. Do not connect wallets, submit transactions, verify
  contracts, revoke approvals, execute tools, or render arbitrary signed
  content as active HTML.
- Prefer useful, attributable facts over completeness. Optional commercial API
  enrichments must never be required for the baseline card.
- Reuse the Wave link-preview batch endpoint and card frame, with
  entity-aware server and client cache keys and state-aware TTLs.
- Ship behind a provider-level rollout switch, observe fallback and latency
  rates, then make the provider default-on.

## Why this is needed

Etherscan is intentionally exhaustive. A Wave card has a different job: help a
reader understand a shared link without leaving the conversation.

The existing behavior has three material problems:

1. `components/drops/view/part/dropPartMarkdown/handlers/compound.tsx` claims
   every Etherscan transaction and address path.
2. `app/api/open-graph/compound/service.ts` accepts any syntactically valid
   Etherscan transaction hash and returns `type: "compound.tx"`.
3. `components/waves/compound/CompoundCard.tsx` labels that response
   **Compound Transaction**, including transactions with no decoded Compound
   action.

The ENS handler runs before Compound and also claims
`etherscan.io/address/{address-or-ENS}`. This means the same Etherscan URL
surface is split between ENS and Compound based on handler order rather than
the user's intent or the resource type.

## Goals

- Cover the current public Etherscan URL taxonomy with deterministic matching.
- Make transaction, address, contract, token, NFT, block, uncle, blob, and
  verified-signature links immediately understandable.
- Preserve useful context from tabs, filters, and deep tool links without
  creating a component for every path.
- Make source, network, time, status, and confidence clear.
- Remain useful when RPC, Etherscan API, token metadata, price, or media
  enrichment is unavailable.
- Meet WCAG 2.2 AA and the repository's localization and UI standards.
- Specify every implementation area: parsing, data, API response, UI,
  security, caching, observability, docs, tests, migration, and rollout.

## Non-goals

- Rebuilding Etherscan tables, charts, contract IDEs, decoders, or write tools
  inside Waves.
- Wallet connection or any signing/onchain action from the card.
- Declaring a contract, token, address, signature, or transaction safe.
- Treating verified source code as an audit or safety guarantee.
- Showing private Etherscan account data, private name tags, watchlists, API
  keys, saved filters, or authenticated Etherscan state.
- Supporting every Etherscan-family explorer domain in the first release.
  BaseScan, Arbiscan, PolygonScan, BscScan, and other Etherscan-family products
  should later reuse the parser and view model through a chain adapter. They
  must not be silently treated as Ethereum.
- Persisting or indexing Etherscan comments.
- Rendering an unbounded list of transfers, logs, token holdings, contract
  source, calldata, bytecode, blob data, or signed-message content.

## Research scope and method

This inventory is a route-family snapshot taken on 2026-07-25. It was built
from:

- the live [Etherscan navigation and tools surface](https://etherscan.io/);
- current entity pages and the links they expose;
- the [Etherscan Information Center](https://info.etherscan.com/);
- the [Etherscan API V2 documentation](https://docs.etherscan.io/introduction);
- the current [supported chains](https://docs.etherscan.io/supported-chains);
- the current [Etherscan status page](https://status.etherscan.io/).

“Every URL format” means every public route family discoverable from those
surfaces, not every possible ordering of query parameters, label slug, chart
slug, block number, hash, token ID, or future route. The parser is deliberately
forward-compatible: an unknown valid Etherscan HTTPS route still gets a safe
generic Etherscan page card and telemetry, never a blank result.

The source material confirms the primary information users seek:

- A block explorer centers transactions, addresses, contracts, blocks, gas,
  and token/NFT transfers
  ([What is a Block Explorer?](https://info.etherscan.com/what-is-a-block-explorer)).
- Address pages expose identity, balance, activity, assets, analytics, contract
  code, and EIP-7702-related activity
  ([What is an Ethereum Address?](https://info.etherscan.com/what-is-an-ethereum-address/),
  [Explore an EOA Address](https://info.etherscan.com/explore-eoa-address/),
  [Explore a Contract Address](https://info.etherscan.com/explore-contract-address/)).
- Transaction states include pending, successful, failed/reverted, dropped,
  and replaced
  ([Viewing Transactions on Etherscan](https://info.etherscan.com/viewing-transactions-on-etherscan/)).
- Token pages expose standard, supply, holders, transfers, contract, and
  optional market data
  ([Understanding the Token Page](https://info.etherscan.com/understanding-token-page/)).
- NFT pages expose collection/item identity, ownership, metadata, transfers,
  and optional trade data
  ([Exploring the NFT Page](https://info.etherscan.com/exploring-the-nft-page/)).
- Block details include height, time, proposer/fee recipient, transactions,
  gas, rewards, withdrawals, and blob data
  ([Exploring Block Details](https://info.etherscan.com/exploring-block-details-page/)).
- Labels and public name tags are Etherscan annotations rather than raw
  onchain truth
  ([Public Name Tags and Labels](https://info.etherscan.com/public-name-tags-labels/)).
- Advanced Filter can combine transaction type, method, time, addresses,
  amount, asset, and event filters
  ([Advanced Filter](https://info.etherscan.com/advanced-filter/)).

## Host and network policy

### Supported current hosts

| Host | Network | Chain ID | Behavior |
| --- | --- | ---: | --- |
| `etherscan.io` | Ethereum mainnet | 1 | Full structured preview |
| `www.etherscan.io` | Ethereum mainnet | 1 | Normalize to `etherscan.io` for identity/cache; preserve original link for opening |
| `sepolia.etherscan.io` | Sepolia | 11155111 | Full structured preview when the configured RPC supports it |
| `hoodi.etherscan.io` | Hoodi | 560048 | Full structured preview when the configured RPC supports it |

Only `https:` URLs and the default HTTPS port are eligible. Host matching must
be exact after lowercasing and removing one terminal dot. A hostname merely
ending in the string `etherscan.io`, such as
`etherscan.io.attacker.example`, must not match.

Implement this as an exact lookup in the normalized host registry. Do not use
the existing suffix-capable `matchesDomainOrSubdomain()` helper for Etherscan
ownership: `foo.etherscan.io` is not an approved host and must follow the
ordinary external-link path.

### Legacy hosts

Recognize these retired networks as distinct registry entries:

| Host | Network key | Chain ID |
| --- | --- | ---: |
| `ropsten.etherscan.io` | `ropsten` | 3 |
| `rinkeby.etherscan.io` | `rinkeby` | 4 |
| `goerli.etherscan.io` | `goerli` | 5 |
| `kovan.etherscan.io` | `kovan` | 42 |
| `holesky.etherscan.io` | `holesky` | 17000 |

Render a compact legacy-network card with the original route context and open
action. If an archival provider is explicitly configured later, structured
data may be added. Until then:

- do not relabel the resource as mainnet;
- do not fetch the entity using chain ID 1;
- do not show zero balances or “not found” as if they were authoritative;
- announce “Legacy network — live data unavailable.”

Unknown subdomains do not receive structured data. They fall back to the
ordinary external-link path after the standard public URL guard.

## URL taxonomy and card mapping

Path matching is case-sensitive where the Etherscan route is case-sensitive,
while hexadecimal addresses and hashes are normalized for identity. A trailing
slash is ignored for matching. Unknown and tracking query keys do not alter
entity identity.

### Entity and entity-context routes

| URL family | Example shape | Card decision |
| --- | --- | --- |
| `/tx/{txHash}` | 32-byte transaction hash | `transaction` |
| `/tx/{txHash}#blobs` | Transaction blob tab | `transaction`, context `blobs` |
| `/getRawTx?tx={txHash}` | Raw transaction tool | `transaction`, context `raw transaction` |
| `/vmtrace?txhash={txHash}` | VM trace | `transaction`, context `execution trace` |
| `/inputdatadecoder?tx={txHash}` | Input decoder | `transaction`, context `input decoder` |
| `/tx-decoder?tx={txHash}` | Transaction decoder | `transaction`, context `transaction decoder` |
| `/address/{address}` | 20-byte address | `address`; server classifies EOA, contract, or delegated EOA |
| `/address/{ENS-name}` | ENS name in address route | Existing ENS identity enrichment plus `address` data on the route's network |
| `/address/{address}/advanced` | Advanced address view | `address`, context `advanced view` |
| `/address/{address}#{tab}` | Activity/code/assets/analytics tab | `address`, allowlisted tab context |
| `/tokenholdings?a={address}` | Portfolio detail | `address`, context `token holdings` |
| `/balancecheck-tool?a={address}` | Balance checker | `address`, context `balance check` |
| `/tokenapprovalchecker?search={address}` | Approval checker | `address`, context `token approvals`; no revoke control |
| `/name-lookup-search?id={name}` | ENS lookup result | Existing ENS card with Etherscan/network context |
| `/token/{contract}` | Token contract | `token`; server classifies ERC-20, ERC-721, ERC-1155, or unknown |
| `/token/{contract}?a={subject}` | Token holder, NFT holder, or legacy token-item context | `token` plus validated subject context; promote to `nft-item` only when token standard and token ID are unambiguous |
| `/tokencheck-tool?t={contract}` | Token reputation tool | `token`, context `token check`; do not convert reputation into a safety verdict |
| `/tokentracker?contractAddress={contract}` or address-equivalent key | Token tracker tool | `token`, context `token tracker` |
| `/nft/{contract}/{tokenId}` | NFT item | `nft-item` |
| `/block/{height}` | Decimal block height | `block` |
| `/block/{blockHash}` | 32-byte block hash | `block` |
| `/block/countdown/{height}` | Future block countdown | `block`, context `countdown`; estimated time is explicitly an estimate |
| `/uncle/{blockHash}` | Historical uncle hash | `uncle` |
| `/blob/{versionedHash}` | EIP-4844 blob | `blob` |
| `/blob/{versionedHash}?bid={index}` | Blob plus index | `blob` with validated non-negative index |
| `/verifySig/{numericId}` | Etherscan verified-signature record | `verified-signature` |
| `/contractdiffchecker?a1={contract}[&a2={contract}]` | Contract comparison | `tool` with one or two contract subjects; no automatic equivalence claim |
| `/find-similar-contracts?a={contract}` | Similar-contract search | `tool` with contract subject; “similar” is not “same” or “safe” |
| `/search?q={query}` | Site search | Promote an exact valid address, transaction hash, block height/hash, or ENS name to its entity card on the URL host's network; otherwise `page` without echoing the free-form query |

The query-key aliases accepted by the parser must be enumerated in tests from
observed current URLs. Do not accept arbitrary query values as entity
identifiers. Addresses use `viem` validation/checksumming; hashes require
exact byte length; numeric IDs are bounded decimal strings before conversion.

### Transaction collection routes

| Route family | Human title | Context retained |
| --- | --- | --- |
| `/txs` | Transactions | Address, block, blob-only, and supported direction/filter scope |
| `/txsPending` | Pending transactions | Address and method scope |
| `/txsInternal` | Contract internal transactions | Address or block scope |
| `/txCrossChain` | Cross-chain transactions | Recognized network/direction filters |
| `/txsBeaconDeposit` | Beacon deposits | Address/block filters |
| `/txsBeaconWithdrawal` | Beacon withdrawals | Address/block filters |
| `/txsBlobs` | Blob transactions | Block/address filters |
| `/txsAA` | Account-abstraction transactions | Recognized sender/paymaster/bundler filters |
| `/txsAABundle` | Account-abstraction bundles | Recognized bundler/block filters |
| `/txnAuthList` | EIP-7702 authorizations | Recognized address/block filters |
| `/advanced-filter` | Advanced transaction filter | Safe summary of allowlisted filter types, never a raw query dump |
| `/txs/label/{slug}` | Transactions with Etherscan label | Decoded, length-bounded label slug |

These routes use `filtered-list`. The card explains the scope in plain
language, for example, “Pending Ethereum transactions sent by
`0x1234…7890`.” It does not fetch or render the rows. If a valid address,
block, token, or method is present, render at most three non-interactive filter
chips and an accessible text equivalent. Unknown filters become
“Additional filters on Etherscan,” not raw text.

### Block, account, contract, token, and NFT collection routes

| Route family | Card title |
| --- | --- |
| `/blocks` | Ethereum blocks |
| `/blocks_forked` | Forked blocks / reorgs |
| `/uncles` | Historical uncle blocks |
| `/accounts` | Top Ethereum accounts |
| `/accounts/label/{slug}` | Accounts with Etherscan label |
| `/blocks/label/{slug}` | Blocks with Etherscan label |
| `/contractsVerified` | Verified contract source |
| `/tokens` | Top ERC-20 tokens |
| `/tokens/label/{slug}` | Tokens with Etherscan label |
| `/tokentxns` | ERC-20 token transfers |
| `/nft-top-contracts` | Top NFT collections |
| `/nft-top-mints` | Top NFT mints |
| `/nft-trades` | Latest NFT trades |
| `/nft-transfers` | Latest NFT transfers |
| `/nft-latest-mints` | Latest NFT mints |

These routes use `filtered-list`. Labels must display as “Etherscan label:
{label}” so an Etherscan annotation is not mistaken for an onchain property.

### Analytics, resource, and directory routes

| Route family | Card decision |
| --- | --- |
| `/charts` | `analytics`, “Ethereum charts and statistics” |
| `/chart/{chartSlug}` | `analytics`, allowlisted/localized chart title or safely title-cased bounded slug |
| `/stat/supply` | `analytics`, “Ethereum supply” |
| `/leaderboard` and descendants | `page`, “Etherscan leaderboard” with route context |
| `/directory` | `page`, “Ethereum ecosystem directory” |
| `/directory/{category}[/{subcategory}]` | `page` with safely decoded category context |
| `/labelcloud` | `page`, “Etherscan label cloud” |
| `/gastracker` | `analytics`, “Ethereum gas tracker” |
| `/dex` and descendants | `analytics`, “Ethereum DEX tracker” |
| `/nodetracker` and descendants | `analytics`, “Ethereum node tracker” |

The initial release does not make extra calls for list/chart cards. A later
iteration may show one small live statistic, such as current gas tiers, only if
it has a documented source, an `asOf` timestamp, a strict timeout, and a
fallback that leaves the card useful.

### Developer tools

| Route | Product-aware title |
| --- | --- |
| `/inputdataencoder` | Input data encoder |
| `/inputdatadecoder` | Input data decoder |
| `/tx-decoder` | Transaction decoder |
| `/code-reader` | Code Reader |
| `/verifyContract` | Verify contract source |
| `/find-similar-contracts` | Similar contract search |
| `/searchcontract` | Smart contract source search |
| `/contractdiffchecker` | Contract diff checker |
| `/bytecode-decompiler` | Bytecode decompiler |
| `/proxyContractChecker` | Proxy contract checker |
| `/contract-license-types` | Contract license reference |
| `/solcbuginfo` | Solidity compiler bug reference |
| `/vyper` | Vyper contract verification |
| `/opcode-tool` | Opcode converter |
| `/pushTx` | Broadcast signed transaction |
| `/getRawTx` | Raw transaction viewer |
| `/vmtrace` | Transaction execution trace |
| `/viewsvg` | SVG source viewer |
| `/api` and `/api/{subpage}` | Etherscan API product or documentation page |

These use `tool`, except a valid entity deep link maps to the corresponding
entity card as described above. The card describes the tool and opens
Etherscan. It never copies Etherscan's form values into active controls and
never offers to submit or broadcast data.

### General tools and services

| Route | Product-aware title |
| --- | --- |
| `/exportData` | CSV export |
| `/balancecheck-tool` | Account balance checker |
| `/unitconverter` | Ethereum unit converter |
| `/base64converter` | Base64 converter |
| `/blockdateconverter` | Block/date converter |
| `/utf8converter` | UTF-8 converter |
| `/methodidconverter` | Method ID converter |
| `/tokenapprovalchecker` | Token approval checker |
| `/tokencheck-tool` | Token reputation checker |
| `/tokentracker` | Token tracker |
| `/verifiedSignatures` | Verified signatures |
| `/idm` | Input Data Messages |
| `/name-lookup` | Ethereum name lookup |

`/exportData` may retain a recognized address, token contract, and export type
as context. Unrecognized or free-form values are omitted. Approval and
signature services carry a plain-language safety note: the card is an
informational link and does not request a wallet connection or signature.

### Account, settings, company, and support pages

The public site navigation also exposes routes that are not blockchain
resources:

| Route family | Card decision |
| --- | --- |
| `/login`, `/myaddress`, `/mynotes_address`, `/mynotes_tx` | `page`, account/private-feature explanation; never attempt to retrieve signed-in state or private notes |
| `/settings` | `page`, “Etherscan site settings”; 6529 does not import or apply them |
| `/premium-account`, `/priority-support` | `page`, Etherscan account/service |
| `/aboutus`, `/careers`, `/contactus`, `/contactusadvertise` | `page`, bounded local title |
| `/brandassets`, `/explorer-as-a-service-eaas` | `page`, bounded local title |
| `/terms`, `/privacyPolicy`, `/bugbounty` | `page`, legal/security title |
| `/chartsync` and other observed internal utility routes | safe generic `page`; no execution or parameter echo |

Static paths such as `/assets/*`, `/images/*`, and challenge/runtime paths such
as `/cdn-cgi/*` are not Etherscan product cards. If directly shared, they use
the existing guarded external-file/generic preview behavior. The Etherscan
handler must explicitly pass those prefixes through rather than claiming them.

### Fragments, query strings, and tabs

Fragments do not create separate server cache identities. Recognized fragments
add a localized context label:

- transaction: `blobs`, `eventlog`, `statechange`;
- address/contract: `internaltx`, `tokentxns`, `nfttransfers`, `code`,
  `readContract`, `writeContract`, `events`, `analytics`, `assets`, `cards`,
  `comments`;
- token/NFT: `balances`, `transfers`, `inventory`, `analytics`, `comments`,
  `contract`.

Unknown fragments are ignored by the card and preserved only in the original
open URL. Tracking and presentation parameters such as pagination, sorting,
theme, age display, UTM keys, and table column state do not affect entity
identity. List-card context uses an explicit query-key allowlist per route.

The parser must cap:

- URL length before parsing;
- path-segment count and decoded segment length;
- query-key count;
- query-key and value length;
- displayed filter count;
- all numeric conversions.

Malformed percent escapes, duplicated identity keys with conflicting values,
embedded credentials, non-default ports, control characters, and unsupported
schemes make the URL ineligible for the specialized provider.

## Card system

### Shared anatomy

All card kinds use the same visual grammar:

1. **Provider row:** Etherscan mark/name, network badge, and resource kind.
2. **Semantic headline:** a plain-language answer, not a raw page title.
3. **Primary facts:** no more than four immediately visible facts.
4. **Context/risk row:** status, data source, staleness, or one important
   caveat.
5. **Actions:** Open on Etherscan and contextual copy action(s).

The card must fit the existing Wave chat frame without causing layout shift.
The home variant may use more vertical space. In chat, lower-priority details
are omitted rather than clipped into unreadable density.

The default card is not a dashboard. It should favor one sentence and a few
facts over a miniature table.

### Visual states

Status is represented with icon, label, and color:

- success/finalized: check icon + “Successful” or “Finalized”;
- pending: clock icon + “Pending”;
- reverted/failed: warning icon + “Reverted”;
- dropped/replaced: route icon + “Dropped” or “Replaced”;
- stale/partial: information icon + explicit text;
- legacy network: archive icon + explicit text.

Color is never the only signal. The palette uses repository `iron-*` and
`primary-*` tokens plus established semantic status tokens. New hardcoded
colors require a design-system reason.

### Interaction model

- Keep `LinkPreviewCardLayout` and `ChatItemHrefButtons` as the shared open/copy
  mechanism where possible.
- Do not nest a link or button inside a full-card anchor.
- If entity-specific copy actions are added inside the card, the layout must
  remain a non-anchor container with explicit overlay actions.
- Actions:
  - always: Open on Etherscan;
  - transaction/block/blob/uncle: Copy hash;
  - address/contract/token: Copy address;
  - NFT: Copy collection address and token ID through one labeled menu;
  - verified signature: Copy signer or signature record link, never silently
    copy the signed message.
- Every icon-only action has an accessible name and a tooltip that is
  perceivable and dismissible with keyboard, pointer, and touch; the accessible
  name does not depend on the tooltip.
- Opening an external URL uses `noopener noreferrer`.

## Entity card specifications

### Transaction

#### Headline priority

Use the first trustworthy interpretation:

1. recognized native/token/NFT action;
2. recognized protocol adapter action;
3. verified ABI method;
4. 4-byte selector name with confidence attribution;
5. “Contract interaction”;
6. “Ethereum transaction.”

Standard actions include:

- native transfer;
- ERC-20 transfer and approval;
- ERC-721/ERC-1155 transfer, mint, and burn;
- contract creation;
- EIP-7702 authorization;
- EIP-4337/account-abstraction summary when evidenced by logs/receipt;
- blob-carrying transaction.

Never infer a swap, purchase, sale, bridge, mint, or protocol action solely
from an unverified method name. A protocol adapter, including Compound, must
return both a recognized action and evidence before its label appears.

#### Visible content

- semantic headline, such as “2.4 ETH sent to vitalik.eth”;
- status;
- from and to/created contract, enriched with 6529 profile and ENS when
  available;
- value or primary token amount;
- timestamp;
- block and confirmations/finality;
- transaction fee;
- one context badge when opened through trace/raw/decoder/blob route.

Additional data may be present in the response for expanded/home layouts but
must not overload chat: gas used/limit, effective gas price, nonce, transaction
type, blob count, method selector, and sanitized revert reason.

#### States

- `pending`: no receipt yet; poll while visible with backoff;
- `success`: receipt status success;
- `reverted`: receipt status failure; show a sanitized, bounded reason only
  when the source is trustworthy;
- `replaced`: show replacement transaction link when deterministically known;
- `dropped`: only after provider evidence, never from a single timeout;
- `unknown`: partial card with retry.

Pending is not failure. “Confirmed” and “finalized” are separate concepts.
The response should expose confirmations and finality independently.

### Address

The card subtype is determined from chain data:

- `eoa`: no runtime code;
- `contract`: runtime code exists;
- `delegated-eoa`: EIP-7702 delegation designator is present;
- `unknown`: data unavailable.

Visible content:

- best identity in order: 6529 profile, forward-and-reverse-verified ENS,
  checksummed address;
- explicit subtype and network;
- current native balance with block/as-of context;
- for contract: verified contract name, proxy/implementation relationship, and
  token standard where known;
- for delegated EOA: delegation target with a concise explanation;
- at most one attributable label/reputation annotation;
- route context such as assets, analytics, approvals, or code.

Do not render a full portfolio in chat. Token holdings may be a count or
top-three summary only when the data source and freshness are available without
making a paid API dependency mandatory.

For contracts, say “Source code verified” rather than “Verified contract,” and
show the note “Source verification is not a security review” where space
permits or in the accessible description.

### Token

Subtype: `erc20`, `erc721`, `erc1155`, or `unknown`.

Visible content:

- token name and symbol, sanitized and length-bounded;
- standard and contract address;
- total supply for fungible tokens, formatted using verified decimals;
- holder/subject balance only when a validated `a` context and trustworthy
  decimals/ownership query are available;
- source-verification state;
- optional price and market-cap data only with source and `asOf`;
- attributable Etherscan reputation note, if available.

Non-standard token behavior can make names, decimals, supply, and transfer
events misleading. A failed or inconsistent metadata call produces
`unknown`/partial fields rather than fabricated zeroes. The card must not use a
token logo as the sole identity signal.

### NFT item

Visible content:

- safe media thumbnail or media-type placeholder;
- collection name;
- token ID;
- ERC-721 or ERC-1155;
- current owner, or owner count for ERC-1155;
- mint/burn/current-state indicator;
- last transfer timestamp when available;
- optional last sale/listing only with marketplace source and `asOf`.

Media uses the existing guarded/proxied media path. SVG, HTML, animation, IPFS,
and data URLs follow the repository's NFT media policy; no active content is
embedded. Use metadata alt text only when it is useful and safe; otherwise use
“{collection} token {id}.”

Marketplace prices are volatile and optional. An unavailable price does not
make the NFT preview fail.

### Block

Visible content:

- block number;
- proposed/finalized/reorged/future status;
- absolute timestamp plus concise relative time;
- transaction count;
- gas utilization;
- proposer or fee recipient;
- blob count when nonzero.

Home/expanded fields may include base fee, burnt fees, reward, withdrawals,
slot/epoch, block hash, parent hash, and MEV attribution. Reorged blocks require
an explicit warning and must not look finalized.

For `/block/countdown/{height}`, show current height, blocks remaining, and a
range/estimated time with “estimate,” never an exact promise.

### Uncle

Uncles are historical pre-Merge data. Show:

- “Historical Ethereum uncle block”;
- number/hash;
- miner;
- timestamp;
- reward where trustworthy;
- relation to the including block when known.

The explanatory label prevents modern users from reading an uncle as a current
proof-of-stake block state.

### Blob

Show:

- blob index when supplied/verified;
- shortened versioned hash;
- containing transaction and block;
- inclusion time;
- size when available;
- availability/retrieval status.

Do not fetch or place the raw blob body in the card response. Blob content may
be arbitrary binary data.

### Verified signature

Show:

- Etherscan verification state;
- signer identity and checksummed address;
- numeric record ID;
- bounded, plain-text message excerpt;
- message hash/signature hash when supplied;
- verification timestamp if available;
- warning: “A valid signature proves control of the signing key for this
  message; it is not an endorsement or safety guarantee.”

The message is untrusted user content:

- strip control characters;
- render as text, never HTML or Markdown;
- do not auto-link URLs;
- collapse whitespace;
- limit the visible excerpt and response byte size;
- never execute or decode embedded Base64/media;
- provide the source link for full inspection.

If documented API support is insufficient, the initial card may show a
route-aware verified-signature page card with signer data only when available.
HTML scraping is not an acceptable fallback.

## Filtered-list, analytics, tool, and generic page cards

These cards are intentionally compact:

- Etherscan + network;
- localized route title;
- one-sentence purpose;
- up to three safe context chips;
- “Open on Etherscan.”

They make no blockchain/API request in the initial release. This provides
complete route coverage at predictable cost.

Unknown Etherscan routes receive:

- title: “Etherscan page”;
- network badge;
- safe, decoded first path segment when it maps to a bounded display token;
- original hostname;
- open action;
- no copied query string;
- telemetry with the normalized route template, never full sensitive query
  values.

## Data model

Add a discriminated response union. Exact field names can adjust during
implementation, but the semantics and provenance requirements are normative.

```ts
type EtherscanNetwork =
  | {
      chainId: 1;
      key: "ethereum";
      label: string;
      status: "current";
    }
  | {
      chainId: 11155111;
      key: "sepolia";
      label: string;
      status: "current";
    }
  | {
      chainId: 560048;
      key: "hoodi";
      label: string;
      status: "current";
    }
  | {
      chainId: 3;
      key: "ropsten";
      label: string;
      status: "legacy";
    }
  | {
      chainId: 4;
      key: "rinkeby";
      label: string;
      status: "legacy";
    }
  | {
      chainId: 5;
      key: "goerli";
      label: string;
      status: "legacy";
    }
  | {
      chainId: 42;
      key: "kovan";
      label: string;
      status: "legacy";
    }
  | {
      chainId: 17000;
      key: "holesky";
      label: string;
      status: "legacy";
    };

type DataSource =
  | "rpc"
  | "etherscan-api"
  | "ens"
  | "6529-api"
  | "token-metadata"
  | "market-data";

type Provenance = {
  source: DataSource;
  asOf: string;
  blockNumber?: string;
  confidence: "authoritative" | "derived" | "attributed";
};

type EtherscanContext = {
  kind:
    | "tab"
    | "filter"
    | "trace"
    | "decoder"
    | "raw"
    | "countdown"
    | "tool";
  labelKey: string;
};

type EtherscanPreviewBase = {
  provider: "etherscan";
  requestUrl: string;
  canonicalUrl: string;
  network: EtherscanNetwork;
  contexts: readonly EtherscanContext[];
  provenance: readonly Provenance[];
  completeness: "complete" | "partial" | "route-only";
  stale: boolean;
};

type EtherscanPreview =
  | (EtherscanPreviewBase & { type: "etherscan.transaction"; transaction: TransactionView })
  | (EtherscanPreviewBase & { type: "etherscan.address"; address: AddressView })
  | (EtherscanPreviewBase & { type: "etherscan.token"; token: TokenView })
  | (EtherscanPreviewBase & { type: "etherscan.nft"; nft: NftView })
  | (EtherscanPreviewBase & { type: "etherscan.block"; block: BlockView })
  | (EtherscanPreviewBase & { type: "etherscan.uncle"; uncle: UncleView })
  | (EtherscanPreviewBase & { type: "etherscan.blob"; blob: BlobView })
  | (EtherscanPreviewBase & { type: "etherscan.signature"; signature: SignatureView })
  | (EtherscanPreviewBase & { type: "etherscan.list"; page: PageView })
  | (EtherscanPreviewBase & { type: "etherscan.analytics"; page: PageView })
  | (EtherscanPreviewBase & { type: "etherscan.tool"; page: PageView })
  | (EtherscanPreviewBase & { type: "etherscan.page"; page: PageView });
```

View fields should remain structured numbers/identifiers plus units, not
preformatted English strings. The client localizes display. Use decimal strings
for blockchain quantities that may exceed JavaScript safe integer precision.

Every optional third-party value has provenance. An array-level source is
acceptable when all fields share the same origin and timestamp. Market values
also include ISO currency and price timestamp.

## URL parser and canonicalization

Create a pure parser under `lib/link-preview/etherscan/`. It returns either a
typed target or `null`; it performs no fetch.

The result contains:

- normalized current/legacy host and network;
- route family and semantic kind;
- validated primary identifier;
- validated secondary identifier;
- allowlisted contexts;
- canonical data cache key;
- canonical display/open URL;
- route-only fallback metadata.

### Identity rules

- Address: checksummed for display, lowercase for cache identity.
- Transaction/block/blob/uncle hash: lowercase for cache identity; preserve
  canonical `0x` representation.
- Numeric block/token/signature IDs: canonical base-10 string with leading
  zeroes removed, except zero remains `0`.
- ENS: normalize with the existing ENS normalization path; resolve on the
  URL's network only where supported.
- Query ordering never changes identity.
- An entity's tab/fragment does not create a second data fetch.
- Meaningful list filters do affect the route-only card cache key after
  normalization.

### Open URL rules

The open action preserves the user's valid original fragment and meaningful
query parameters so it lands in the expected Etherscan view. Strip embedded
credentials and known tracking parameters from the generated canonical URL.
If canonicalization cannot preserve meaning safely, open the original URL
already accepted by the strict host/scheme parser.

## Data acquisition

### Required baseline

Use chain RPC for:

- transaction and receipt;
- block and finality/confirmation context;
- runtime bytecode/address classification;
- native balance;
- ERC interface probes and bounded token metadata calls;
- proxy/delegation inspection where standards permit;
- logs needed for standard action summaries.

The existing Compound public client is mainnet-specific and must not become the
generic Ethereum client. Introduce a network registry with explicit chain ID,
RPC transport, request timeout, and capabilities. Unsupported networks return
route-only/partial cards, never mainnet results.

### Optional Etherscan API V2 enrichment

Use only documented Etherscan API V2 endpoints. Relevant official references:

- [transaction receipt status](https://docs.etherscan.io/api-reference/endpoint/gettxreceiptstatus);
- [transaction execution status](https://docs.etherscan.io/api-reference/endpoint/getstatus);
- [transaction receipt](https://docs.etherscan.io/api-reference/endpoint/ethgettransactionreceipt);
- [contract source and metadata](https://docs.etherscan.io/api-reference/endpoint/getsourcecode);
- [token information](https://docs.etherscan.io/api-reference/endpoint/tokeninfo);
- [native balance](https://docs.etherscan.io/api-reference/endpoint/balance);
- [address name tags](https://docs.etherscan.io/api-reference/endpoint/getaddresstag).

The current [rate limits](https://docs.etherscan.io/resources/rate-limits) and
[common error behavior](https://docs.etherscan.io/resources/common-error-messages)
must drive backoff and monitoring. Free-tier data limits and supported chains
can change. Baseline rendering therefore cannot require PRO-only name tags,
portfolio endpoints, or token holdings.

If enrichment is enabled, add `ETHERSCAN_API_KEY` as a server-only optional
secret:

- document it in `.env.sample`;
- validate it in a dedicated server-only config module;
- never prefix it `NEXT_PUBLIC_`;
- never add it to `next.config.ts` client `env`;
- redact it from errors and telemetry;
- omit API calls cleanly when absent.

No browser request may call Etherscan's API directly with the key.

### Identity and protocol enrichment

- Use the existing ENS service, but require forward/reverse agreement before
  presenting reverse ENS as authoritative identity.
- Use the 6529 profile API only through the existing authenticated/common API
  patterns and make failure non-blocking.
- Convert Compound decoding into a transaction enrichment adapter. Other
  protocol adapters may follow the same evidence-based interface.
- ABI/method registries can suggest a method name, but unverified signatures
  are `derived` and must not become a semantic financial action without event
  evidence.

### Price and media enrichment

- Price is optional and never blocks the card.
- Show source, ISO currency, and `asOf`.
- Hide price when outside the source-specific freshness policy instead of
  silently showing stale market data.
- Reuse guarded NFT/token metadata and image proxy utilities. Do not add a
  general-purpose remote image bypass.

### No HTML scraping

Etherscan pages can change markup, challenge automated clients, and include
user-controlled content. The provider must not use `fetchHtml` or generic Open
Graph scraping to populate structured Etherscan cards. Route-only cards can be
created entirely from the parsed URL and a local route catalog.

## Request, cache, and performance policy

### Budgets

- Preserve the existing batch maximum of five URLs and batch concurrency
  guard.
- One card gets one baseline RPC execution budget plus optional enrichments.
- Baseline RPC operations should use multicall/batching when semantically safe.
- Optional enrichments run concurrently after target validation.
- Per upstream timeout: 2.5 seconds.
- Total structured-preview budget: 6 seconds, below the client request timeout.
- Return partial data when an optional source times out.
- Honor `AbortSignal` through all fetch/RPC layers.
- Cap response size; omit raw logs, source, calldata, bytecode, token arrays,
  and signed messages.

### Server cache

| Resource state | Success TTL | Error/negative TTL |
| --- | ---: | ---: |
| Pending transaction | 10 s | 5 s |
| Recently confirmed, not finalized | 30 s | 10 s |
| Finalized transaction | 24 h | 60 s |
| Recent block, not finalized | 15 s | 5 s |
| Finalized block/uncle | 24 h | 60 s |
| Address balance/type | 45 s | 15 s |
| Contract verification/proxy metadata | 6 h | 5 min |
| Token identity/decimals/standard | 6 h | 5 min |
| Token supply | 5 min | 30 s |
| NFT metadata/owner | 5 min | 30 s |
| Blob inclusion metadata | 24 h after finality | 60 s |
| Route-only list/tool/page | 24 h | n/a |
| Legacy route-only card | 24 h | n/a |

Cache keys include schema version, chain ID, entity kind, canonical identifier,
and data-shaping context only. They exclude tracking parameters and fragments.
Finalized immutable fields may be cached longer in a later release.

### Client cache

The current client uses a uniform five-minute URL cache. Add response cache
metadata or a provider-aware expiry so pending transactions and recent blocks
refresh before five minutes. Do not encode provider behavior by appending
arbitrary suffixes to the original URL. Suggested response fields:

```ts
cache: {
  maxAgeSeconds: number;
  staleWhileRevalidateSeconds?: number;
  immutable?: boolean;
}
```

The client cache key for Etherscan should use the parser's canonical entity
identity where practical, while retaining the original URL for open behavior.

## Resolver and frontend integration

### Handler ownership

Add `createEtherscanHandler()` before ENS and Compound in
`components/drops/view/part/dropPartMarkdown/handlers/index.ts`.

The handler:

- matches only current/recognized legacy Etherscan hosts and valid HTTPS URLs;
- renders `EtherscanLinkPreview`;
- owns all Etherscan routes, including Etherscan address routes containing ENS
  names;
- leaves bare `.eth` names and `app.ens.domains` URLs with the ENS handler;
- leaves `app.compound.finance` URLs with the Compound handler.

Remove Etherscan matching from `createCompoundHandler()`. This eliminates
handler-order ambiguity.

### Server resolver ownership

Add `createEtherscanPlan(targetUrl)` before `createCompoundPlan()` in
`app/api/open-graph/route.ts`. Because the handler and API endpoint can be
called independently, server routing must enforce the same ownership.

Move generic Etherscan transaction fetching out of Compound:

- `etherscan.transaction` is the base response;
- a Compound adapter may populate `protocolActions`;
- `compound.tx` is retired after compatibility migration;
- Compound market/account cards from `app.compound.finance` remain unchanged.

The resolver must build route-only Etherscan cards without first making an
outbound request or running `assertPublicUrl` DNS checks against Etherscan.
Structured upstream calls still use explicit trusted endpoints and guarded
network clients.

### Component structure

Proposed files:

```text
lib/link-preview/etherscan/
  hosts.ts
  parse.ts
  routes.ts
  types.ts
app/api/open-graph/etherscan/
  service.ts
  networkRegistry.ts
  rpc.ts
  etherscanApi.ts
  transaction.ts
  address.ts
  token.ts
  nft.ts
  block.ts
  blob.ts
  signature.ts
  protocolAdapters/
    compound.ts
components/waves/etherscan/
  EtherscanLinkPreview.tsx
  EtherscanCard.tsx
  EtherscanCardFrame.tsx
  TransactionCard.tsx
  AddressCard.tsx
  TokenCard.tsx
  NftCard.tsx
  BlockCard.tsx
  BlobCard.tsx
  SignatureCard.tsx
  PageCard.tsx
  model.ts
  types.ts
```

Implementation may consolidate very small files, but parsing, server
acquisition, view-model construction, and rendering must remain separate and
testable.

`services/api/link-preview-api.ts` adds `EtherscanPreview` to
`LinkPreviewResponse`. `components/waves/LinkPreviewCard.tsx` adds a typed
Etherscan state/render branch if the dedicated handler reuses the generic
fetcher. It must evaluate the centralized `isEtherscanPreview()` guard before
`isEnsPreview()`, so an `etherscan.address` response containing ENS enrichment
cannot be demoted to an ENS card. Avoid `Record<string, unknown>` checks
distributed across UI files; centralize the type guard.

## Responsive design

- Mobile: one-column facts, hashes/address truncate in the middle, actions stay
  reachable without horizontal scrolling.
- Tablet/desktop: two-column fact grid where it improves scan speed.
- Chat: stable-height summary; no hidden focusable content outside the clipped
  area.
- Home: may show one additional row, media, or explanation.
- Long ENS/token/contract names clamp; full value remains available through an
  accessible copy action and is programmatically available to assistive
  technology; any visible-on-demand disclosure also works with keyboard and
  touch.
- User-supplied strings must not determine arbitrary layout classes, colors, or
  URLs.

## Accessibility

The implementation must meet the repository WCAG 2.2 AA standard:

- Card has an accessible resource label, for example “Etherscan transaction
  preview on Ethereum.”
- Use semantic headings without skipping the surrounding Wave hierarchy.
- Links are links and buttons are buttons.
- All actions are keyboard operable with visible focus.
- Pointer targets meet the repository's minimum target guidance, including
  overlay actions.
- Status never relies on color alone.
- Decorative icons are `aria-hidden`; meaningful icons have text.
- Address/hash truncation has a full accessible name.
- Loading keeps the stable frame, uses `aria-busy`, and avoids repetitive live
  announcements.
- Pending-to-confirmed updates use a polite announcement only when the user is
  still viewing the card.
- Errors include a useful text state and retry/open action.
- Media has meaningful alt text or is correctly decorative.
- Contrast is verified in default, hover, focus, disabled, warning, success,
  and legacy states.
- Reduced-motion preferences disable nonessential status animations.
- No hidden/clipped focus target remains tabbable.

Automated axe checks supplement, not replace, keyboard and screen-reader
verification.

## Localization

All new user-facing copy is added to the repository message catalog for:

- `en-US`;
- `en-GB`;
- `fr-FR`;
- `es-ES`;
- `de-DE`.

Requirements:

- Use the repository helpers in `i18n/format.ts` for counts, balances,
  percentages, compact values, currency, dates, and relative time. Those
  helpers provide the shared `Intl` behavior; touched UI must not introduce
  direct `toLocaleString()` or ad hoc `Intl` formatters.
- Keep addresses, hashes, selectors, symbols, token IDs, and chain IDs
  invariant.
- Keep untrusted onchain/user text unchanged except for safety sanitization;
  do not machine-translate token names, ENS names, labels, or signed messages.
- Localize units and explanatory copy around structured quantities.
- Use complete message templates, not concatenated fragments.
- Provide plural forms for confirmations, blocks remaining, owners, transfers,
  and blobs.
- Test longer German/French strings and compact chat widths.
- Price values include explicit ISO currency; do not assume `$` always means
  USD.

## Security, privacy, and trust

### Threats

- lookalike Etherscan hosts;
- SSRF through crafted URLs, redirects, RPC URLs, or metadata;
- oversized responses and decompression/body abuse;
- malicious token names, SVGs, metadata, signed messages, revert reasons, and
  labels;
- phishing links embedded in signed messages or metadata;
- false safety implications from verified source, labels, or signatures;
- API-key exposure;
- telemetry leaking full addresses/query payloads when not required;
- stale or cross-chain data presented as current.

### Controls

- strict HTTPS/exact-host parser and default port;
- no credentials in URLs;
- no Etherscan HTML scraping;
- fixed server-side RPC/API endpoint registry;
- standard public URL guard for metadata/media;
- byte, item, time, redirect, and concurrency caps;
- render untrusted strings as text;
- sanitize control/bidirectional characters according to the repository's
  display policy while preserving a copyable canonical identifier;
- no automatic linkification inside signed messages, revert reasons, token
  descriptions, or labels;
- server-only optional API key with redaction;
- explicit chain ID in every cache key and response;
- provenance and staleness metadata;
- “Source code verified” and “Signature valid” wording that does not imply
  safety;
- no wallet connection or transaction/signature controls;
- generic fallback for malformed/unsupported data rather than unsafe best
  guesses.

The card may show an attributable Etherscan reputation label, but the local
copy must say “Etherscan label” or “Reported by Etherscan.” Conflicting sources
produce an informational conflict state, not a merged assertion.

## Loading, partial, empty, stale, and error states

| State | Required behavior |
| --- | --- |
| Loading | Stable skeleton matching final card geometry; provider/network known from parser |
| Partial | Show available identity and open action; say which class of detail is unavailable without exposing internal errors |
| Not found | “Transaction not found on Sepolia” or equivalent network-specific text; do not imply mainnet |
| Timeout | Preserve route/entity identity, show retry and open actions |
| Rate limited | Serve stale data when safe; otherwise partial card; back off upstream |
| Stale price | Hide price or label exact `asOf`; never silently display |
| Pending | Short refresh interval while visible; no alarming error state |
| Legacy network | Route-only archived-network explanation |
| Unknown route | Safe generic Etherscan page card |
| Unsupported current network capability | Route-only card with “Live data unavailable” |

Do not expose RPC URLs, stack traces, provider messages, API response bodies,
or keys to the client.

## Observability

Record privacy-bounded metrics:

- parser outcome by network and route family;
- structured, route-only, partial, stale, fallback, and error counts;
- upstream latency/error/rate-limit by provider and operation;
- cache hit/miss and response age;
- transaction interpretation level: standard, protocol, method-only, generic;
- unknown normalized route template;
- render and retry outcomes;
- pending-to-confirmed refresh success.

Do not log full signed messages, calldata, revert payloads, metadata bodies, API
keys, or full query strings. Hash entity identifiers for aggregate telemetry
unless a raw public identifier is essential to an already-approved diagnostic
path.

Suggested product events:

- `link_preview_etherscan_rendered`;
- `link_preview_etherscan_partial`;
- `link_preview_etherscan_opened`;
- `link_preview_etherscan_copied`;
- `link_preview_etherscan_retried`;
- `link_preview_etherscan_unknown_route`.

Each includes network, route family, card kind, state, cache status, and latency
bucket, not user content.

## File-by-file implementation plan

### New

- `lib/link-preview/etherscan/hosts.ts`: exact host/network registry, including
  legacy hosts.
- `lib/link-preview/etherscan/routes.ts`: local route catalog for collection,
  analytics, tool, and generic page titles.
- `lib/link-preview/etherscan/parse.ts`: pure URL parsing, validation,
  canonicalization, context extraction, and cache identity.
- `lib/link-preview/etherscan/types.ts`: parser target types shared across
  client-safe code.
- `app/api/open-graph/etherscan/*`: plan creation, network clients, bounded
  acquisition, structured response builders, and protocol adapters.
- `components/waves/etherscan/*`: typed view-model and resource card renderers.
- Focused unit/component tests mirroring those files.

### Modify

- `components/drops/view/part/dropPartMarkdown/handlers/index.ts`: register
  Etherscan before ENS/Compound.
- `components/drops/view/part/dropPartMarkdown/handlers/compound.tsx`: restrict
  to `app.compound.finance`.
- `lib/ens/detect.ts`: stop treating Etherscan address URLs as owned by the ENS
  provider; retain bare names and ENS app URLs.
- `app/api/open-graph/route.ts`: add Etherscan plan before Compound and ensure
  Etherscan address URLs do not bypass route parsing through the current global
  ENS pre-check.
- `app/api/open-graph/compound/service.ts`: remove generic Etherscan transaction
  target creation; expose Compound decoding as an evidence-based adapter.
- `components/waves/compound/CompoundCard.tsx` and
  `components/waves/compound/types.ts`: retire generic `compound.tx`; preserve
  market/account cards.
- `services/api/link-preview-api.ts`: add the Etherscan response union, type
  guards, canonical provider cache behavior, and response-aware TTL.
- `components/waves/LinkPreviewCard.tsx`: typed Etherscan render state and chat
  frame kind if the dedicated handler uses this common entrypoint.
- `components/waves/open-graph-preview/cards.tsx`: only if needed to support
  accessible entity copy actions without nesting interactive elements.
- `.env.sample` and a new/existing server env module: optional
  `ETHERSCAN_API_KEY`.
- `i18n/messages/en-US.ts`, `en-GB.ts`, `fr-FR.ts`, `es-ES.ts`, and `de-DE.ts`:
  card labels, statuses, contexts, errors, actions, and plural messages.
- `config/securityHeaders.ts` or `config/nextConfig.ts`: only if an explicitly
  selected new media/API host is required; do not broaden wildcard policy as a
  shortcut.

### Documentation when implementing

- Update `ops/docs/waves/link-previews/feature-web3-preview-cards.md` with
  supported Etherscan behavior, route categories, loading/partial/error states,
  and safety wording.
- Update `ops/help/help-index.json`, run `seize run help-index:sync`, and commit
  the generated `public/help-index.json` so `@help6529` knows what Etherscan
  cards show and what they do not do.
- Update any link-preview architecture doc that still describes Compound as
  the owner of Etherscan URLs.

No current user-facing documentation or Help Bot claim should change in this
spec-only PR because the feature is not yet shipped.

## Test plan

### URL parser table tests

For every route family in this document, test:

- current host and network classification;
- `www` normalization;
- trailing slash;
- uppercase/lowercase hex;
- valid address/hash/token ID/block/signature ID;
- tab/context extraction;
- query-order independence;
- tracking-parameter removal from cache identity;
- entity-context promotion;
- route-only title/context;
- unknown-route fallback;
- legacy host behavior.
- `foo.etherscan.io` and other unknown subdomains using the ordinary external
  link path;
- `/search?q=` entity promotion remaining on the URL host's network for
  mainnet, Sepolia, Hoodi, and legacy hosts.

Reject:

- lookalike hosts;
- HTTP, credentials, and non-default ports;
- malformed hashes/addresses/percent encoding;
- conflicting duplicate identity keys;
- negative/unsafe numeric values;
- overlong URL/path/query values;
- control characters;
- unsupported subdomains.

Include regression cases proving:

- a normal Etherscan transaction is `etherscan.transaction`, not
  `compound.tx`;
- a true Compound action is an Etherscan transaction with Compound enrichment;
- an Etherscan address is owned by Etherscan even when it resolves to ENS;
- bare `.eth` and `app.ens.domains` remain ENS previews;
- `app.compound.finance` remains a Compound preview.

### Server service tests

- success, pending, reverted, replacement, dropped/unknown transaction states;
- standard native/ERC-20/ERC-721/ERC-1155 actions;
- contract deployment and EIP-7702 delegation;
- unknown selector and conflicting decode evidence;
- RPC timeout, malformed response, rate limit, absent optional key, and partial
  enrichment;
- correct chain isolation;
- EOA/contract/delegated classification;
- source-verified/proxy metadata wording;
- hostile token metadata and decimals failure;
- NFT owner/media fallback;
- block finality/reorg/countdown;
- uncle/blob;
- verified-signature sanitization and bounds;
- TTL and cache-key policy;
- abort propagation and response-size limits;
- route-only cards cause no upstream fetch.

### Component tests

For every card kind:

- chat and home variants;
- loading, complete, partial, stale, not found, timeout, rate limit, legacy,
  and unknown route;
- long identity/name/value;
- missing optional fields;
- copy/open/retry;
- correct target and `rel`;
- no nested interactive elements;
- no color-only status;
- localized numbers/dates/currency/plurals;
- untrusted strings render as text;
- media alt/fallback;
- keyboard focus order;
- axe assertions.

### Integration and browser tests

- paste each representative Etherscan URL into a Wave drop and confirm the
  specialized card;
- mixed batch of five links, including pending and route-only cards;
- handler precedence with ENS, Compound, and generic links;
- slow/failed enrichment still renders within the stable frame;
- mobile width, desktop width, 200% zoom, keyboard-only, reduced motion, and
  supported locales;
- pending transaction refreshes to success without a page reload;
- link actions remain usable when the card frame clips visual overflow.

### Required implementation validation

At minimum:

```text
./bin/6529 run lint:changed
./bin/6529 run typecheck:changed
./bin/6529 run react-doctor:diff
./bin/6529 run test -- <focused Etherscan/link-preview tests>
./bin/6529 run help-index:sync
./bin/6529 run build
./bin/6529 exec codex-diff-check
```

Use the repository's exact Jest flag conventions when translating the focused
test command. Run a targeted Playwright suite for Wave link previews.

## Rollout

### Phase 0: parser and route-only coverage

- Land parser, host policy, route catalog, response union, and route-only cards.
- Add telemetry for route families and unknown routes.
- Keep generic structured fetching disabled.

### Phase 1: core entities

- Enable transaction, address/contract, token, NFT, and block cards on mainnet.
- Migrate ENS/Compound ownership.
- Enable Sepolia and Hoodi only after network-specific integration fixtures
  pass.

### Phase 2: specialized entities

- Enable blob, uncle, countdown, and verified-signature cards.
- Add optional protocol and price enrichments.

### Phase 3: default-on and adapter extraction

- Compare error/fallback/latency against generic previews.
- Make Etherscan provider default-on.
- Extract a documented chain-explorer adapter before adding other
  Etherscan-family domains.

The rollout switch may be a server-side provider registry flag or deployment
configuration, but must not create a client-exposed secret. Turning it off
returns the generic route-aware Etherscan card rather than restoring incorrect
Compound labeling.

## Acceptance criteria

- Every URL family in the taxonomy maps deterministically to an entity,
  entity-context, filtered-list, analytics, tool, or safe generic Etherscan
  card.
- Unknown future Etherscan routes render a useful generic Etherscan card.
- Mainnet, Sepolia, Hoodi, and legacy host behavior are explicit and
  cross-chain cache/fetch contamination is impossible.
- Ordinary transactions are never labeled Compound.
- Compound appears only when evidence identifies a Compound action.
- The initial card is understandable without opening Etherscan.
- Structured cards remain useful when optional enrichment fails.
- No Etherscan HTML scraping or client-exposed Etherscan API key is introduced.
- No card connects a wallet or initiates a signature/transaction.
- Untrusted metadata and signed content cannot create active HTML, links, or
  executable media.
- Status, provenance, timestamp, network, and staleness are clear.
- Chat/mobile layouts do not overflow or hide focusable actions.
- All user-facing copy is localized across the supported catalogs.
- WCAG 2.2 AA checks, focused tests, build, and Help Bot sync pass.
- Product telemetry can identify unsupported route families and reliability
  problems without collecting sensitive payloads.

## Resolved product choices

- **One card per URL format?** No. One provider, a small semantic card family,
  and a comprehensive parser produces consistency without route-specific
  component sprawl.
- **Show live rows for list URLs?** No. A scoped route-aware summary is faster,
  less noisy, and more reliable.
- **Use Etherscan HTML?** No. Use route parsing, RPC, and documented APIs.
- **Require Etherscan PRO data?** No. Paid enrichments are optional.
- **Keep Etherscan transaction handling in Compound?** No. Compound becomes an
  evidence-based enrichment.
- **Treat verified source/signature as safe?** No. Display exactly what was
  verified and an explicit caveat.
- **Support all Etherscan-family chains immediately?** No. Build the adapter
  boundary now; add domains deliberately with correct chain configuration.
- **What happens to future routes?** Safe generic Etherscan card plus telemetry.

## Implementation review checklist

- [ ] Route inventory compared against the live Etherscan navigation again at
      implementation time.
- [ ] Exact host/network list compared against current supported-chain and
      status documentation.
- [ ] Parser fixtures added for every table row.
- [ ] Resolver precedence proves Etherscan ownership.
- [ ] Compound and ENS regressions are covered.
- [ ] RPC/API calls are server-only, bounded, abortable, and chain-specific.
- [ ] Optional API key is absent from client bundles and logs.
- [ ] Structured response includes provenance and freshness.
- [ ] All card variants and failure states are designed.
- [ ] Keyboard, screen-reader, contrast, zoom, reduced-motion, and touch checks
      are complete.
- [ ] Locale catalogs and long-string QA are complete.
- [ ] Security review covers host matching, SSRF, media, untrusted text,
      signatures, and cross-chain cache keys.
- [ ] User docs and Help Bot index match the shipped behavior.
- [ ] Metrics and rollout switch are operational before default-on.
