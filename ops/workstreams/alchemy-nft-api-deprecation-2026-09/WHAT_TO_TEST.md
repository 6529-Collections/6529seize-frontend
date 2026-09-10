# What to test: frontend address-only collection selection

Run these checks on an environment containing FE PR #3897. BE fallback checks
also require a reachable backend. Record the environment, deployed version,
browser/device, input, expected result, and actual result for any failure.
This checklist describes manual validation still to be performed after deployment.

## Collection lookup in an xTDH grant

Open your profile's xTDH tab, Granted view, then Create New Grant. Use an
account permitted to create grants. Stop before submitting unless you intend
to create a real grant.

- [ ] The collection input asks for an Ethereum contract address and explains
  that collection-name search is unavailable.
- [ ] Enter `memes`, an ENS name, a marketplace URL, an incomplete address,
  and non-hex characters. Each shows address guidance, with no collection
  lookup request or endless spinner.
- [ ] Paste a known Ethereum ERC-721 contract, for example Gradients:
  `0x0C58Ef43fF3032005e472cB5709f8908aCb00205`. Its metadata should appear.
  Repeat in lowercase and with surrounding spaces.
- [ ] Lookup alone does not select the collection or submit anything. Click
  the result to select it; repeat using ArrowDown and Enter.
- [ ] Press ArrowDown while results are empty, then paste a valid address.
  Enter still selects the result. Escape closes results; focus reopens them.
- [ ] Change the address while lookup is pending. A result for the previous
  input must not become selectable under the new input.
- [ ] Paste a known ERC-1155 contract, such as The Memes:
  `0x33FD426905F149f8376e227d0C9D3340AaD17aF1`. It cannot be selected by
  mouse or Enter in this ERC-721 picker.
- [ ] A valid address with no metadata shows a not-found message or an
  unsupported-type message (depending on what Alchemy returns), not a selected
  collection.
- [ ] There is no Hide/Show spam search toggle. Treat a returned address as
  metadata only, not a spam/authenticity verdict.

## Existing selection features

- [ ] Select an ERC-721 collection, add individual token IDs and a range
  (for example `1, 5, 10-12`), remove one, edit the text, and clear tokens.
- [ ] Select All and deselect work as before; existing limits/errors still apply.
- [ ] Clear the collection, select another, and verify old token selections
  do not transfer to the new collection.
- [ ] Confirm the xTDH amount, validity, and submit-validation steps still work.
  If you deliberately submit, use the normal test-environment procedure.
- [ ] Reopen a surface with saved/default selections; addresses and token scope
  still hydrate correctly.

## Failure, fallback, and recovery

Use browser request blocking only in your testing session; remove the rules afterward.

- [ ] Block the site's `/api/alchemy/contract?*` request. Use a fresh contract
  address or reload to avoid the five-minute client cache. The request should
  fall back to `<API_ENDPOINT>/alchemy-proxy/contract?*` and show metadata.
- [ ] Block both contract routes. Wait for request retries to finish: the
  picker shows a lookup error and Try again, not a false not-found result.
  Remove blocking and click Try again; the lookup recovers.
- [ ] Activate Try again with the keyboard. Focus returns to the contract
  input while the retry control is hidden during loading; it must not fall
  back to the page body.
- [ ] Check Network: the updated picker never calls either `/collections`
  search route. Token-metadata and owner-NFT requests are expected.
- [ ] Open the site's `/api/alchemy/collections?query=memes` directly:
  expect HTTP 410, the address-only error, and `Cache-Control: no-store`.
- [ ] After paired BE PR #1974 is deployed, request
  `<API_ENDPOINT>/alchemy-proxy/collections?query=memes` directly. Expect
  HTTP 410, the address-only error, and `Cache-Control: no-store`. This is a
  separate BE deployment check; the FE release alone does not guarantee it.

The shared network/open-data E2E empty-query check accepts either the legacy
400 (`query is required`) or retired 410 (address-only error), with the matching
body and `no-store` header. This supports both deployments; a passing shared
check does not prove retirement. The direct post-migration checks above and
the route unit test still require 410.

## Shared picker regression and accessibility

- [ ] In Meme Card Set configuration, add valid Meme card IDs/ranges and
  exercise the existing card-name search. Both remain available: this is a
  fixed-contract flow using 6529 card search, not collection discovery.
- [ ] Test keyboard focus, screen-reader announcements for loading/error/input
  guidance, and retry-button access.
- [ ] With a screen reader active, keep focus in the contract input while a
  lookup transitions from loading to failure (use the blocking steps above).
  Confirm the loading and final error messages are announced without moving
  focus. Record the screen reader and browser used; DOM tests alone do not
  verify spoken announcements.
- [ ] Check narrow mobile width, desktop, and 200% zoom for clipping/overlap.
- [ ] Test English and a non-English browser locale. New lookup messages
  currently fall back to English; no missing-message error should occur.

## Exclusions to track separately

Core's shipped renderer and Distribution Plan's external allowlist search are
not migrated by these PRs. See [Actual changes](ACTUAL_CHANGES.md) for the
remaining owner audit and deployment/compatibility limits.
